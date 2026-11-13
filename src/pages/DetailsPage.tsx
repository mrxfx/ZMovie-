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
import { createCanonicalMediaId } from '../utils/watchProgress';
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

  useSeoMetadata({
    title: details ? `${details.title} (${details.releaseYear || 'Details'}) – ZyvoMovie` : 'Details – ZyvoMovie',
    description: details?.overview?.slice(0, 155) || 'View synopsis, cast, episodes, and streaming options on ZyvoMovie.',
    path: `/${mediaType}/${id}`,
  });

  const loadDetails = async () => {
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
  }, [mediaType, id]);

  const handleSeasonChange = async (seasonNum: number) => {
    setSelectedSeason(seasonNum);
    if (mediaType !== 'tv') return;
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        <HeroSkeleton />
      </div>
    );
  }

  if (error || !details) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8">
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
    mediaType === 'anime'
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 space-y-10">
      {notice && <CatalogNoticeBanner notice={notice} />}

      {/* Details Hero */}
      <section className="relative rounded-2xl overflow-hidden bg-[#171717] border border-[#EEEEEE] dark:border-zinc-800">
        {(details.backdropPath || details.posterPath) && !backdropErr && (
          <img
            src={details.backdropPath || details.posterPath || ''}
            alt={details.title}
            referrerPolicy="no-referrer"
            onError={() => setBackdropErr(true)}
            className="absolute inset-0 w-full h-full object-cover opacity-40"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/75 to-black/45" />

        <div className="relative z-10 p-6 sm:p-10 grid grid-cols-1 md:grid-cols-[220px_1fr] gap-8 items-start">
          {/* Poster */}
          <div className="w-40 sm:w-52 md:w-full aspect-[2/3] rounded-xl overflow-hidden bg-zinc-900 border border-white/10 shrink-0 mx-auto md:mx-0">
            {details.posterPath && !posterErr ? (
              <img
                src={details.posterPath}
                alt={`${details.title} poster`}
                referrerPolicy="no-referrer"
                onError={() => setPosterErr(true)}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-4 text-zinc-400">
                <Film className="w-8 h-8 text-[#E50914] mb-2" />
                <span className="text-xs text-center">{details.title}</span>
              </div>
            )}
          </div>

          {/* Metadata */}
          <div className="space-y-5 text-white">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-zinc-300 font-mono-tabular">
                <span className="font-sans font-semibold text-[#E50914] uppercase tracking-wide">
                  {mediaType === 'tv' ? 'TV Series' : mediaType === 'anime' ? 'Anime' : 'Movie'}
                </span>
                <span aria-hidden="true">·</span>
                <span className="inline-flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {details.releaseYear || 'TBA'}
                </span>
                <span aria-hidden="true">·</span>
                <span className="inline-flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  {details.voteAverage > 0 ? details.voteAverage.toFixed(1) : 'NR'}
                </span>
                {details.runtime && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {details.runtime}m
                    </span>
                  </>
                )}
              </div>

              <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-balance">
                {details.title}
              </h1>

              {details.tagline && (
                <p className="text-sm italic text-zinc-300">{details.tagline}</p>
              )}
            </div>

            {details.genres.length > 0 && (
              <p className="text-xs sm:text-sm text-zinc-300">
                {details.genres.join(' · ')}
              </p>
            )}

            <p className="text-sm sm:text-base text-zinc-200 leading-relaxed max-w-3xl">
              {details.overview}
            </p>

            {details.studios && details.studios.length > 0 && (
              <p className="text-xs text-zinc-400">
                Production: {details.studios.join(', ')}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Link
                to={watchPath}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[#E50914] hover:bg-[#B20710] text-white text-sm font-semibold transition-colors whitespace-nowrap"
              >
                <Play className="w-4 h-4 fill-current" />
                {existingProgress && !existingProgress.completed ? 'Resume Watching' : 'Watch Now'}
              </Link>

              <button
                type="button"
                onClick={() => void toggleWatchlist(details)}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-white/15 hover:bg-white/25 text-white text-sm font-semibold transition-colors whitespace-nowrap"
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
              </button>

              {trailer && (
                <button
                  type="button"
                  onClick={() => setShowTrailer((v) => !v)}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm font-semibold transition-colors whitespace-nowrap"
                >
                  <Youtube className="w-4 h-4 text-[#E50914]" />
                  {showTrailer ? 'Hide Trailer' : 'Watch Trailer'}
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Embedded YouTube Trailer when toggled */}
      {showTrailer && trailer && (
        <section className="space-y-3">
          <h2 className="font-display text-xl font-bold">Official Trailer</h2>
          <div className="aspect-video rounded-2xl overflow-hidden border border-[#EEEEEE] dark:border-zinc-800 bg-black">
            <iframe
              title={`${details.title} Trailer`}
              src={`https://www.youtube-nocookie.com/embed/${trailer.key}`}
              className="w-full h-full"
              allowFullScreen
            />
          </div>
        </section>
      )}

      {/* TV Seasons & Episodes or Anime Episode List */}
      {(mediaType === 'tv' || mediaType === 'anime') && (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="font-display text-xl sm:text-2xl font-bold">Episodes</h2>
            {mediaType === 'tv' && details.seasons && details.seasons.length > 0 && (
              <div className="flex items-center gap-2">
                <label htmlFor="details-season-select" className="text-sm font-medium text-[#737373]">
                  Season:
                </label>
                <select
                  id="details-season-select"
                  value={selectedSeason}
                  onChange={(e) => void handleSeasonChange(Number(e.target.value))}
                  className="px-3.5 py-2 rounded-lg bg-[#F7F7F8] dark:bg-zinc-900 border border-[#EEEEEE] dark:border-zinc-800 text-sm font-medium"
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
            <p className="text-sm text-[#737373]">Loading episodes...</p>
          ) : episodes.length === 0 ? (
            <p className="text-sm text-[#737373]">
              Episode guide not available for this title. You can still launch the player directly.
            </p>
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
                    className="p-4 rounded-xl bg-[#F7F7F8] dark:bg-zinc-900 border border-[#EEEEEE] dark:border-zinc-800 hover:border-[#E50914] transition-colors flex flex-col justify-between gap-2"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 text-xs text-[#737373] dark:text-zinc-400 font-mono-tabular">
                        <span>Episode {ep.episodeNumber}</span>
                        {ep.runtime ? <span>{ep.runtime}m</span> : null}
                      </div>
                      <h3 className="font-display text-sm font-semibold mt-1 line-clamp-1">
                        {ep.name}
                      </h3>
                      {ep.overview && (
                        <p className="text-xs text-[#737373] dark:text-zinc-400 mt-1 line-clamp-2">
                          {ep.overview}
                        </p>
                      )}
                    </div>
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#E50914] pt-1">
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

      {/* Cast */}
      {details.credits.length > 0 && (
        <section className="space-y-4">
          <h2 className="font-display text-xl sm:text-2xl font-bold">Cast & Characters</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
            {details.credits.slice(0, 12).map((c) => (
              <div
                key={`${c.id}-${c.name}`}
                className="p-3 rounded-xl bg-[#F7F7F8] dark:bg-zinc-900 border border-[#EEEEEE] dark:border-zinc-800"
              >
                <p className="font-display text-sm font-semibold line-clamp-1">{c.name}</p>
                <p className="text-xs text-[#737373] dark:text-zinc-400 line-clamp-1 mt-0.5">
                  {c.character}
                </p>
              </div>
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
