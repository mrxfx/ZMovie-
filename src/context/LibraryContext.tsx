import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  Timestamp,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { OperationType, handleFirestoreError } from '../lib/firestoreError';
import { useAuth } from './AuthContext';
import type {
  HistoryItem,
  MediaSummary,
  SearchHistoryEntry,
  UserPreferences,
  WatchProgressItem,
  WatchlistItem,
} from '../types/media';
import {
  createCanonicalMediaId,
  mergeHistoryItems,
  mergeWatchProgressItems,
  mergeWatchlistItems,
} from '../utils/watchProgress';

const STORAGE_KEYS = {
  watchlist: 'zyvomovie_watchlist_v1',
  progress: 'zyvomovie_progress_v1',
  history: 'zyvomovie_history_v1',
  recent: 'zyvomovie_recent_v1',
  search: 'zyvomovie_search_history_v1',
  prefs: 'zyvomovie_prefs_v1',
};

const DEFAULT_PREFERENCES: UserPreferences = {
  theme: 'light',
  language: 'en-US',
  autoplayNext: true,
  preferredAnimeAudio: 'sub',
  saveSearchHistory: true,
  saveWatchHistory: true,
  updatedAtMs: 0,
};

function readLocalJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeLocalJson<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore storage quota failures
  }
}

function toMillis(val: unknown): number {
  if (val instanceof Timestamp) return val.toMillis();
  if (typeof val === 'number') return val;
  if (typeof val === 'object' && val !== null && 'seconds' in val) {
    return Number((val as { seconds: number }).seconds) * 1000;
  }
  return Date.now();
}

interface LibraryContextValue {
  watchlist: WatchlistItem[];
  watchProgress: WatchProgressItem[];
  history: HistoryItem[];
  recentlyViewed: MediaSummary[];
  searchHistory: SearchHistoryEntry[];
  preferences: UserPreferences;
  syncStatus: 'guest-local' | 'cloud-synced' | 'email-unverified';
  isInWatchlist: (mediaId: string) => boolean;
  toggleWatchlist: (media: MediaSummary) => Promise<boolean>;
  removeFromWatchlist: (mediaId: string) => Promise<void>;
  saveWatchProgress: (input: Omit<WatchProgressItem, 'uid' | 'updatedAtMs'>) => Promise<void>;
  removeWatchProgress: (mediaId: string) => Promise<void>;
  recordHistoryEntry: (input: Omit<HistoryItem, 'uid' | 'historyId' | 'watchedAtMs'>) => Promise<void>;
  clearHistory: () => Promise<void>;
  recordRecentlyViewed: (media: MediaSummary) => void;
  addSearchQuery: (query: string) => void;
  clearSearchHistory: () => void;
  updatePreferences: (patch: Partial<UserPreferences>) => Promise<void>;
}

const LibraryContext = createContext<LibraryContextValue | null>(null);

