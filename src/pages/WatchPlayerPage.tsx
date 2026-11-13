import React, { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  ExternalLink,
  Maximize2,
  MonitorUp,
  RotateCcw,
  ShieldCheck,
} from 'lucide-react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { fetchMediaDetails, fetchTvSeasonEpisodes } from '../services/catalogApi';
import type {
  EpisodeSummary,
  MediaDetails,
  MediaType,
  VidLinkIconsStyle,
  VidLinkPlayerType,
} from '../types/media';
import { useLibrary } from '../context/LibraryContext';
import { useAdminCatalog } from '../context/AdminCatalogContext';
import { buildVidLinkUrl, validateHttpsUrl, validateSubtitleUrl } from '../utils/mediaFilters';
import {
  parsePlayerPostMessage,
  parseVidLinkMediaData,
  shouldPersistProgressUpdate,
} from '../utils/playerEvents';
import { createCanonicalMediaId, formatPlaybackTime } from '../utils/watchProgress';
import { GlassButton, GlassPanel, GlassPlayerControls } from '../components/glass';
import { ErrorState, HeroSkeleton } from '../components/StateBlocks';
import { useSeoMetadata } from '../utils/seo';

const PROVIDER_CONSENT_KEY = 'zyvomovie_vidlink_authorized_v1';
const VIDLINK_PROGRESS_STORAGE_KEY = 'vidLinkProgress';

