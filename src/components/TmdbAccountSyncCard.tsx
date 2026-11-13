import React, { useState } from 'react';
import {
  AlertCircle,
  ArrowDownToLine,
  ArrowUpFromLine,
  CheckCircle2,
  ExternalLink,
  Link2,
  RefreshCw,
  Search,
  Unlink,
  UserCheck,
} from 'lucide-react';
import {
  createTmdbAuthSession,
  createTmdbAuthToken,
  fetchJikanUserFavorites,
  fetchTmdbAccountWatchlist,
  pushTmdbWatchlistItem,
  type JikanUserProfile,
  type TmdbAccountProfile,
} from '../services/catalogApi';
import { useLibrary } from '../context/LibraryContext';
import { GlassBadge, GlassButton, GlassPanel } from './glass';

const TMDB_SESSION_STORAGE_KEY = 'zyvomovie_tmdb_session_v1';

interface StoredTmdbSession {
  sessionId: string;
  account: TmdbAccountProfile;
}

function readStoredTmdbSession(): StoredTmdbSession | null {
  try {
    const raw = sessionStorage.getItem(TMDB_SESSION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredTmdbSession>;
    if (!parsed.sessionId || !parsed.account?.id) return null;
    return parsed as StoredTmdbSession;
  } catch {
    return null;
  }
}

function writeStoredTmdbSession(value: StoredTmdbSession | null): void {
  try {
    if (!value) {
      sessionStorage.removeItem(TMDB_SESSION_STORAGE_KEY);
      return;
    }
    sessionStorage.setItem(TMDB_SESSION_STORAGE_KEY, JSON.stringify(value));
  } catch {
    // ignore storage failures
  }
}

export function TmdbAccountSyncCard({ compact = false }: { compact?: boolean }) {
  const { watchlist, addWatchlistBatch } = useLibrary();
  const [provider, setProvider] = useState<'tmdb' | 'jikan'>('tmdb');

  // TMDB session state
  const [session, setSession] = useState<StoredTmdbSession | null>(() => readStoredTmdbSession());
  const [pendingToken, setPendingToken] = useState<{
    requestToken: string;
    authenticateUrl: string;
  } | null>(null);
  const [busyAction, setBusyAction] = useState<'token' | 'session' | 'pull' | 'push' | 'jikan' | null>(null);
  const [notice, setNotice] = useState<{ tone: 'ok' | 'warn'; text: string } | null>(null);

  // Jikan / MAL public username import state
  const [malUsername, setMalUsername] = useState('');
  const [lastMalProfile, setLastMalProfile] = useState<JikanUserProfile | null>(null);

  const pushableItems = watchlist.filter(
    (item) => (item.mediaType === 'movie' || item.mediaType === 'tv') && typeof item.tmdbId === 'number' && item.tmdbId > 0
  );

  const handleStartConnect = async () => {
    setBusyAction('token');
    setNotice(null);
    try {
      const res = await createTmdbAuthToken();
      if (!res.configured || !res.requestToken || !res.authenticateUrl) {
        setNotice({
          tone: 'warn',
          text: res.notice || 'Unable to start TMDB sign-in right now.',
        });
        return;
      }
      setPendingToken({
        requestToken: res.requestToken,
        authenticateUrl: res.authenticateUrl,
      });
      setNotice({
        tone: 'ok',
        text: 'Step 1 ready: Approve access on TMDB, then return here and tap Complete Connection.',
      });
    } catch (err) {
      setNotice({
        tone: 'warn',
        text: err instanceof Error ? err.message : 'Unable to request TMDB sign-in token.',
      });
    } finally {
      setBusyAction(null);
    }
  };

  const handleCompleteConnect = async () => {
    if (!pendingToken) return;
    setBusyAction('session');
    setNotice(null);
    try {
      const res = await createTmdbAuthSession(pendingToken.requestToken);
      if (!res.configured || !res.sessionId || !res.account) {
        setNotice({
          tone: 'warn',
          text: res.notice || 'Approval not confirmed yet on TMDB.',
        });
        return;
      }
      const nextSession: StoredTmdbSession = {
        sessionId: res.sessionId,
        account: res.account,
      };
      setSession(nextSession);
      writeStoredTmdbSession(nextSession);
      setPendingToken(null);
      setNotice({
        tone: 'ok',
        text: `Connected TMDB account @${res.account.username}.`,
      });
    } catch (err) {
      setNotice({
        tone: 'warn',
        text: err instanceof Error ? err.message : 'Unable to finish TMDB connection.',
      });
    } finally {
      setBusyAction(null);
    }
  };

  const handlePullFromTmdb = async () => {
    if (!session) return;
    setBusyAction('pull');
    setNotice(null);
    try {
      const res = await fetchTmdbAccountWatchlist(session.sessionId, session.account.id);
      if (!res.configured || res.notice) {
        setNotice({
          tone: 'warn',
          text: res.notice || 'Unable to pull watchlist from TMDB.',
        });
        return;
      }
      const added = await addWatchlistBatch(res.items);
      setNotice({
        tone: 'ok',
        text:
          res.items.length === 0
            ? 'Your TMDB watchlist has no movies or TV shows to import.'
            : added > 0
              ? `Imported ${added} new title${added === 1 ? '' : 's'} from TMDB into My List.`
              : `All ${res.items.length} TMDB watchlist title${res.items.length === 1 ? '' : 's'} are already in My List.`,
      });
    } catch (err) {
      setNotice({
        tone: 'warn',
        text: err instanceof Error ? err.message : 'Failed to pull TMDB watchlist.',
      });
    } finally {
      setBusyAction(null);
    }
  };

  const handlePushToTmdb = async () => {
    if (!session) return;
    if (pushableItems.length === 0) {
      setNotice({
        tone: 'warn',
        text: 'Add movies or TV shows to My List before pushing to TMDB.',
      });
      return;
    }

    setBusyAction('push');
    setNotice(null);
    let synced = 0;
    let firstError: string | null = null;
    try {
      for (const item of pushableItems.slice(0, 25)) {
        const res = await pushTmdbWatchlistItem(
          session.sessionId,
          session.account.id,
          item.mediaType === 'tv' ? 'tv' : 'movie',
          item.tmdbId as number,
          true
        );
        if (res.success) {
          synced += 1;
        } else if (!firstError && res.notice) {
          firstError = res.notice;
        }
      }
      setNotice({
        tone: synced > 0 ? 'ok' : 'warn',
        text:
          synced > 0
            ? `Pushed ${synced} title${synced === 1 ? '' : 's'} from My List to @${session.account.username} on TMDB.`
            : firstError || 'No titles could be pushed to TMDB.',
      });
    } catch (err) {
      setNotice({
        tone: 'warn',
        text: err instanceof Error ? err.message : 'Failed to push My List to TMDB.',
      });
    } finally {
      setBusyAction(null);
    }
  };

  const handleDisconnect = () => {
    setSession(null);
    setPendingToken(null);
    writeStoredTmdbSession(null);
    setNotice({ tone: 'ok', text: 'Disconnected TMDB account from this browser session.' });
  };

  const handleImportMalFavorites = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = malUsername.trim().replace(/^@/, '');
    if (!clean) return;

    setBusyAction('jikan');
    setNotice(null);
    try {
      const res = await fetchJikanUserFavorites(clean);
      if (res.notice) {
        setLastMalProfile(null);
        setNotice({ tone: 'warn', text: res.notice });
        return;
      }
      setLastMalProfile(res.user);
      if (res.items.length === 0) {
        setNotice({
          tone: 'warn',
          text: `MyAnimeList user @${res.user?.username || clean} has no public anime favorites to import.`,
        });
        return;
      }
      const added = await addWatchlistBatch(res.items);
      setNotice({
        tone: 'ok',
        text:
          added > 0
            ? `Imported ${added} favorite anime title${added === 1 ? '' : 's'} from MAL @${res.user?.username || clean} into My List.`
            : `All ${res.items.length} anime favorites from @${res.user?.username || clean} are already in My List.`,
      });
    } catch (err) {
      setNotice({
        tone: 'warn',
        text: err instanceof Error ? err.message : 'Unable to import MAL anime favorites via Jikan.',
      });
    } finally {
      setBusyAction(null);
    }
  };

  return (
    <GlassPanel
      variant={compact ? 'subtle' : 'default'}
      padding={compact ? 'md' : 'lg'}
      className="rounded-3xl space-y-4 min-w-0"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 min-w-0">
          <GlassBadge variant="red" size="xs">
            {provider === 'tmdb' ? 'TMDB Sync' : 'Jikan / MAL'}
          </GlassBadge>
          {provider === 'tmdb' ? (
            session ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-300">
                <UserCheck className="w-3.5 h-3.5 shrink-0" />
                @{session.account.username}
              </span>
            ) : (
              <span className="text-xs text-white/60">Movies &amp; TV Bridge</span>
            )
          ) : (
            <span className="text-xs text-white/60">Read-Only MAL Anime Import</span>
          )}
        </div>

        {/* Provider Switcher */}
        <div className="inline-flex items-center gap-1 p-1 rounded-full bg-white/10 border border-white/15">
          <button
            type="button"
            onClick={() => {
              setProvider('tmdb');
              setNotice(null);
            }}
            className={`px-3 py-1.5 min-h-[38px] rounded-full text-xs font-semibold transition-colors cursor-pointer ${
              provider === 'tmdb'
                ? 'bg-[#E50914] text-white'
                : 'text-white/70 hover:text-white'
            }`}
          >
            TMDB
          </button>
          <button
            type="button"
            onClick={() => {
              setProvider('jikan');
              setNotice(null);
            }}
            className={`px-3 py-1.5 min-h-[38px] rounded-full text-xs font-semibold transition-colors cursor-pointer ${
              provider === 'jikan'
                ? 'bg-[#E50914] text-white'
                : 'text-white/70 hover:text-white'
            }`}
          >
            MAL / Anime
          </button>
        </div>
      </div>

      {provider === 'tmdb' ? (
        <>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1 min-w-0 flex-1">
              <h2 className="font-display text-base sm:text-lg font-bold text-white">
                Sync Watchlist with TMDB
              </h2>
              <p className="text-xs sm:text-sm text-white/70 leading-relaxed">
                Connect your TMDB account to pull your TMDB Watchlist into ZyvoMovie or push My
                List movies and TV series back to TMDB.
              </p>
            </div>

            {session ? (
              <GlassButton
                variant="glass"
                size="sm"
                onClick={handleDisconnect}
                className="min-h-[44px] shrink-0"
              >
                <Unlink className="w-4 h-4" />
                Disconnect
              </GlassButton>
            ) : (
              <GlassButton
                variant="primary"
                size="sm"
                onClick={() => void handleStartConnect()}
                disabled={busyAction !== null}
                className="min-h-[44px] shrink-0"
              >
                <Link2 className="w-4 h-4" />
                {busyAction === 'token' ? 'Preparing...' : 'Connect TMDB Account'}
              </GlassButton>
            )}
          </div>

          {pendingToken && !session && (
            <div className="p-3.5 rounded-2xl glass-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-xs text-white/80 leading-relaxed min-w-0">
                <p className="font-semibold text-white">Authorize on TMDB.org</p>
                <p className="text-white/65">
                  Open the TMDB approval page in a new tab, approve access, then tap Complete
                  Connection.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <a
                  href={pendingToken.authenticateUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 min-h-[44px] rounded-full glass-control text-xs font-semibold text-white hover:border-white/45 transition-colors"
                >
                  Approve on TMDB
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <GlassButton
                  variant="primary"
                  size="sm"
                  onClick={() => void handleCompleteConnect()}
                  disabled={busyAction !== null}
                  className="min-h-[44px]"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${busyAction === 'session' ? 'animate-spin' : ''}`} />
                  {busyAction === 'session' ? 'Connecting...' : 'Complete Connection'}
                </GlassButton>
              </div>
            </div>
          )}

          {session && (
            <div className="flex flex-wrap items-center gap-2.5">
              <GlassButton
                variant="primary"
                size="sm"
                onClick={() => void handlePullFromTmdb()}
                disabled={busyAction !== null}
                className="min-h-[44px]"
              >
                <ArrowDownToLine className="w-4 h-4" />
                {busyAction === 'pull' ? 'Pulling Watchlist...' : 'Pull TMDB Watchlist → My List'}
              </GlassButton>

              <GlassButton
                variant="glass"
                size="sm"
                onClick={() => void handlePushToTmdb()}
                disabled={busyAction !== null}
                className="min-h-[44px]"
              >
                <ArrowUpFromLine className="w-4 h-4" />
                {busyAction === 'push'
                  ? 'Pushing Titles...'
                  : `Push My List → TMDB (${pushableItems.length})`}
              </GlassButton>
            </div>
          )}
        </>
      ) : (
        <div className="space-y-3">
          <div className="space-y-1 min-w-0">
            <h2 className="font-display text-base sm:text-lg font-bold text-white">
              Import MyAnimeList Favorites via Jikan
            </h2>
            <p className="text-xs sm:text-sm text-white/70 leading-relaxed">
              Enter any public MyAnimeList username to import their favorite anime straight into
              My List. Jikan v4 provides read-only public data without requiring MAL credentials.
            </p>
          </div>

          <form onSubmit={handleImportMalFavorites} className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1 min-w-0">
              <Search className="w-4 h-4 text-white/55 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                aria-label="MyAnimeList public username"
                value={malUsername}
                onChange={(e) => setMalUsername(e.target.value)}
                placeholder="Enter MAL username (e.g. Xinil)..."
                className="w-full min-h-[44px] pl-9 pr-3.5 py-2 rounded-full bg-white/10 border border-white/20 text-sm text-white placeholder:text-white/50 focus:outline-none focus:border-white/45"
              />
            </div>
            <GlassButton
              type="submit"
              variant="primary"
              size="sm"
              disabled={busyAction !== null || !malUsername.trim()}
              className="min-h-[44px] shrink-0"
            >
              <ArrowDownToLine className="w-4 h-4" />
              {busyAction === 'jikan' ? 'Importing Anime...' : 'Import Anime Favorites'}
            </GlassButton>
          </form>

          {lastMalProfile && (
            <div className="flex items-center gap-3 text-xs text-white/75 pt-1">
              {lastMalProfile.avatarPath && (
                <img
                  src={lastMalProfile.avatarPath}
                  alt={lastMalProfile.username}
                  referrerPolicy="no-referrer"
                  className="w-7 h-7 rounded-full object-cover border border-white/25"
                />
              )}
              <span>
                Last synced MAL profile:{' '}
                <a
                  href={lastMalProfile.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white font-semibold hover:text-[#E50914] underline"
                >
                  @{lastMalProfile.username}
                </a>
              </span>
            </div>
          )}
        </div>
      )}

      {notice && (
        <p
          role="status"
          className={`text-xs flex items-start gap-2 leading-relaxed ${
            notice.tone === 'ok' ? 'text-emerald-300' : 'text-amber-200'
          }`}
        >
          {notice.tone === 'ok' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          )}
          <span>{notice.text}</span>
        </p>
      )}
    </GlassPanel>
  );
}
