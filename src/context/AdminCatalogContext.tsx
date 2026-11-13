import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  Timestamp,
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { OperationType, handleFirestoreError } from '../lib/firestoreError';
import { useAuth } from './AuthContext';
import type {
  AdminCatalogItem,
  EpisodeSummary,
  MediaDetails,
  MediaSummary,
  MediaType,
  SeasonSummary,
} from '../types/media';

export const BOOTSTRAPPED_ADMIN_EMAIL = 'rahulhaldarx15@gmail.com';

export interface AdminCatalogInput {
  mediaType: MediaType;
  title: string;
  overview: string;
  posterPath: string;
  backdropPath: string;
  releaseYear: string;
  voteAverage: number;
  runtime?: number;
  originalLanguage: string;
  genres: string[];
  tmdbId?: number;
  malId?: number;
  seasonCount?: number;
  episodeCount?: number;
  featured: boolean;
}

interface AdminCatalogContextValue {
  adminItems: AdminCatalogItem[];
  adminMediaSummaries: MediaSummary[];
  loadingAdminCatalog: boolean;
  isAdminUser: boolean;
  findAdminMediaById: (mediaType: MediaType, rawId: string) => AdminCatalogItem | undefined;
  toMediaDetails: (item: AdminCatalogItem) => MediaDetails;
  createCatalogItem: (input: AdminCatalogInput) => Promise<AdminCatalogItem>;
  updateCatalogItem: (itemId: string, input: AdminCatalogInput) => Promise<void>;
  deleteCatalogItem: (itemId: string) => Promise<void>;
}

const AdminCatalogContext = createContext<AdminCatalogContextValue | null>(null);

function toMillis(val: unknown): number {
  if (val instanceof Timestamp) return val.toMillis();
  if (typeof val === 'number') return val;
  if (typeof val === 'object' && val !== null && 'seconds' in val) {
    return Number((val as { seconds: number }).seconds) * 1000;
  }
  return Date.now();
}

export function adminItemToSummary(item: AdminCatalogItem): MediaSummary {
  return {
    id: item.itemId,
    mediaType: item.mediaType,
    tmdbId: item.tmdbId,
    malId: item.malId,
    title: item.title,
    originalTitle: item.title,
    overview: item.overview,
    posterPath: item.posterPath || null,
    backdropPath: item.backdropPath || item.posterPath || null,
    releaseYear: item.releaseYear,
    releaseDate: `${item.releaseYear}-01-01`,
    voteAverage: item.voteAverage,
    voteCount: 1,
    popularity: item.featured ? 999 : 500,
    originalLanguage: item.originalLanguage || 'en',
    genreIds: [],
    genres: item.genres,
    seasonCount: item.seasonCount,
    episodeCount: item.episodeCount,
    source: 'admin-firestore',
    featured: item.featured,
  };
}

export function adminItemToDetails(item: AdminCatalogItem): MediaDetails {
  const summary = adminItemToSummary(item);
  const seasonTotal =
    item.mediaType === 'tv' ? Math.max(1, Math.min(20, item.seasonCount || 1)) : 1;
  const epTotal =
    item.mediaType === 'tv' || item.mediaType === 'anime'
      ? Math.max(1, Math.min(48, item.episodeCount || 12))
      : 0;

  const seasons: SeasonSummary[] | undefined =
    item.mediaType === 'tv'
      ? Array.from({ length: seasonTotal }, (_, idx) => ({
          id: idx + 1,
          seasonNumber: idx + 1,
          name: `Season ${idx + 1}`,
          episodeCount: epTotal,
          airDate: `${item.releaseYear}-01-01`,
          posterPath: item.posterPath || null,
          overview: item.overview,
        }))
      : undefined;

  const episodes: EpisodeSummary[] | undefined =
    item.mediaType === 'tv' || item.mediaType === 'anime'
      ? Array.from({ length: epTotal }, (_, idx) => ({
          id: idx + 1,
          seasonNumber: 1,
          episodeNumber: idx + 1,
          name: `${item.title} · Episode ${idx + 1}`,
          overview: item.overview,
          stillPath: item.backdropPath || item.posterPath || null,
          airDate: `${item.releaseYear}-01-01`,
          runtime: item.runtime ?? 42,
        }))
      : undefined;

  return {
    ...summary,
    runtime: item.runtime ?? null,
    numberOfSeasons: item.mediaType === 'tv' ? seasonTotal : undefined,
    numberOfEpisodes: epTotal || undefined,
    studios: ['ZyvoMovie Curated Catalog'],
    credits: [],
    videos: [],
    seasons,
    episodes,
    similar: [],
    recommendations: [],
  };
}

