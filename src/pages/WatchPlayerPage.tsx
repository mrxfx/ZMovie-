import React, { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Maximize2,
  ShieldCheck,
  Subtitles,
} from 'lucide-react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { fetchMediaDetails, fetchTvSeasonEpisodes } from '../services/catalogApi';
import type { EpisodeSummary, MediaDetails, MediaType } from '../types/media';
import { useLibrary } from '../context/LibraryContext';
import { buildVidLinkUrl, validateSubtitleUrl } from '../utils/mediaFilters';
import { parsePlayerPostMessage, shouldPersistProgressUpdate } from '../utils/playerEvents';
import { createCanonicalMediaId, formatPlaybackTime } from '../utils/watchProgress';
import { ErrorState, HeroSkeleton } from '../components/StateBlocks';
import { useSeoMetadata } from '../utils/seo';

const PROVIDER_CONSENT_KEY = 'zyvomovie_vidlink_authorized_v1';

export function WatchPlayerPage() {
  const { type, id = '' } = useParams<{ type: MediaType; id: string }>();
  const mediaType: MediaType = type === 'tv' || type === 'anime' ? type : 'movie';
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const initialSeason = Math.max(1, Number(searchParams.get('s') || 1));
  const initialEpisode = Math.max(1, Number(searchParams.get('e') || 1));
  const { preferences, saveWatchProgress, recordHistoryEntry, watchProgress } = useLibrary();

  const initialAudio =
    searchParams.get('audio') === 'dub'
      ? 'dub'
      : searchParams.get('audio') === 'sub'
        ? 'sub'
        : preferences.preferredAnimeAudio;

  const [season, setSeason] = useState(initialSeason);
  const [episode, setEpisode] = useState(initialEpisode);
  const [subOrDub, setSubOrDub] = useState<'sub' | 'dub'>(initialAudio);
  const [subtitleInput, setSubtitleInput] = useState('');
  const [appliedSubtitle, setAppliedSubtitle] = useState('');
  const [subtitleError, setSubtitleError] = useState<string | null>(null);

  const [details, setDetails] = useState<MediaDetails | null>(null);
  const [episodes, setEpisodes] = useState<EpisodeSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [providerAuthorized, setProviderAuthorized] = useState<boolean>(() => {
    try {
      return localStorage.getItem(PROVIDER_CONSENT_KEY) === 'true';
    } catch {
      return false;
    }
  });
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [lastPlaybackStats, setLastPlaybackStats] = useState<{
    event: string;
    currentTime: number;
    duration: number;
    progressPercent: number;
  } | null>(null);

  const playerContainerRef = useRef<HTMLDivElement | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const lastSavedRef = useRef<{ atMs: number; percent: number }>({ atMs: 0, percent: 0 });
  const historyRecordedRef = useRef<string>('');

  useSeoMetadata({
    title: details ? `Watch ${details.title} – ZyvoMovie` : 'Watch Player – ZyvoMovie',
    description: 'ZyvoMovie responsive player with synchronized Continue Watching progress.',
    path: `/watch/${mediaType}/${id}`,
  });

  useEffect(() => {
    setLoading(true);
    setError(null);
    void fetchMediaDetails(mediaType, id)
      .then((res) => {
        setDetails(res.details);
        setEpisodes(res.details.episodes || []);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Unable to load media metadata.');
      })
      .finally(() => setLoading(false));
  }, [mediaType, id]);

  useEffect(() => {
    if (mediaType !== 'tv' || !details?.tmdbId) return;
    void fetchTvSeasonEpisodes(String(details.tmdbId), season)
      .then((res) => setEpisodes(res.episodes || []))
      .catch(() => {});
  }, [mediaType, details?.tmdbId, season]);

  const vidLinkResult = buildVidLinkUrl({
    mediaType,
    tmdbId: details?.tmdbId,
    malId: details?.malId,
    season,
    episode,
    subOrDub,
    autoplay: false,
    subtitleUrl: appliedSubtitle || undefined,
  });

  // Record Watch History when stream is authorized & mounted with a valid provider URL
  useEffect(() => {
    if (!details || !providerAuthorized || !vidLinkResult.url) return;
    const key = `${details.id}_s${season}_e${episode}_${subOrDub}`;
    if (historyRecordedRef.current === key) return;
    historyRecordedRef.current = key;

    void recordHistoryEntry({
      mediaId: createCanonicalMediaId(mediaType, details.id),
      mediaType,
      title: details.title,
      posterPath: details.posterPath || '',
      tmdbId: details.tmdbId,
      malId: details.malId,
      season: mediaType === 'tv' ? season : undefined,
      episode: mediaType === 'tv' || mediaType === 'anime' ? episode : undefined,
    });
  }, [details, providerAuthorized, vidLinkResult.url, mediaType, season, episode, subOrDub, recordHistoryEntry]);

  // Listen strictly to validated postMessage events from the player iframe
  useEffect(() => {
    if (!details || !providerAuthorized || !vidLinkResult.url) return;

    const handleMessage = (event: MessageEvent) => {
      const sourceMatches = Boolean(
        iframeRef.current?.contentWindow && event.source === iframeRef.current.contentWindow
      );
      const parsed = parsePlayerPostMessage(event.data, event.origin, sourceMatches);
      if (!parsed) return;

      setLastPlaybackStats({
        event: parsed.type,
        currentTime: parsed.currentTime,
        duration: parsed.duration,
        progressPercent: parsed.progressPercent,
      });

      const now = Date.now();
      const shouldSave = shouldPersistProgressUpdate({
        lastSavedAtMs: lastSavedRef.current.atMs,
        lastSavedPercent: lastSavedRef.current.percent,
        nowMs: now,
        nextPercent: parsed.progressPercent,
        eventType: parsed.type,
      });

      if (shouldSave) {
        lastSavedRef.current = { atMs: now, percent: parsed.progressPercent };
        void saveWatchProgress({
          mediaId: createCanonicalMediaId(mediaType, details.id),
          mediaType,
          title: details.title,
          posterPath: details.posterPath || '',
          backdropPath: details.backdropPath || details.posterPath || '',
          tmdbId: details.tmdbId,
          malId: details.malId,
          season: mediaType === 'tv' ? parsed.season ?? season : undefined,
          episode:
            mediaType === 'tv' || mediaType === 'anime'
              ? parsed.episode ?? episode
              : undefined,
          subOrDub: mediaType === 'anime' ? subOrDub : undefined,
          currentTime: parsed.currentTime,
          duration: parsed.duration,
          progressPercent: parsed.progressPercent,
          completed: parsed.completed,
        });
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [details, providerAuthorized, vidLinkResult.url, mediaType, season, episode, subOrDub, saveWatchProgress]);

  const authorizeProvider = () => {
    setProviderAuthorized(true);
    setIframeLoaded(false);
    try {
      localStorage.setItem(PROVIDER_CONSENT_KEY, 'true');
    } catch {
      // ignore
    }
  };

  const updateEpisodeParams = (nextSeason: number, nextEpisode: number, nextAudio = subOrDub) => {
    setSeason(nextSeason);
    setEpisode(nextEpisode);
    setSubOrDub(nextAudio);
    setIframeLoaded(false);
    const params: Record<string, string> = {};
    if (mediaType === 'tv') {
      params.s = String(nextSeason);
      params.e = String(nextEpisode);
    } else if (mediaType === 'anime') {
      params.e = String(nextEpisode);
      params.audio = nextAudio;
    }
    setSearchParams(params, { replace: true });
  };

  const handleFullscreen = () => {
    const el = playerContainerRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      void document.exitFullscreen();
    } else {
      void el.requestFullscreen?.();
    }
  };

  const handleApplySubtitle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subtitleInput.trim()) {
      setAppliedSubtitle('');
      setSubtitleError(null);
      return;
    }
    const valid = validateSubtitleUrl(subtitleInput);
    if (!valid) {
      setSubtitleError('Please enter a valid HTTPS subtitle file URL (.vtt or .srt).');
      return;
    }
    setSubtitleError(null);
    setAppliedSubtitle(valid);
    setIframeLoaded(false);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
        <HeroSkeleton />
      </div>
    );
  }

  if (error || !details) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8">
        <ErrorState message={error || 'Title not found.'} onRetry={() => navigate(-1)} />
      </div>
    );
  }

  const canonicalId = createCanonicalMediaId(mediaType, details.id);
  const existingCheckpoint = watchProgress.find((p) => p.mediaId === canonicalId);
  const maxEpisodes = episodes.length > 0 ? episodes.length : details.episodeCount || 24;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
      {/* Top Back Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to={`/${mediaType}/${id}`}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#EEEEEE] dark:border-zinc-800 bg-[#F7F7F8] dark:bg-zinc-900 text-sm font-medium hover:border-[#E50914] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Details
          </Link>
          <div>
            <h1 className="font-display text-xl sm:text-2xl font-bold line-clamp-1">
              {details.title}
            </h1>
            <p className="text-xs text-[#737373] dark:text-zinc-400 font-mono-tabular">
              {mediaType === 'tv'
                ? `Season ${season} · Episode ${episode}`
                : mediaType === 'anime'
                  ? `Episode ${episode} · ${subOrDub.toUpperCase()}`
                  : `Feature Film · ${details.releaseYear}`}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleFullscreen}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#EEEEEE] dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm font-medium hover:border-[#E50914] transition-colors"
        >
          <Maximize2 className="w-4 h-4" />
          Fullscreen
        </button>
      </div>

      {/* Existing Resume Banner */}
      {existingCheckpoint && existingCheckpoint.progressPercent > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 rounded-xl bg-[#F7F7F8] dark:bg-zinc-900 border border-[#EEEEEE] dark:border-zinc-800 text-sm">
          <span>
            Last synced checkpoint:{' '}
            <strong className="font-mono-tabular">
              {formatPlaybackTime(existingCheckpoint.currentTime)}
            </strong>{' '}
            ({existingCheckpoint.progressPercent.toFixed(0)}%)
          </span>
          <Link
            to="/continue-watching"
            className="text-xs font-semibold text-[#E50914] hover:underline"
          >
            Manage Continue Watching
          </Link>
        </div>
      )}

      {/* Player Viewport */}
      <div
        ref={playerContainerRef}
        className="relative aspect-video w-full rounded-2xl overflow-hidden bg-zinc-950 border border-[#EEEEEE] dark:border-zinc-800"
      >
        {!vidLinkResult.url ? (
          /* Honest fallback when title has no valid TMDB/MAL ID (e.g. local development sample record) */
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-white bg-zinc-950">
            <AlertTriangle className="w-10 h-10 text-[#E50914] mb-3" />
            <h2 className="font-display text-xl font-bold mb-2">
              External Stream Unavailable for Local Sample Record
            </h2>
            <p className="text-sm text-zinc-300 max-w-lg mb-6 leading-relaxed">
              {vidLinkResult.reason} Configure <code className="text-white">TMDB_READ_ACCESS_TOKEN</code> on
              the server or browse live Jikan/MAL anime records to load authorized provider IDs.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                to={`/${mediaType}/${id}`}
                className="px-5 py-2.5 rounded-lg bg-[#E50914] hover:bg-[#B20710] text-white text-sm font-semibold transition-colors"
              >
                Return to Details
              </Link>
              <Link
                to="/settings"
                className="px-5 py-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm font-semibold transition-colors"
              >
                Check Provider Status
              </Link>
            </div>
          </div>
        ) : !providerAuthorized ? (
          /* Provider Terms & Content Authorization Gate */
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-white bg-zinc-950">
            <ShieldCheck className="w-10 h-10 text-[#E50914] mb-3" />
            <h2 className="font-display text-xl font-bold mb-2">
              Third-Party Streaming Provider Notice
            </h2>
            <p className="text-sm text-zinc-300 max-w-xl mb-6 leading-relaxed">
              ZyvoMovie embeds external playback via VidLink (<code>vidlink.pro</code>). Playback
              availability depends on third-party stream authorization and regional access. ZyvoMovie
              does not host media files or bypass DRM/access controls.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={authorizeProvider}
                className="px-6 py-3 rounded-lg bg-[#E50914] hover:bg-[#B20710] text-white text-sm font-semibold transition-colors"
              >
                Authorize & Load VidLink Player
              </button>
              <Link
                to={`/${mediaType}/${id}`}
                className="px-5 py-3 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm font-semibold transition-colors"
              >
                View Details & Trailer Instead
              </Link>
            </div>
          </div>
        ) : (
          <>
            {!iframeLoaded && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white bg-zinc-950/90 z-10 pointer-events-none">
                <div className="w-8 h-8 border-2 border-[#E50914] border-t-transparent rounded-full animate-spin mb-3" />
                <p className="text-sm text-zinc-300">Connecting to VidLink embed...</p>
              </div>
            )}
            <iframe
              ref={iframeRef}
              key={vidLinkResult.url}
              src={vidLinkResult.url}
              title={`Watch ${details.title}`}
              onLoad={() => setIframeLoaded(true)}
              allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
              allowFullScreen
              className="w-full h-full border-0"
            />
          </>
        )}
      </div>

      {/* Player Controls Bar: Episode Prev/Next, Season/Episode Selector, Sub/Dub, Subtitle Config */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-5 rounded-2xl bg-[#F7F7F8] dark:bg-zinc-900 border border-[#EEEEEE] dark:border-zinc-800 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-base font-bold">Playback Controls</h2>
            {lastPlaybackStats && (
              <span className="text-xs font-mono-tabular text-[#737373] dark:text-zinc-400">
                Last event: {lastPlaybackStats.event} · {lastPlaybackStats.progressPercent.toFixed(1)}%
              </span>
            )}
          </div>

          {(mediaType === 'tv' || mediaType === 'anime') && (
            <div className="flex flex-wrap items-center gap-3">
              {mediaType === 'tv' && details.seasons && details.seasons.length > 0 && (
                <div className="flex items-center gap-2">
                  <label htmlFor="player-season" className="text-xs font-medium text-[#737373]">
                    Season
                  </label>
                  <select
                    id="player-season"
                    value={season}
                    onChange={(e) => updateEpisodeParams(Number(e.target.value), 1)}
                    className="px-3 py-2 rounded-lg bg-white dark:bg-zinc-800 border border-[#EEEEEE] dark:border-zinc-700 text-sm"
                  >
                    {details.seasons.map((s) => (
                      <option key={s.id} value={s.seasonNumber}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex items-center gap-2">
                <label htmlFor="player-episode" className="text-xs font-medium text-[#737373]">
                  Episode
                </label>
                <select
                  id="player-episode"
                  value={episode}
                  onChange={(e) => updateEpisodeParams(season, Number(e.target.value))}
                  className="px-3 py-2 rounded-lg bg-white dark:bg-zinc-800 border border-[#EEEEEE] dark:border-zinc-700 text-sm"
                >
                  {Array.from({ length: maxEpisodes }, (_, i) => i + 1).map((epNum) => (
                    <option key={epNum} value={epNum}>
                      Episode {epNum}
                    </option>
                  ))}
                </select>
              </div>

              {mediaType === 'anime' && (
                <div className="flex items-center gap-1 bg-white dark:bg-zinc-800 p-1 rounded-lg border border-[#EEEEEE] dark:border-zinc-700">
                  {(['sub', 'dub'] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => updateEpisodeParams(season, episode, mode)}
                      className={`px-3 py-1.5 rounded-md text-xs font-semibold uppercase transition-colors ${
                        subOrDub === mode
                          ? 'bg-[#E50914] text-white'
                          : 'text-[#737373] dark:text-zinc-400 hover:text-[#171717] dark:hover:text-white'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-2 ml-auto">
                <button
                  type="button"
                  disabled={episode <= 1}
                  onClick={() => updateEpisodeParams(season, Math.max(1, episode - 1))}
                  className="inline-flex items-center gap-1 px-3.5 py-2 rounded-lg border border-[#EEEEEE] dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-semibold disabled:opacity-40 hover:border-[#E50914]"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Prev Ep
                </button>
                <button
                  type="button"
                  disabled={episode >= maxEpisodes}
                  onClick={() => updateEpisodeParams(season, episode + 1)}
                  className="inline-flex items-center gap-1 px-3.5 py-2 rounded-lg bg-[#E50914] hover:bg-[#B20710] text-white text-xs font-semibold disabled:opacity-40"
                >
                  Next Ep
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* External Subtitle Configuration */}
          <form onSubmit={handleApplySubtitle} className="space-y-2 pt-2 border-t border-[#EEEEEE] dark:border-zinc-800">
            <label
              htmlFor="external-subtitle-url"
              className="flex items-center gap-1.5 text-xs font-semibold text-[#171717] dark:text-zinc-200"
            >
              <Subtitles className="w-4 h-4 text-[#E50914]" />
              External Subtitle Track (HTTPS .vtt / .srt)
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                id="external-subtitle-url"
                type="url"
                value={subtitleInput}
                onChange={(e) => setSubtitleInput(e.target.value)}
                placeholder="https://example.com/subtitles.vtt"
                className="flex-1 px-3.5 py-2 rounded-lg bg-white dark:bg-zinc-800 border border-[#EEEEEE] dark:border-zinc-700 text-sm focus:outline-none focus:border-[#E50914]"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-[#171717] dark:bg-white text-white dark:text-[#171717] text-xs font-semibold hover:opacity-90 whitespace-nowrap"
              >
                Apply Subtitles
              </button>
            </div>
            {subtitleError && <p className="text-xs text-[#E50914]">{subtitleError}</p>}
          </form>
        </div>

        {/* Provider Adapter Status & Fallback Info */}
        <div className="p-5 rounded-2xl bg-[#F7F7F8] dark:bg-zinc-900 border border-[#EEEEEE] dark:border-zinc-800 space-y-3">
          <h2 className="font-display text-base font-bold">Stream Adapter</h2>
          <dl className="text-xs space-y-2 text-[#737373] dark:text-zinc-400">
            <div className="flex justify-between gap-2">
              <dt>Provider</dt>
              <dd className="font-mono-tabular text-[#171717] dark:text-zinc-200">VidLink Pro</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>Identifier</dt>
              <dd className="font-mono-tabular text-[#171717] dark:text-zinc-200">
                {mediaType === 'anime'
                  ? details.malId
                    ? `MAL #${details.malId}`
                    : 'Not mapped'
                  : details.tmdbId
                    ? `TMDB #${details.tmdbId}`
                    : 'Not mapped'}
              </dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>Progress Sync</dt>
              <dd className="text-[#171717] dark:text-zinc-200">Origin-Validated postMessage</dd>
            </div>
          </dl>
          {vidLinkResult.url && (
            <a
              href={vidLinkResult.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#E50914] hover:underline pt-1"
            >
              Open provider source directly
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