export function WatchPlayerPage() {
  const { type, id = '' } = useParams<{ type: MediaType; id: string }>();
  const mediaType: MediaType = type === 'tv' || type === 'anime' ? type : 'movie';
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const initialSeason = Math.max(1, Number(searchParams.get('s') || 1));
  const initialEpisode = Math.max(1, Number(searchParams.get('e') || 1));
  const { preferences, saveWatchProgress, recordHistoryEntry, watchProgress } = useLibrary();
  const { findAdminMediaById, toMediaDetails, loadingAdminCatalog } = useAdminCatalog();

  const initialAudio =
    searchParams.get('audio') === 'dub'
      ? 'dub'
      : searchParams.get('audio') === 'sub'
        ? 'sub'
        : preferences.preferredAnimeAudio;

  const [season, setSeason] = useState(initialSeason);
  const [episode, setEpisode] = useState(initialEpisode);
  const [subOrDub, setSubOrDub] = useState<'sub' | 'dub'>(initialAudio);
  const [animeFallback, setAnimeFallback] = useState(true);
  const [playerType, setPlayerType] = useState<VidLinkPlayerType>('default');
  const [iconsStyle, setIconsStyle] = useState<VidLinkIconsStyle>('default');
  const [resumeFromCheckpoint, setResumeFromCheckpoint] = useState(true);

  const [showSubtitlesPanel, setShowSubtitlesPanel] = useState(false);
  const [subtitleInput, setSubtitleInput] = useState('');
  const [subtitleLabelInput, setSubtitleLabelInput] = useState('English');
  const [appliedSubtitle, setAppliedSubtitle] = useState('');
  const [appliedSubtitleLabel, setAppliedSubtitleLabel] = useState('English');
  const [fallbackUrlInput, setFallbackUrlInput] = useState('');
  const [appliedFallbackUrl, setAppliedFallbackUrl] = useState('');
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
  const isInParentFrame = (() => {
    try {
      return window.self !== window.top;
    } catch {
      return true;
    }
  })();

  useSeoMetadata({
    title: details ? `Watch ${details.title} – ZyvoMovie` : 'Watch Player – ZyvoMovie',
    description: 'ZyvoMovie responsive player with VidLink customization and Continue Watching sync.',
    path: `/watch/${mediaType}/${id}`,
  });

  useEffect(() => {
    const adminMatch = findAdminMediaById(mediaType, id);
    if (adminMatch) {
      const converted = toMediaDetails(adminMatch);
      setDetails(converted);
      setEpisodes(converted.episodes || []);
      setError(null);
      setLoading(false);
      return;
    }

    if (id.startsWith('adm_') && loadingAdminCatalog) {
      setLoading(true);
      return;
    }

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
  }, [mediaType, id, findAdminMediaById, toMediaDetails, loadingAdminCatalog]);

  useEffect(() => {
    if (mediaType !== 'tv' || !details?.tmdbId || details.source === 'admin-firestore') return;
    void fetchTvSeasonEpisodes(String(details.tmdbId), season)
      .then((res) => setEpisodes(res.episodes || []))
      .catch(() => {});
  }, [mediaType, details?.tmdbId, details?.source, season]);

  const numericRouteId =
    /^\d+$/.test(id.trim()) && Number(id.trim()) > 0 ? Number(id.trim()) : undefined;
  const resolvedTmdbId =
    details?.tmdbId ?? (mediaType !== 'anime' ? numericRouteId : undefined);
  const resolvedMalId =
    details?.malId ?? (mediaType === 'anime' ? numericRouteId : undefined);

  const canonicalId = details ? createCanonicalMediaId(mediaType, details.id) : '';
  const existingCheckpoint = canonicalId
    ? watchProgress.find((p) => p.mediaId === canonicalId)
    : undefined;
  const startAtSeconds =
    resumeFromCheckpoint && existingCheckpoint && existingCheckpoint.currentTime >= 5
      ? Math.floor(existingCheckpoint.currentTime)
      : undefined;

  const vidLinkResult = buildVidLinkUrl({
    mediaType,
    tmdbId: resolvedTmdbId,
    malId: resolvedMalId,
    season,
    episode,
    subOrDub,
    animeFallback,
    playerType,
    icons: iconsStyle,
    title: true,
    poster: true,
    autoplay: false,
    nextbutton: preferences.autoplayNext,
    startAt: startAtSeconds,
    subtitleUrl: appliedSubtitle || undefined,
    subtitleLabel: appliedSubtitleLabel || undefined,
    fallbackUrl: appliedFallbackUrl || undefined,
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
      tmdbId: resolvedTmdbId,
      malId: resolvedMalId,
      season: mediaType === 'tv' ? season : undefined,
      episode: mediaType === 'tv' || mediaType === 'anime' ? episode : undefined,
    });
  }, [
    details,
    providerAuthorized,
    vidLinkResult.url,
    mediaType,
    season,
    episode,
    subOrDub,
    resolvedTmdbId,
    resolvedMalId,
    recordHistoryEntry,
  ]);

  // Listen strictly to origin-validated VidLink PLAYER_EVENT and MEDIA_DATA postMessages
  useEffect(() => {
    if (!details || !providerAuthorized || !vidLinkResult.url) return;

    const handleMessage = (event: MessageEvent) => {
      const sourceMatches = Boolean(
        iframeRef.current?.contentWindow && event.source === iframeRef.current.contentWindow
      );

      const mediaDataResult = parseVidLinkMediaData(event.data, event.origin, sourceMatches);
      if (mediaDataResult) {
        try {
          const existingRaw = localStorage.getItem(VIDLINK_PROGRESS_STORAGE_KEY);
          const existingMap =
            existingRaw && typeof JSON.parse(existingRaw) === 'object'
              ? (JSON.parse(existingRaw) as Record<string, unknown>)
              : {};
          localStorage.setItem(
            VIDLINK_PROGRESS_STORAGE_KEY,
            JSON.stringify({ ...existingMap, ...mediaDataResult.rawMap })
          );
        } catch {
          // ignore localStorage write issues
        }

        const matched = mediaDataResult.entries.find(
          (entry) =>
            (resolvedTmdbId && entry.id === resolvedTmdbId) ||
            (resolvedMalId && entry.id === resolvedMalId)
        );
        if (matched && matched.duration > 0) {
          setLastPlaybackStats({
            event: 'media_data',
            currentTime: matched.watched,
            duration: matched.duration,
            progressPercent: matched.progressPercent,
          });
          void saveWatchProgress({
            mediaId: createCanonicalMediaId(mediaType, details.id),
            mediaType,
            title: details.title,
            posterPath: details.posterPath || '',
            backdropPath: details.backdropPath || details.posterPath || '',
            tmdbId: resolvedTmdbId,
            malId: resolvedMalId,
            season: mediaType === 'tv' ? matched.season ?? season : undefined,
            episode:
              mediaType === 'tv' || mediaType === 'anime'
                ? matched.episode ?? episode
                : undefined,
            subOrDub: mediaType === 'anime' ? subOrDub : undefined,
            currentTime: matched.watched,
            duration: matched.duration,
            progressPercent: matched.progressPercent,
            completed: matched.completed,
          });
        }
        return;
      }

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
          tmdbId: resolvedTmdbId,
          malId: resolvedMalId,
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
  }, [
    details,
    providerAuthorized,
    vidLinkResult.url,
    mediaType,
    season,
    episode,
    subOrDub,
    resolvedTmdbId,
    resolvedMalId,
    saveWatchProgress,
  ]);

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

  const handleApplySubtitleAndFallback = (e: React.FormEvent) => {
    e.preventDefault();
    setSubtitleError(null);

    if (subtitleInput.trim()) {
      const validSub = validateSubtitleUrl(subtitleInput);
      if (!validSub) {
        setSubtitleError('Subtitle track URL must be a valid HTTPS .vtt or .srt link.');
        return;
      }
      setAppliedSubtitle(validSub);
      setAppliedSubtitleLabel(subtitleLabelInput.trim() || 'English');
    } else {
      setAppliedSubtitle('');
    }

    if (fallbackUrlInput.trim()) {
      const validFallback = validateHttpsUrl(fallbackUrlInput);
      if (!validFallback) {
        setSubtitleError('Fallback redirect URL must be a valid HTTPS link.');
        return;
      }
      setAppliedFallbackUrl(validFallback);
    } else {
      setAppliedFallbackUrl('');
    }

    setIframeLoaded(false);
  };

  if (loading) {
    return (
      <div className="w-full pt-2">
        <HeroSkeleton />
      </div>
    );
  }

  if (error || !details) {
    return (
      <div className="w-full pt-4">
        <ErrorState message={error || 'Title not found.'} onRetry={() => navigate(-1)} />
      </div>
    );
  }

  const maxEpisodes = episodes.length > 0 ? episodes.length : details.episodeCount || 24;

  return (
    <div className="w-full pt-2 space-y-6">
      {/* Floating Glass Top Bar */}
      <GlassPanel variant="default" padding="sm" className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <GlassButton variant="glass" size="sm" to={`/${mediaType}/${id}`}>
            <ArrowLeft className="w-4 h-4" />
            Back to Details
          </GlassButton>
          <div>
            <h1 className="font-display text-lg sm:text-xl font-bold text-white line-clamp-1">
              {details.title}
            </h1>
            <p className="text-xs text-white/65 font-mono-tabular">
              {mediaType === 'tv'
                ? `Season ${season} · Episode ${episode}`
                : mediaType === 'anime'
                  ? `Episode ${episode} · ${subOrDub.toUpperCase()}`
                  : `Feature Film · ${details.releaseYear}`}
            </p>
          </div>
        </div>

        <GlassButton variant="glass" size="sm" onClick={handleFullscreen}>
          <Maximize2 className="w-4 h-4" />
          Fullscreen
        </GlassButton>
      </GlassPanel>

      {/* Existing Resume Banner */}
      {existingCheckpoint && existingCheckpoint.progressPercent > 0 && (
        <GlassPanel variant="subtle" padding="sm" className="flex flex-wrap items-center justify-between gap-3 text-sm text-white/85">
          <span>
            Last synced checkpoint:{' '}
            <strong className="font-mono-tabular text-white">
              {formatPlaybackTime(existingCheckpoint.currentTime)}
            </strong>{' '}
            ({existingCheckpoint.progressPercent.toFixed(0)}%)
          </span>
          <div className="flex items-center gap-3">
            {existingCheckpoint.currentTime >= 5 && (
              <button
                type="button"
                onClick={() => {
                  setResumeFromCheckpoint((prev) => !prev);
                  setIframeLoaded(false);
                }}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/85 hover:text-white cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                {resumeFromCheckpoint
                  ? 'Restart from 0:00'
                  : `Resume at ${formatPlaybackTime(existingCheckpoint.currentTime)}`}
              </button>
            )}
            <Link
              to="/continue-watching"
              className="text-xs font-semibold text-[#E50914] hover:underline"
            >
              Manage Continue Watching
            </Link>
          </div>
        </GlassPanel>
      )}

      {/* Player Theater Frame */}
      <div
        ref={playerContainerRef}
        className="relative aspect-video w-full rounded-3xl overflow-hidden bg-zinc-950 glass-surface shadow-[0_28px_64px_-16px_rgba(17,24,39,0.4)]"
      >
        {!vidLinkResult.url ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-white bg-zinc-950/95">
            <div className="glass-dark rounded-3xl p-6 sm:p-8 max-w-lg space-y-4">
              <AlertTriangle className="w-10 h-10 text-[#E50914] mx-auto" />
              <h2 className="font-display text-xl font-bold">
                External Stream Unavailable Without Provider ID
              </h2>
              <p className="text-sm text-zinc-300 leading-relaxed">
                {vidLinkResult.reason} Configure <code className="text-white">TMDB_READ_ACCESS_TOKEN</code>{' '}
                on the server, assign a TMDB/MAL ID in the Admin Panel, or browse live anime records.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
                <GlassButton variant="primary" size="md" to={`/${mediaType}/${id}`}>
                  Return to Details
                </GlassButton>
                <GlassButton variant="darkGlass" size="md" to="/settings">
                  Check Provider Status
                </GlassButton>
              </div>
            </div>
          </div>
        ) : !providerAuthorized ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-white bg-zinc-950/95">
            <div className="glass-dark rounded-3xl p-6 sm:p-8 max-w-xl space-y-4">
              <ShieldCheck className="w-10 h-10 text-[#E50914] mx-auto" />
              <h2 className="font-display text-xl font-bold">
                Third-Party Streaming Provider Notice
              </h2>
              <p className="text-sm text-zinc-300 leading-relaxed">
                ZyvoMovie embeds external playback via VidLink (<code>vidlink.pro</code>). Playback
                availability depends on third-party stream authorization and regional access. ZyvoMovie
                does not host media files or bypass DRM/access controls.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
                <GlassButton variant="primary" size="lg" onClick={authorizeProvider}>
                  Authorize & Load VidLink Player
                </GlassButton>
                <GlassButton variant="darkGlass" size="lg" to={`/${mediaType}/${id}`}>
                  View Details & Trailer Instead
                </GlassButton>
              </div>
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

      {isInParentFrame && providerAuthorized && vidLinkResult.url && (
        <GlassPanel
          variant="subtle"
          padding="sm"
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-amber-400/35 bg-amber-500/10"
        >
          <div className="flex items-start gap-2.5 text-xs sm:text-sm text-white/85">
            <MonitorUp className="w-4 h-4 text-[#E50914] shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong className="text-white">Seeing &ldquo;Please Disable Sandbox&rdquo;?</strong>{' '}
              The embedded preview container wraps this app in a sandboxed iframe, which VidLink blocks.
              Open the page or stream in a full browser tab for playback.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <a
              href={typeof window !== 'undefined' ? window.location.href : `/watch/${mediaType}/${id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[#E50914] hover:bg-[#B20710] text-white text-xs font-semibold transition-colors"
            >
              Open Watch Page in New Tab
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <a
              href={vidLinkResult.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full glass-control hover:bg-white/20 text-white text-xs font-semibold transition-colors"
            >
              Open VidLink Stream
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </GlassPanel>
      )}

      {/* Liquid Glass Player Controls + Stream Adapter Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <GlassPlayerControls
            mediaType={mediaType}
            playerType={playerType}
            onPlayerTypeChange={(mode) => {
              setPlayerType(mode);
              setIframeLoaded(false);
            }}
            iconStyle={iconsStyle}
            onIconStyleChange={(style) => {
              setIconsStyle(style);
              setIframeLoaded(false);
            }}
            animeAudio={subOrDub}
            onAnimeAudioChange={(audio) => updateEpisodeParams(season, episode, audio)}
            animeFallback={animeFallback}
            onAnimeFallbackChange={(next) => {
              setAnimeFallback(next);
              setIframeLoaded(false);
            }}
            showSubtitlesPanel={showSubtitlesPanel}
            onToggleSubtitlesPanel={() => setShowSubtitlesPanel((v) => !v)}
            subtitleInput={subtitleInput}
            onSubtitleInputChange={setSubtitleInput}
            subtitleLabelInput={subtitleLabelInput}
            onSubtitleLabelInputChange={setSubtitleLabelInput}
            fallbackUrlInput={fallbackUrlInput}
            onFallbackUrlInputChange={setFallbackUrlInput}
            onApplySubtitleAndFallback={handleApplySubtitleAndFallback}
            subtitleError={subtitleError}
            season={season}
            episode={episode}
            seasons={details.seasons}
            maxEpisodes={maxEpisodes}
            onSeasonChange={(sNum) => updateEpisodeParams(sNum, 1)}
            onEpisodeChange={(epNum) => updateEpisodeParams(season, epNum)}
            onPrevEpisode={() => updateEpisodeParams(season, Math.max(1, episode - 1))}
            onNextEpisode={() => updateEpisodeParams(season, episode + 1)}
            lastPlaybackStats={lastPlaybackStats}
          />
        </div>

        {/* Glass Stream Adapter Card */}
        <GlassPanel variant="default" padding="md" className="space-y-3 h-fit">
          <h2 className="font-display text-base font-bold text-white">Stream Adapter</h2>
          <dl className="text-xs space-y-2.5 text-white/65">
            <div className="flex justify-between gap-2">
              <dt>Provider</dt>
              <dd className="font-mono-tabular text-white">
                VidLink Pro ({playerType === 'jw' ? 'JW' : 'Default'})
              </dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>Identifier</dt>
              <dd className="font-mono-tabular text-white">
                {mediaType === 'anime'
                  ? resolvedMalId
                    ? `MAL #${resolvedMalId}`
                    : 'Not mapped'
                  : resolvedTmdbId
                    ? `TMDB #${resolvedTmdbId}`
                    : 'Not mapped'}
              </dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>Resume Start</dt>
              <dd className="font-mono-tabular text-white">
                {startAtSeconds ? formatPlaybackTime(startAtSeconds) : '0:00'}
              </dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>Progress Sync</dt>
              <dd className="text-white">PLAYER_EVENT + MEDIA_DATA</dd>
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
        </GlassPanel>
      </div>
    </div>
  );
}