export function LibraryProvider({ children }: { children: React.ReactNode }) {
  const { user, authReady } = useAuth();
  const isCloudVerified = Boolean(user && user.emailVerified);

  const [watchlist, setWatchlist] = useState<WatchlistItem[]>(() =>
    readLocalJson(STORAGE_KEYS.watchlist, [])
  );
  const [watchProgress, setWatchProgress] = useState<WatchProgressItem[]>(() =>
    readLocalJson(STORAGE_KEYS.progress, [])
  );
  const [history, setHistory] = useState<HistoryItem[]>(() =>
    readLocalJson(STORAGE_KEYS.history, [])
  );
  const [recentlyViewed, setRecentlyViewed] = useState<MediaSummary[]>(() =>
    readLocalJson(STORAGE_KEYS.recent, [])
  );
  const [searchHistory, setSearchHistory] = useState<SearchHistoryEntry[]>(() =>
    readLocalJson(STORAGE_KEYS.search, [])
  );
  const [preferences, setPreferences] = useState<UserPreferences>(() => ({
    ...DEFAULT_PREFERENCES,
    ...readLocalJson<Partial<UserPreferences>>(STORAGE_KEYS.prefs, {}),
  }));

  // Apply light/dark theme class cleanly to <html>
  useEffect(() => {
    const root = document.documentElement;
    if (preferences.theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [preferences.theme]);

  // Attach Firestore real-time listeners & perform safe guest-to-account sync when verified user signs in
  useEffect(() => {
    if (!authReady || !user || !user.emailVerified) {
      return;
    }

    const uid = user.uid;
    let unsubWatchlist = () => {};
    let unsubProgress = () => {};
    let unsubHistory = () => {};
    let unsubPrefs = () => {};

    // Sync local guest data into Firestore once on sign-in
    const syncGuestToCloud = async () => {
      const guestWatchlist = readLocalJson<WatchlistItem[]>(STORAGE_KEYS.watchlist, []);
      const guestProgress = readLocalJson<WatchProgressItem[]>(STORAGE_KEYS.progress, []);
      const guestHistory = readLocalJson<HistoryItem[]>(STORAGE_KEYS.history, []);

      if (guestWatchlist.length === 0 && guestProgress.length === 0 && guestHistory.length === 0) {
        return;
      }

      try {
        const batch = writeBatch(db);
        for (const item of guestWatchlist) {
          const mediaId = createCanonicalMediaId(item.mediaType, item.mediaId);
          batch.set(
            doc(db, 'users', uid, 'watchlist', mediaId),
            {
              uid,
              mediaId,
              mediaType: item.mediaType,
              title: item.title.slice(0, 200),
              posterPath: (item.posterPath || '').slice(0, 400000),
              releaseYear: (item.releaseYear || '').slice(0, 10),
              voteAverage: Number(item.voteAverage || 0),
              ...(item.tmdbId ? { tmdbId: item.tmdbId } : {}),
              ...(item.malId ? { malId: item.malId } : {}),
              addedAt: serverTimestamp(),
            },
            { merge: true }
          );
        }
        for (const item of guestProgress) {
          const mediaId = createCanonicalMediaId(item.mediaType, item.mediaId);
          batch.set(
            doc(db, 'users', uid, 'watchProgress', mediaId),
            {
              uid,
              mediaId,
              mediaType: item.mediaType,
              title: item.title.slice(0, 200),
              posterPath: (item.posterPath || '').slice(0, 400000),
              backdropPath: (item.backdropPath || '').slice(0, 400000),
              ...(item.tmdbId ? { tmdbId: item.tmdbId } : {}),
              ...(item.malId ? { malId: item.malId } : {}),
              ...(item.season ? { season: item.season } : {}),
              ...(item.episode ? { episode: item.episode } : {}),
              ...(item.subOrDub ? { subOrDub: item.subOrDub } : {}),
              currentTime: Math.max(0, item.currentTime),
              duration: Math.max(0, item.duration),
              progressPercent: Math.min(100, Math.max(0, item.progressPercent)),
              completed: Boolean(item.completed),
              updatedAt: serverTimestamp(),
            },
            { merge: true }
          );
        }
        await batch.commit();
        writeLocalJson(STORAGE_KEYS.watchlist, []);
        writeLocalJson(STORAGE_KEYS.progress, []);
        writeLocalJson(STORAGE_KEYS.history, []);
      } catch (error) {
        console.error('Guest-to-account sync deferred:', error);
      }
    };

    void syncGuestToCloud();

    unsubWatchlist = onSnapshot(
      collection(db, 'users', uid, 'watchlist'),
      (snap) => {
        const remote = snap.docs.map((d) => {
          const data = d.data();
          return {
            uid,
            mediaId: String(data.mediaId || d.id),
            mediaType: data.mediaType,
            title: String(data.title || 'Untitled'),
            posterPath: String(data.posterPath || ''),
            releaseYear: String(data.releaseYear || ''),
            voteAverage: Number(data.voteAverage || 0),
            tmdbId: typeof data.tmdbId === 'number' ? data.tmdbId : undefined,
            malId: typeof data.malId === 'number' ? data.malId : undefined,
            addedAtMs: toMillis(data.addedAt),
          } as WatchlistItem;
        });
        const guest = readLocalJson<WatchlistItem[]>(STORAGE_KEYS.watchlist, []);
        setWatchlist(mergeWatchlistItems(remote, guest, uid));
      },
      (err) => handleFirestoreError(err, OperationType.LIST, `users/${uid}/watchlist`)
    );

    unsubProgress = onSnapshot(
      collection(db, 'users', uid, 'watchProgress'),
      (snap) => {
        const remote = snap.docs.map((d) => {
          const data = d.data();
          return {
            uid,
            mediaId: String(data.mediaId || d.id),
            mediaType: data.mediaType,
            title: String(data.title || 'Untitled'),
            posterPath: String(data.posterPath || ''),
            backdropPath: String(data.backdropPath || ''),
            tmdbId: typeof data.tmdbId === 'number' ? data.tmdbId : undefined,
            malId: typeof data.malId === 'number' ? data.malId : undefined,
            season: typeof data.season === 'number' ? data.season : undefined,
            episode: typeof data.episode === 'number' ? data.episode : undefined,
            subOrDub: data.subOrDub === 'dub' ? 'dub' : data.subOrDub === 'sub' ? 'sub' : undefined,
            currentTime: Number(data.currentTime || 0),
            duration: Number(data.duration || 0),
            progressPercent: Number(data.progressPercent || 0),
            completed: Boolean(data.completed),
            updatedAtMs: toMillis(data.updatedAt),
          } as WatchProgressItem;
        });
        const guest = readLocalJson<WatchProgressItem[]>(STORAGE_KEYS.progress, []);
        setWatchProgress(mergeWatchProgressItems(remote, guest, uid));
      },
      (err) => handleFirestoreError(err, OperationType.LIST, `users/${uid}/watchProgress`)
    );

    unsubHistory = onSnapshot(
      collection(db, 'users', uid, 'history'),
      (snap) => {
        const remote = snap.docs.map((d) => {
          const data = d.data();
          return {
            uid,
            historyId: String(data.historyId || d.id),
            mediaId: String(data.mediaId || ''),
            mediaType: data.mediaType,
            title: String(data.title || 'Untitled'),
            posterPath: String(data.posterPath || ''),
            tmdbId: typeof data.tmdbId === 'number' ? data.tmdbId : undefined,
            malId: typeof data.malId === 'number' ? data.malId : undefined,
            season: typeof data.season === 'number' ? data.season : undefined,
            episode: typeof data.episode === 'number' ? data.episode : undefined,
            watchedAtMs: toMillis(data.watchedAt),
          } as HistoryItem;
        });
        const guest = readLocalJson<HistoryItem[]>(STORAGE_KEYS.history, []);
        setHistory(mergeHistoryItems(remote, guest, uid));
      },
      (err) => handleFirestoreError(err, OperationType.LIST, `users/${uid}/history`)
    );

    unsubPrefs = onSnapshot(
      doc(db, 'users', uid, 'preferences', 'settings'),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          const next: UserPreferences = {
            theme: data.theme === 'dark' ? 'dark' : 'light',
            language: String(data.language || 'en-US'),
            autoplayNext: Boolean(data.autoplayNext ?? true),
            preferredAnimeAudio: data.preferredAnimeAudio === 'dub' ? 'dub' : 'sub',
            saveSearchHistory: Boolean(data.saveSearchHistory ?? true),
            saveWatchHistory: Boolean(data.saveWatchHistory ?? true),
            updatedAtMs: toMillis(data.updatedAt),
          };
          setPreferences(next);
          writeLocalJson(STORAGE_KEYS.prefs, next);
        }
      },
      (err) =>
        handleFirestoreError(err, OperationType.GET, `users/${uid}/preferences/settings`)
    );

    return () => {
      unsubWatchlist();
      unsubProgress();
      unsubHistory();
      unsubPrefs();
    };
  }, [authReady, user]);

  const isInWatchlist = useCallback(
    (mediaId: string) => watchlist.some((item) => item.mediaId === mediaId),
    [watchlist]
  );

  const toggleWatchlist = useCallback(
    async (media: MediaSummary): Promise<boolean> => {
      const mediaId = createCanonicalMediaId(media.mediaType, media.id);
      const exists = watchlist.some((i) => i.mediaId === mediaId);

      if (isCloudVerified && user) {
        const path = `users/${user.uid}/watchlist/${mediaId}`;
        try {
          if (exists) {
            await deleteDoc(doc(db, 'users', user.uid, 'watchlist', mediaId));
            return false;
          } else {
            await setDoc(doc(db, 'users', user.uid, 'watchlist', mediaId), {
              uid: user.uid,
              mediaId,
              mediaType: media.mediaType,
              title: media.title.slice(0, 200),
              posterPath: (media.posterPath || '').slice(0, 400000),
              releaseYear: (media.releaseYear || '').slice(0, 10),
              voteAverage: Number(media.voteAverage || 0),
              ...(media.tmdbId ? { tmdbId: media.tmdbId } : {}),
              ...(media.malId ? { malId: media.malId } : {}),
              addedAt: serverTimestamp(),
            });
            return true;
          }
        } catch (error) {
          handleFirestoreError(error, exists ? OperationType.DELETE : OperationType.CREATE, path);
        }
      }

      if (exists) {
        const next = watchlist.filter((i) => i.mediaId !== mediaId);
        setWatchlist(next);
        writeLocalJson(STORAGE_KEYS.watchlist, next);
        return false;
      }

      const item: WatchlistItem = {
        uid: 'guest',
        mediaId,
        mediaType: media.mediaType,
        title: media.title.slice(0, 200),
        posterPath: (media.posterPath || '').slice(0, 400000),
        releaseYear: (media.releaseYear || '').slice(0, 10),
        voteAverage: Number(media.voteAverage || 0),
        tmdbId: media.tmdbId,
        malId: media.malId,
        addedAtMs: Date.now(),
      };
      const next = [item, ...watchlist];
      setWatchlist(next);
      writeLocalJson(STORAGE_KEYS.watchlist, next);
      return true;
    },
    [isCloudVerified, user, watchlist]
  );

  const removeFromWatchlist = useCallback(
    async (mediaId: string) => {
      if (isCloudVerified && user) {
        const path = `users/${user.uid}/watchlist/${mediaId}`;
        try {
          await deleteDoc(doc(db, 'users', user.uid, 'watchlist', mediaId));
          return;
        } catch (error) {
          handleFirestoreError(error, OperationType.DELETE, path);
        }
      }
      const next = watchlist.filter((i) => i.mediaId !== mediaId);
      setWatchlist(next);
      writeLocalJson(STORAGE_KEYS.watchlist, next);
    },
    [isCloudVerified, user, watchlist]
  );

  const saveWatchProgress = useCallback(
    async (input: Omit<WatchProgressItem, 'uid' | 'updatedAtMs'>) => {
      const mediaId = createCanonicalMediaId(input.mediaType, input.mediaId);

      if (isCloudVerified && user) {
        const path = `users/${user.uid}/watchProgress/${mediaId}`;
        try {
          await setDoc(doc(db, 'users', user.uid, 'watchProgress', mediaId), {
            uid: user.uid,
            mediaId,
            mediaType: input.mediaType,
            title: input.title.slice(0, 200),
            posterPath: (input.posterPath || '').slice(0, 400000),
            backdropPath: (input.backdropPath || '').slice(0, 400000),
            ...(input.tmdbId ? { tmdbId: input.tmdbId } : {}),
            ...(input.malId ? { malId: input.malId } : {}),
            ...(input.season ? { season: input.season } : {}),
            ...(input.episode ? { episode: input.episode } : {}),
            ...(input.subOrDub ? { subOrDub: input.subOrDub } : {}),
            currentTime: Math.max(0, input.currentTime),
            duration: Math.max(0, input.duration),
            progressPercent: Math.min(100, Math.max(0, input.progressPercent)),
            completed: Boolean(input.completed),
            updatedAt: serverTimestamp(),
          });
          return;
        } catch (error) {
          handleFirestoreError(error, OperationType.WRITE, path);
        }
      }

      const item: WatchProgressItem = {
        ...input,
        uid: 'guest',
        mediaId,
        updatedAtMs: Date.now(),
      };
      setWatchProgress((prev) => {
        const next = [item, ...prev.filter((p) => p.mediaId !== mediaId)];
        writeLocalJson(STORAGE_KEYS.progress, next);
        return next;
      });
    },
    [isCloudVerified, user]
  );

  const removeWatchProgress = useCallback(
    async (mediaId: string) => {
      if (isCloudVerified && user) {
        const path = `users/${user.uid}/watchProgress/${mediaId}`;
        try {
          await deleteDoc(doc(db, 'users', user.uid, 'watchProgress', mediaId));
          return;
        } catch (error) {
          handleFirestoreError(error, OperationType.DELETE, path);
        }
      }
      setWatchProgress((prev) => {
        const next = prev.filter((p) => p.mediaId !== mediaId);
        writeLocalJson(STORAGE_KEYS.progress, next);
        return next;
      });
    },
    [isCloudVerified, user]
  );

  const recordHistoryEntry = useCallback(
    async (input: Omit<HistoryItem, 'uid' | 'historyId' | 'watchedAtMs'>) => {
      if (!preferences.saveWatchHistory) return;
      const mediaId = createCanonicalMediaId(input.mediaType, input.mediaId);
      const historyId = `${mediaId}_${Date.now()}`;

      if (isCloudVerified && user) {
        const path = `users/${user.uid}/history/${historyId}`;
        try {
          await setDoc(doc(db, 'users', user.uid, 'history', historyId), {
            uid: user.uid,
            historyId,
            mediaId,
            mediaType: input.mediaType,
            title: input.title.slice(0, 200),
            posterPath: (input.posterPath || '').slice(0, 400000),
            ...(input.tmdbId ? { tmdbId: input.tmdbId } : {}),
            ...(input.malId ? { malId: input.malId } : {}),
            ...(input.season ? { season: input.season } : {}),
            ...(input.episode ? { episode: input.episode } : {}),
            watchedAt: serverTimestamp(),
          });
          return;
        } catch (error) {
          handleFirestoreError(error, OperationType.CREATE, path);
        }
      }

      const item: HistoryItem = {
        ...input,
        uid: 'guest',
        historyId,
        mediaId,
        watchedAtMs: Date.now(),
      };
      setHistory((prev) => {
        const next = [item, ...prev].slice(0, 60);
        writeLocalJson(STORAGE_KEYS.history, next);
        return next;
      });
    },
    [isCloudVerified, preferences.saveWatchHistory, user]
  );

  const clearHistory = useCallback(async () => {
    if (isCloudVerified && user) {
      const batch = writeBatch(db);
      for (const h of history) {
        batch.delete(doc(db, 'users', user.uid, 'history', h.historyId));
      }
      try {
        await batch.commit();
        return;
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `users/${user.uid}/history`);
      }
    }
    setHistory([]);
    writeLocalJson(STORAGE_KEYS.history, []);
  }, [history, isCloudVerified, user]);

  const recordRecentlyViewed = useCallback((media: MediaSummary) => {
    setRecentlyViewed((prev) => {
      const next = [media, ...prev.filter((m) => m.id !== media.id)].slice(0, 12);
      writeLocalJson(STORAGE_KEYS.recent, next);
      return next;
    });
  }, []);

  const addSearchQuery = useCallback(
    (query: string) => {
      if (!preferences.saveSearchHistory) return;
      const trimmed = query.trim();
      if (!trimmed) return;
      setSearchHistory((prev) => {
        const next = [
          { query: trimmed, timestampMs: Date.now() },
          ...prev.filter((q) => q.query.toLowerCase() !== trimmed.toLowerCase()),
        ].slice(0, 12);
        writeLocalJson(STORAGE_KEYS.search, next);
        return next;
      });
    },
    [preferences.saveSearchHistory]
  );

  const clearSearchHistory = useCallback(() => {
    setSearchHistory([]);
    writeLocalJson(STORAGE_KEYS.search, []);
  }, []);

  const updatePreferences = useCallback(
    async (patch: Partial<UserPreferences>) => {
      const next: UserPreferences = {
        ...preferences,
        ...patch,
        updatedAtMs: Date.now(),
      };
      setPreferences(next);
      writeLocalJson(STORAGE_KEYS.prefs, next);

      if (isCloudVerified && user) {
        const path = `users/${user.uid}/preferences/settings`;
        try {
          await setDoc(doc(db, 'users', user.uid, 'preferences', 'settings'), {
            uid: user.uid,
            theme: next.theme,
            language: next.language.slice(0, 16),
            autoplayNext: next.autoplayNext,
            preferredAnimeAudio: next.preferredAnimeAudio,
            saveSearchHistory: next.saveSearchHistory,
            saveWatchHistory: next.saveWatchHistory,
            updatedAt: serverTimestamp(),
          });
        } catch (error) {
          handleFirestoreError(error, OperationType.WRITE, path);
        }
      }
    },
    [isCloudVerified, preferences, user]
  );

  const syncStatus: LibraryContextValue['syncStatus'] = user
    ? user.emailVerified
      ? 'cloud-synced'
      : 'email-unverified'
    : 'guest-local';

  return (
    <LibraryContext.Provider
      value={{
        watchlist,
        watchProgress,
        history,
        recentlyViewed,
        searchHistory,
        preferences,
        syncStatus,
        isInWatchlist,
        toggleWatchlist,
        removeFromWatchlist,
        saveWatchProgress,
        removeWatchProgress,
        recordHistoryEntry,
        clearHistory,
        recordRecentlyViewed,
        addSearchQuery,
        clearSearchHistory,
        updatePreferences,
      }}
    >
      {children}
    </LibraryContext.Provider>
  );
}

export function useLibrary() {
  const ctx = useContext(LibraryContext);
  if (!ctx) throw new Error('useLibrary must be used inside LibraryProvider');
  return ctx;
}