function sanitizeGenres(genres: string[]): string[] {
  return genres
    .map((g) => g.trim().slice(0, 32))
    .filter(Boolean)
    .slice(0, 10);
}

export function AdminCatalogProvider({ children }: { children: React.ReactNode }) {
  const { user, authReady } = useAuth();
  const [adminItems, setAdminItems] = useState<AdminCatalogItem[]>([]);
  const [loadingAdminCatalog, setLoadingAdminCatalog] = useState(true);
  const [hasAdminDoc, setHasAdminDoc] = useState(false);

  useEffect(() => {
    if (!authReady || !user || !user.emailVerified) {
      setHasAdminDoc(false);
      return;
    }
    if (user.email?.toLowerCase() === BOOTSTRAPPED_ADMIN_EMAIL) {
      setHasAdminDoc(true);
      return;
    }

    let active = true;
    void getDoc(doc(db, 'admins', user.uid))
      .then((snap) => {
        if (active) setHasAdminDoc(snap.exists());
      })
      .catch(() => {
        if (active) setHasAdminDoc(false);
      });
    return () => {
      active = false;
    };
  }, [authReady, user]);

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'catalogItems'),
      (snap) => {
        const items: AdminCatalogItem[] = snap.docs
          .map((d) => {
            const data = d.data();
            const mediaType: MediaType =
              data.mediaType === 'tv' || data.mediaType === 'anime' ? data.mediaType : 'movie';
            return {
              itemId: String(data.itemId || d.id),
              mediaType,
              title: String(data.title || 'Untitled'),
              overview: String(data.overview || ''),
              posterPath: String(data.posterPath || ''),
              backdropPath: String(data.backdropPath || ''),
              releaseYear: String(data.releaseYear || '2025'),
              voteAverage: Number(data.voteAverage || 0),
              runtime: typeof data.runtime === 'number' ? data.runtime : undefined,
              originalLanguage: String(data.originalLanguage || 'en'),
              genres: Array.isArray(data.genres)
                ? data.genres.filter((g): g is string => typeof g === 'string').slice(0, 10)
                : [],
              tmdbId: typeof data.tmdbId === 'number' ? data.tmdbId : undefined,
              malId: typeof data.malId === 'number' ? data.malId : undefined,
              seasonCount: typeof data.seasonCount === 'number' ? data.seasonCount : undefined,
              episodeCount: typeof data.episodeCount === 'number' ? data.episodeCount : undefined,
              featured: Boolean(data.featured),
              createdBy: String(data.createdBy || ''),
              createdAtMs: toMillis(data.createdAt),
              updatedAtMs: toMillis(data.updatedAt),
            };
          })
          .sort((a, b) => b.updatedAtMs - a.updatedAtMs);
        setAdminItems(items);
        setLoadingAdminCatalog(false);
      },
      (err) => {
        setLoadingAdminCatalog(false);
        handleFirestoreError(err, OperationType.LIST, 'catalogItems');
      }
    );

    return () => unsub();
  }, []);

  const isAdminUser = Boolean(
    user &&
      user.emailVerified &&
      (user.email?.toLowerCase() === BOOTSTRAPPED_ADMIN_EMAIL || hasAdminDoc)
  );

  const adminMediaSummaries = useMemo(() => adminItems.map(adminItemToSummary), [adminItems]);

  const findAdminMediaById = useCallback(
    (mediaType: MediaType, rawId: string) => {
      const cleanId = rawId.trim();
      if (!cleanId) return undefined;
      return adminItems.find((item) => {
        if (item.mediaType !== mediaType) return false;
        if (item.itemId === cleanId) return true;
        const numeric = Number(cleanId);
        if (Number.isInteger(numeric) && numeric > 0) {
          if (mediaType === 'anime' && item.malId === numeric) return true;
          if ((mediaType === 'movie' || mediaType === 'tv') && item.tmdbId === numeric) return true;
        }
        return false;
      });
    },
    [adminItems]
  );

  const createCatalogItem = useCallback(
    async (input: AdminCatalogInput): Promise<AdminCatalogItem> => {
      if (!user || !isAdminUser) {
        throw new Error('Verified administrator sign-in is required to publish titles.');
      }

      const randomSuffix = Math.random().toString(36).slice(2, 7);
      const itemId = `adm_${input.mediaType}_${Date.now()}_${randomSuffix}`;
      const path = `catalogItems/${itemId}`;

      const cleanTitle = input.title.trim().slice(0, 200);
      const cleanOverview = input.overview.trim().slice(0, 4000);
      const cleanPoster = input.posterPath.trim().slice(0, 400000);
      const cleanBackdrop = input.backdropPath.trim().slice(0, 400000);
      const cleanYear = input.releaseYear.trim().slice(0, 10) || '2025';
      const cleanRating = Math.min(10, Math.max(0, Number(input.voteAverage) || 0));
      const cleanLang = (input.originalLanguage || 'en').trim().slice(0, 16) || 'en';
      const cleanGenres = sanitizeGenres(input.genres);

      const payload: Record<string, unknown> = {
        itemId,
        mediaType: input.mediaType,
        title: cleanTitle,
        overview: cleanOverview,
        releaseYear: cleanYear,
        voteAverage: cleanRating,
        originalLanguage: cleanLang,
        genres: cleanGenres,
        featured: Boolean(input.featured),
        createdBy: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      if (cleanPoster) payload.posterPath = cleanPoster;
      if (cleanBackdrop) payload.backdropPath = cleanBackdrop;
      if (typeof input.runtime === 'number' && Number.isFinite(input.runtime) && input.runtime > 0) {
        payload.runtime = Math.round(input.runtime);
      }
      if (typeof input.tmdbId === 'number' && Number.isInteger(input.tmdbId) && input.tmdbId > 0) {
        payload.tmdbId = input.tmdbId;
      }
      if (typeof input.malId === 'number' && Number.isInteger(input.malId) && input.malId > 0) {
        payload.malId = input.malId;
      }
      if (
        typeof input.seasonCount === 'number' &&
        Number.isInteger(input.seasonCount) &&
        input.seasonCount > 0
      ) {
        payload.seasonCount = input.seasonCount;
      }
      if (
        typeof input.episodeCount === 'number' &&
        Number.isInteger(input.episodeCount) &&
        input.episodeCount > 0
      ) {
        payload.episodeCount = input.episodeCount;
      }

      try {
        await setDoc(doc(db, 'catalogItems', itemId), payload);
        return {
          itemId,
          mediaType: input.mediaType,
          title: cleanTitle,
          overview: cleanOverview,
          posterPath: cleanPoster,
          backdropPath: cleanBackdrop,
          releaseYear: cleanYear,
          voteAverage: cleanRating,
          runtime: typeof payload.runtime === 'number' ? payload.runtime : undefined,
          originalLanguage: cleanLang,
          genres: cleanGenres,
          tmdbId: typeof payload.tmdbId === 'number' ? payload.tmdbId : undefined,
          malId: typeof payload.malId === 'number' ? payload.malId : undefined,
          seasonCount: typeof payload.seasonCount === 'number' ? payload.seasonCount : undefined,
          episodeCount: typeof payload.episodeCount === 'number' ? payload.episodeCount : undefined,
          featured: Boolean(input.featured),
          createdBy: user.uid,
          createdAtMs: Date.now(),
          updatedAtMs: Date.now(),
        };
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, path);
      }
    },
    [isAdminUser, user]
  );

  const updateCatalogItem = useCallback(
    async (itemId: string, input: AdminCatalogInput): Promise<void> => {
      if (!user || !isAdminUser) {
        throw new Error('Verified administrator sign-in is required to update titles.');
      }

      const path = `catalogItems/${itemId}`;
      const cleanTitle = input.title.trim().slice(0, 200);
      const cleanOverview = input.overview.trim().slice(0, 4000);
      const cleanPoster = input.posterPath.trim().slice(0, 400000);
      const cleanBackdrop = input.backdropPath.trim().slice(0, 400000);
      const cleanYear = input.releaseYear.trim().slice(0, 10) || '2025';
      const cleanRating = Math.min(10, Math.max(0, Number(input.voteAverage) || 0));
      const cleanLang = (input.originalLanguage || 'en').trim().slice(0, 16) || 'en';
      const cleanGenres = sanitizeGenres(input.genres);

      const updatePayload: Record<string, unknown> = {
        mediaType: input.mediaType,
        title: cleanTitle,
        overview: cleanOverview,
        posterPath: cleanPoster || deleteField(),
        backdropPath: cleanBackdrop || deleteField(),
        releaseYear: cleanYear,
        voteAverage: cleanRating,
        runtime:
          typeof input.runtime === 'number' && Number.isFinite(input.runtime) && input.runtime > 0
            ? Math.round(input.runtime)
            : deleteField(),
        originalLanguage: cleanLang,
        genres: cleanGenres,
        tmdbId:
          typeof input.tmdbId === 'number' && Number.isInteger(input.tmdbId) && input.tmdbId > 0
            ? input.tmdbId
            : deleteField(),
        malId:
          typeof input.malId === 'number' && Number.isInteger(input.malId) && input.malId > 0
            ? input.malId
            : deleteField(),
        seasonCount:
          typeof input.seasonCount === 'number' &&
          Number.isInteger(input.seasonCount) &&
          input.seasonCount > 0
            ? input.seasonCount
            : deleteField(),
        episodeCount:
          typeof input.episodeCount === 'number' &&
          Number.isInteger(input.episodeCount) &&
          input.episodeCount > 0
            ? input.episodeCount
            : deleteField(),
        featured: Boolean(input.featured),
        updatedAt: serverTimestamp(),
      };

      try {
        await updateDoc(doc(db, 'catalogItems', itemId), updatePayload);
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, path);
      }
    },
    [isAdminUser, user]
  );

  const deleteCatalogItem = useCallback(
    async (itemId: string): Promise<void> => {
      if (!user || !isAdminUser) {
        throw new Error('Verified administrator sign-in is required to delete titles.');
      }
      const path = `catalogItems/${itemId}`;
      try {
        await deleteDoc(doc(db, 'catalogItems', itemId));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, path);
      }
    },
    [isAdminUser, user]
  );

  return (
    <AdminCatalogContext.Provider
      value={{
        adminItems,
        adminMediaSummaries,
        loadingAdminCatalog,
        isAdminUser,
        findAdminMediaById,
        toMediaDetails: adminItemToDetails,
        createCatalogItem,
        updateCatalogItem,
        deleteCatalogItem,
      }}
    >
      {children}
    </AdminCatalogContext.Provider>
  );
}

export function useAdminCatalog() {
  const ctx = useContext(AdminCatalogContext);
  if (!ctx) throw new Error('useAdminCatalog must be used inside AdminCatalogProvider');
  return ctx;
}
