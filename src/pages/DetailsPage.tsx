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
    path: `/${mediaType}/${id}`,
  });

  const loadDetails = async () => {
    const adminMatch = findAdminMediaById(mediaType, id);
    if (adminMatch) {
      const converted = toMediaDetails(adminMatch);
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

    if (id.startsWith('adm_') && loadingAdminCatalog) {
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
      setDetails(res.details);
      setNotice(res.notice);
      setEpisodes(res.details.episodes || []);
      if (res.details.seasons && res.details.seasons.length > 0) {
        setSelectedSeason(res.details.seasons[0].seasonNumber);
      }
      recordRecentlyViewed(res.details);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load title details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDetails();
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
  const rawWatchId =
    details.source === 'admin-firestore'
      ? details.id
      : mediaType === 'anime'
        ? details.malId ?? details.id.replace(/^anime_/, '')
        : details.tmdbId ?? details.id.replace(/^(movie|tv)_/, '');
  const watchPath =
    mediaType === 'tv'
      ? `/watch/tv/${rawWatchId}?s=${existingProgress?.season || selectedSeason}&e=${existingProgress?.episode || 1}`
      : mediaType === 'anime'
        ? `/watch/anime/${rawWatchId}?e=${existingProgress?.episode || 1}&audio=${existingProgress?.subOrDub || preferences.preferredAnimeAudio}`
        : `/watch/movie/${rawWatchId}`;

  const trailer = details.videos.find((v) => v.type === 'Trailer') || details.videos[0];

  return (
    <div className="w-full pt-2 space-y-10">
      {notice && <CatalogNoticeBanner notice={notice} />}

      {/* Cinematic Backdrop + Floating Liquid Glass Metadata Panel */}
      <section className="relative rounded-3xl overflow-hidden bg-zinc-950 p-4 sm:p-7 md:p-9 shadow-[0_24px_60px_-16px_rgba(17,24,39,0.3)]">
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
                const epWatchUrl =
                  mediaType === 'tv'
                    ? `/watch/tv/${rawWatchId}?s=${selectedSeason}&e=${ep.episodeNumber}`
                    : `/watch/anime/${rawWatchId}?e=${ep.episodeNumber}&audio=${preferences.preferredAnimeAudio}`;
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

      {/* Transparent Glass Cast Cards */}
      {details.credits.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2.5">
            <span className="w-1 h-5 rounded-full bg-[#E50914]" aria-hidden="true" />
            <h2 className="font-display text-xl sm:text-2xl font-bold text-white">Cast &amp; Characters</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
            {details.credits.slice(0, 12).map((c) => (
              <GlassPanel key={`${c.id}-${c.name}`} variant="subtle" padding="sm">
                <p className="font-display text-sm font-semibold text-white line-clamp-1">{c.name}</p>
                <p className="text-xs text-white/65 line-clamp-1 mt-0.5">
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
