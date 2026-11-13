import { useEffect, useState } from 'react';
import {
  Bookmark,
  BookmarkCheck,
  Calendar,
  Clock,
  Film,
  Play,
  Star,
  Youtube,
} from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { fetchMediaDetails, fetchTvSeasonEpisodes } from '../services/catalogApi';
import type { EpisodeSummary, MediaDetails, MediaType } from '../types/media';
import { useLibrary } from '../context/LibraryContext';
import { useAdminCatalog } from '../context/AdminCatalogContext';
import { createCanonicalMediaId } from '../utils/watchProgress';
import { GlassBadge, GlassButton, GlassModal, GlassPanel } from '../components/glass';
import { getMediaWatchRoute, getShortTypeCode } from '../utils/mediaRoutes';
import { MediaCarousel } from '../components/MediaCarousel';
import { CatalogNoticeBanner, ErrorState, HeroSkeleton } from '../components/StateBlocks';
import { useSeoMetadata } from '../utils/seo';

export function DetailsPage({ mediaType }: { mediaType: MediaType }) {
  const { id = '' } = useParams<{ id: string }>();

  const [details, setDetails] = useState<MediaDetails | null>(null);
  const [notice, setNotice] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedSeason, setSelectedSeason] = useState(1);
  const [episodes, setEpisodes] = useState<EpisodeSummary[]>([]);
  const [loadingEpisodes, setLoadingEpisodes] = useState(false);
  const [showTrailer, setShowTrailer] = useState(false);
  const [backdropErr, setBackdropErr] = useState(false);
  const [posterErr, setPosterErr] = useState(false);

  const { isInWatchlist, toggleWatchlist, recordRecentlyViewed, watchProgress, preferences } =
    useLibrary();
  const { findAdminMediaById, toMediaDetails, loadingAdminCatalog } = useAdminCatalog();

  useSeoMetadata({
    title: details ? `${details.title} (${details.releaseYear || 'Details'}) – ZyvoMovie` : 'Details – ZyvoMovie',
    description: details?.overview?.slice(0, 155) || 'View synopsis, cast, episodes, and streaming options on ZyvoMovie.',
    path: `/${getShortTypeCode(mediaType)}/${id}`,
  });

  const loadDetails = async (isActive: () => boolean = () => true) => {
    const adminMatch = findAdminMediaById(mediaType, id);
    if (adminMatch) {
      const converted = toMediaDetails(adminMatch);
      if (!isActive()) return;
      setDetails(converted);
      setNotice(undefined);
      setEpisodes(converted.episodes || []);
      if (converted.seasons && converted.seasons.length > 0) {
        setSelectedSeason(converted.seasons[0].seasonNumber);
      }
      recordRecentlyViewed(converted);
      setError(null);
      setLoading(false);
      return;
    }

    if (loadingAdminCatalog) {
      setLoading(true);
      return;
    }

    setLoading(true);
    setError(null);
    setBackdropErr(false);
    setPosterErr(false);
    setShowTrailer(false);
    try {
      const res = await fetchMediaDetails(mediaType, id);
      if (!isActive()) return;
      setDetails(res.details);
      setNotice(res.notice);
      setEpisodes(res.details.episodes || []);
      if (res.details.seasons && res.details.seasons.length > 0) {
        setSelectedSeason(res.details.seasons[0].seasonNumber);
      }
      recordRecentlyViewed(res.details);
    } catch (err) {
      if (!isActive()) return;
      setError(err instanceof Error ? err.message : 'Unable to load title details.');
    } finally {
      if (isActive()) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    let active = true;
    void loadDetails(() => active);
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mediaType, id, findAdminMediaById, loadingAdminCatalog]);

  const handleSeasonChange = async (seasonNum: number) => {
    setSelectedSeason(seasonNum);
    if (mediaType !== 'tv' || details?.source === 'admin-firestore') return;
    setLoadingEpisodes(true);
    try {
      const res = await fetchTvSeasonEpisodes(id, seasonNum);
      setEpisodes(res.episodes || []);
    } catch {
      setEpisodes([]);
    } finally {
      setLoadingEpisodes(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full pt-2 space-y-6">
        <HeroSkeleton />
      </div>
    );
  }

  if (error || !details) {
    return (
      <div className="w-full pt-4">
        <ErrorState
          title="Title unavailable"
          message={error || 'The requested title could not be found.'}
          onRetry={() => void loadDetails()}
        />
      </div>
    );
  }

  const canonicalId = createCanonicalMediaId(mediaType, details.id);
  const saved = isInWatchlist(canonicalId);
  const existingProgress = watchProgress.find((p) => p.mediaId === canonicalId);
  const watchQuery =
    mediaType === 'tv'
      ? `?s=${existingProgress?.season || selectedSeason}&e=${existingProgress?.episode || 1}`
      : mediaType === 'anime'
        ? `?e=${existingProgress?.episode || 1}&audio=${existingProgress?.subOrDub || preferences.preferredAnimeAudio}`
        : '';
  const watchPath = getMediaWatchRoute(details, watchQuery);

  const trailer = details.videos.find((v) => v.type === 'Trailer') || details.videos[0];

  return (
    <div className="w-full pt-2 space-y-10">
      {notice && <CatalogNoticeBanner notice={notice} />}

      {/* Mobile Native Details Layout (< 768px) */}
      <section className="md:hidden space-y-4">
        <div className="relative -mx-3.5 -mt-2.5 h-56 sm:h-64 overflow-hidden bg-zinc-950">
          {(details.backdropPath || details.posterPath) && !backdropErr ? (
            <img
              src={details.backdropPath || details.posterPath || ''}
              alt={details.title}
              decoding="async"
              referrerPolicy="no-referrer"
              onError={() => setBackdropErr(true)}
              className="w-full h-full object-cover object-center opacity-75"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-zinc-900 via-[#151922] to-[#3a070b]" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#151922] via-black/40 to-black/20" />
        </div>

        <div className="-mt-20 relative z-10 flex items-end gap-3.5">
          <div className="w-28 aspect-[2/3] rounded-2xl overflow-hidden glass-surface shrink-0 shadow-2xl border border-white/20 bg-zinc-900">
            {details.posterPath && !posterErr ? (
              <img
                src={details.posterPath}
                alt={`${details.title} poster`}
                decoding="async"
                referrerPolicy="no-referrer"
                onError={() => setPosterErr(true)}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-2 text-zinc-400">
                <Film className="w-6 h-6 text-[#E50914] mb-1" />
                <span className="text-[11px] text-center line-clamp-2">{details.title}</span>
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1 space-y-1.5 pb-1">
            <span className="inline-block text-[11px] font-semibold uppercase tracking-wide text-[#E50914]">
              {mediaType === 'tv' ? 'TV Series' : mediaType === 'anime' ? 'Anime' : 'Movie'}
            </span>
            <h1 className="font-display text-xl sm:text-2xl font-extrabold tracking-tight text-white leading-tight text-balance">
              {details.title}
            </h1>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-white/75 font-mono-tabular">
              <span className="inline-flex items-center gap-1 text-white font-semibold">
                <Star className="w-3.5 h-3.5 fill-[#E50914] text-[#E50914]" />
                {details.voteAverage > 0 ? details.voteAverage.toFixed(1) : 'NR'}
              </span>
              <span aria-hidden="true">·</span>
              <span>{details.releaseYear || 'TBA'}</span>
              {details.runtime ? (
                <>
                  <span aria-hidden="true">·</span>
                  <span>{details.runtime}m</span>
                </>
              ) : null}
            </div>
          </div>
        </div>

        {/* Compact Mobile Primary Actions */}
        <div className="flex items-center gap-2">
          <GlassButton variant="white" size="md" to={watchPath} className="flex-1 min-h-[46px]">
            <Play className="w-4 h-4 fill-current" />
            {existingProgress && !existingProgress.completed ? 'Resume Watching' : 'Watch Now'}
          </GlassButton>

          <button
            type="button"
            onClick={() => void toggleWatchlist(details)}
            aria-label={saved ? 'Remove from My List' : 'Add to My List'}
            aria-pressed={saved}
            className={`w-12 h-[46px] min-w-[44px] rounded-full flex items-center justify-center border transition-colors shrink-0 cursor-pointer ${
              saved
                ? 'bg-[#E50914] border-white/30 text-white'
                : 'glass-control text-white'
            }`}
          >
            {saved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
          </button>

          {trailer && (
            <button
              type="button"
              onClick={() => setShowTrailer(true)}
              aria-label="Watch Trailer"
              className="w-12 h-[46px] min-w-[44px] rounded-full glass-control text-white flex items-center justify-center shrink-0 cursor-pointer"
            >
              <Youtube className="w-4 h-4 text-[#E50914]" />
            </button>
          )}
        </div>

        <GlassPanel variant="dark" padding="md" className="rounded-2xl space-y-3">
          {details.tagline && <p className="text-xs italic text-white/75">{details.tagline}</p>}
          {details.genres.length > 0 && (
            <p className="text-xs text-white/70">{details.genres.join(' · ')}</p>
          )}
          <p className="text-sm text-white/85 leading-relaxed">{details.overview}</p>
          {details.studios && details.studios.length > 0 && (
            <p className="text-xs text-white/55">Production: {details.studios.join(', ')}</p>
          )}
        </GlassPanel>
      </section>

      {/* Desktop Cinematic Backdrop + Floating Liquid Glass Metadata Panel (>= 768px) */}
      <section className="hidden md:block relative rounded-3xl overflow-hidden bg-zinc-950 p-7 md:p-9 shadow-[0_24px_60px_-16px_rgba(17,24,39,0.3)]">
        {(details.backdropPath || details.posterPath) && !backdropErr && (
          <img
            src={details.backdropPath || details.posterPath || ''}
            alt={details.title}
            referrerPolicy="no-referrer"
            onError={() => setBackdropErr(true)}
            className="absolute inset-0 w-full h-full object-cover opacity-55"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/45 to-black/25" />

        <div className="relative z-10 grid grid-cols-1 md:grid-cols-[230px_1fr] gap-6 md:gap-8 items-start">
          {/* Poster Card */}
          <div className="w-40 sm:w-52 md:w-full aspect-[2/3] rounded-2xl overflow-hidden glass-surface shrink-0 mx-auto md:mx-0 shadow-2xl">
            {details.posterPath && !posterErr ? (
              <img
                src={details.posterPath}
                alt={`${details.title} poster`}
                referrerPolicy="no-referrer"
                onError={() => setPosterErr(true)}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-4 text-zinc-500">
                <Film className="w-8 h-8 text-[#E50914] mb-2" />
                <span className="text-xs text-center">{details.title}</span>
              </div>
            )}
          </div>

          {/* Floating Liquid Glass Metadata Panel */}
          <GlassPanel variant="dark" padding="lg" className="rounded-3xl space-y-5">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <GlassBadge variant="red" size="xs" className="uppercase tracking-wide">
                  {mediaType === 'tv' ? 'TV Series' : mediaType === 'anime' ? 'Anime' : 'Movie'}
                </GlassBadge>
                <GlassBadge variant="default" size="xs">
                  <Star className="w-3 h-3 fill-[#E50914] text-[#E50914]" />
                  {details.voteAverage > 0 ? details.voteAverage.toFixed(1) : 'NR'}
                </GlassBadge>
                <GlassBadge variant="subtle" size="xs" className="font-mono-tabular">
                  <Calendar className="w-3 h-3" />
                  {details.releaseYear || 'TBA'}
                </GlassBadge>
                {details.runtime && (
                  <GlassBadge variant="subtle" size="xs" className="font-mono-tabular">
                    <Clock className="w-3 h-3" />
                    {details.runtime}m
                  </GlassBadge>
                )}
              </div>

              <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-balance text-white">
                {details.title}
              </h1>

              {details.tagline && (
                <p className="text-sm italic text-white/75">{details.tagline}</p>
              )}
            </div>

            {details.genres.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {details.genres.map((genre) => (
                  <GlassBadge key={genre} variant="default" size="sm">
                    {genre}
                  </GlassBadge>
                ))}
              </div>
            )}

            <p className="text-sm sm:text-base text-white/85 leading-relaxed max-w-3xl">
              {details.overview}
            </p>

            {details.studios && details.studios.length > 0 && (
              <p className="text-xs text-white/60">
                Production: {details.studios.join(', ')}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              <GlassButton variant="white" size="lg" to={watchPath}>
                <Play className="w-4 h-4 fill-current" />
                {existingProgress && !existingProgress.completed ? 'Resume Watching' : 'Watch Now'}
              </GlassButton>

              <GlassButton
                variant="darkGlass"
                size="lg"
                onClick={() => void toggleWatchlist(details)}
              >
                {saved ? (
                  <>
                    <BookmarkCheck className="w-4 h-4 text-[#E50914]" />
                    In My List
                  </>
                ) : (
                  <>
                    <Bookmark className="w-4 h-4" />
                    Add to My List
                  </>
                )}
              </GlassButton>

              {trailer && (
                <GlassButton
                  variant="glass"
                  size="lg"
                  onClick={() => setShowTrailer(true)}
                >
                  <Youtube className="w-4 h-4 text-[#E50914]" />
                  Watch Trailer
                </GlassButton>
              )}
            </div>
          </GlassPanel>
        </div>
      </section>

      {/* Glass Modal Trailer Viewer */}
      {trailer && (
        <GlassModal
          open={showTrailer}
          onClose={() => setShowTrailer(false)}
          title={`${details.title} — Official Trailer`}
          maxWidthClass="max-w-4xl"
        >
          <div className="aspect-video rounded-2xl overflow-hidden bg-black">
            <iframe
              title={`${details.title} Trailer`}
              src={`https://www.youtube-nocookie.com/embed/${trailer.key}?autoplay=1`}
              className="w-full h-full"
              allow="autoplay; fullscreen"
              allowFullScreen
            />
          </div>
        </GlassModal>
      )}

      {/* TV Seasons & Episodes or Anime Episode List */}
      {(mediaType === 'tv' || mediaType === 'anime') && (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <span className="w-1 h-5 rounded-full bg-[#E50914]" aria-hidden="true" />
              <h2 className="font-display text-xl sm:text-2xl font-bold">Episodes</h2>
            </div>

            {mediaType === 'tv' && details.seasons && details.seasons.length > 0 && (
              <div className="flex items-center gap-2">
                <label
                  htmlFor="details-season-select"
                  className="text-sm font-medium text-white/70"
                >
                  Season:
                </label>
                <select
                  id="details-season-select"
                  value={selectedSeason}
                  onChange={(e) => void handleSeasonChange(Number(e.target.value))}
                  className="px-3.5 py-2 rounded-full glass-control text-sm font-medium text-white focus:outline-none focus:border-white/45"
                >
                  {details.seasons.map((s) => (
                    <option key={s.id} value={s.seasonNumber}>
                      {s.name} ({s.episodeCount} eps)
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {loadingEpisodes ? (
            <p className="text-sm text-white/65">Loading episodes...</p>
          ) : episodes.length === 0 ? (
            <GlassPanel variant="subtle" padding="md">
              <p className="text-sm text-white/70">
                Episode guide not available for this title. You can still launch the player directly.
              </p>
            </GlassPanel>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {episodes.slice(0, 24).map((ep) => {
                const epWatchQuery =
                  mediaType === 'tv'
                    ? `?s=${selectedSeason}&e=${ep.episodeNumber}`
                    : `?e=${ep.episodeNumber}&audio=${preferences.preferredAnimeAudio}`;
                const epWatchUrl = getMediaWatchRoute(details, epWatchQuery);
                return (
                  <Link
                    key={`${ep.seasonNumber}-${ep.episodeNumber}`}
                    to={epWatchUrl}
                    className="group p-4 rounded-2xl glass-surface glass-specular hover:border-white/40 hover:-translate-y-0.5 transition-all flex flex-col justify-between gap-2"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 text-xs text-white/60 font-mono-tabular">
                        <span>Episode {ep.episodeNumber}</span>
                        {ep.runtime ? <span>{ep.runtime}m</span> : null}
                      </div>
                      <h3 className="font-display text-sm font-semibold text-white mt-1 line-clamp-1 group-hover:text-[#E50914] transition-colors">
                        {ep.name}
                      </h3>
                      {ep.overview && (
                        <p className="text-xs text-white/65 mt-1 line-clamp-2">
                          {ep.overview}
                        </p>
                      )}
                    </div>
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/90 group-hover:text-[#E50914] pt-1">
                      <Play className="w-3.5 h-3.5 fill-current" />
                      Play Episode
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* Transparent Glass Cast Cards (Horizontal touch-scroll on mobile, grid on md+) */}
      {details.credits.length > 0 && (
        <section className="space-y-3.5 sm:space-y-4">
          <div className="flex items-center gap-2.5">
            <span className="w-1 h-5 rounded-full bg-[#E50914]" aria-hidden="true" />
            <h2 className="font-display text-lg sm:text-2xl font-bold text-white">
              Cast &amp; Characters
            </h2>
          </div>
          <div className="flex gap-2.5 overflow-x-auto no-scrollbar snap-x snap-mandatory touch-pan-x -mx-3.5 px-3.5 md:mx-0 md:px-0 md:grid md:grid-cols-4 lg:grid-cols-6 md:gap-4 pb-1">
            {details.credits.slice(0, 12).map((c) => (
              <GlassPanel
                key={`${c.id}-${c.name}`}
                variant="subtle"
                padding="sm"
                className="min-w-[144px] max-w-[164px] md:min-w-0 md:max-w-none snap-start shrink-0 rounded-2xl"
              >
                <p className="font-display text-xs sm:text-sm font-semibold text-white line-clamp-1">
                  {c.name}
                </p>
                <p className="text-[11px] sm:text-xs text-white/65 line-clamp-1 mt-0.5">
                  {c.character}
                </p>
              </GlassPanel>
            ))}
          </div>
        </section>
      )}

      {/* Similar & Recommendations */}
      {details.similar.length > 0 && (
        <MediaCarousel title="Similar Titles" items={details.similar} />
      )}
      {details.recommendations.length > 0 && (
        <MediaCarousel title="Recommended Next" items={details.recommendations} />
      )}
    </div>
  );
}
