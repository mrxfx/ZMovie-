import { useEffect, useState } from 'react';
import { Bookmark, BookmarkCheck, Info, Play, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { fetchHomeCatalog } from '../services/catalogApi';
import type { HomeCatalogResponse } from '../types/media';
import { useLibrary } from '../context/LibraryContext';
import { createCanonicalMediaId, formatPlaybackTime } from '../utils/watchProgress';
import { getMediaDetailRoute, getMediaWatchRoute } from '../components/MediaCard';
import { MediaCarousel } from '../components/MediaCarousel';
import { CatalogNoticeBanner, ErrorState, HeroSkeleton, GridSkeleton } from '../components/StateBlocks';
import { useSeoMetadata } from '../utils/seo';

export function HomePage() {
  useSeoMetadata({
    title: 'ZyvoMovie – Discover & Stream Movies, TV Series & Anime',
    description:
      'Discover trending movies, top-rated TV series, and anime with synchronized watchlists and resume playback on ZyvoMovie.',
    path: '/',
  });

  const [data, setData] = useState<HomeCatalogResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [heroImgError, setHeroImgError] = useState(false);

  const { watchProgress, recentlyViewed, isInWatchlist, toggleWatchlist } = useLibrary();

  const loadHome = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchHomeCatalog();
      setData(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load catalog.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadHome();
  }, []);

  const featured = data?.featured;
  const featuredCanonicalId = featured
    ? createCanonicalMediaId(featured.mediaType, featured.id)
    : '';
  const featuredSaved = featured ? isInWatchlist(featuredCanonicalId) : false;

  const activeContinueWatching = watchProgress.filter((p) => !p.completed).slice(0, 10);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 space-y-10">
      {data?.notice && <CatalogNoticeBanner notice={data.notice} />}

      {loading ? (
        <div className="space-y-10">
          <HeroSkeleton />
          <GridSkeleton count={5} />
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={() => void loadHome()} />
      ) : (
        <>
          {/* Featured Hero */}
          {featured && (
            <section
              aria-label="Featured Title"
              className="relative rounded-2xl overflow-hidden bg-[#171717] border border-[#EEEEEE] dark:border-zinc-800 min-h-[430px] md:min-h-[520px] flex items-end"
            >
              {(featured.backdropPath || featured.posterPath) && !heroImgError ? (
                <img
                  src={featured.backdropPath || featured.posterPath || ''}
                  alt={featured.title}
                  referrerPolicy="no-referrer"
                  onError={() => setHeroImgError(true)}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-zinc-800 to-[#3a070b]" />
              )}

              {/* Measured scrim >= 4.5:1 contrast */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/55 to-black/15" />
              <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/35 to-transparent" />

              <div className="relative z-10 p-6 sm:p-10 md:p-12 max-w-2xl space-y-4">
                <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-zinc-200 font-mono-tabular">
                  <span className="font-sans font-semibold text-[#FF5A62]">Featured Spotlight</span>
                  <span aria-hidden="true">·</span>
                  <span>{featured.releaseYear || 'TBA'}</span>
                  <span aria-hidden="true">·</span>
                  <span className="inline-flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    {featured.voteAverage > 0 ? featured.voteAverage.toFixed(1) : 'NR'}
                  </span>
                  {featured.genres.length > 0 && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="font-sans">{featured.genres.slice(0, 2).join(', ')}</span>
                    </>
                  )}
                </div>

                <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight text-balance leading-[1.1]">
                  {featured.title}
                </h1>

                <p className="text-sm sm:text-base text-zinc-200 line-clamp-3 leading-relaxed">
                  {featured.overview}
                </p>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <Link
                    to={getMediaWatchRoute(featured)}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[#E50914] hover:bg-[#B20710] text-white text-sm font-semibold transition-colors whitespace-nowrap"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    Watch Now
                  </Link>
                  <Link
                    to={getMediaDetailRoute(featured)}
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-white/15 hover:bg-white/25 backdrop-blur-sm text-white text-sm font-semibold transition-colors whitespace-nowrap"
                  >
                    <Info className="w-4 h-4" />
                    Details
                  </Link>
                  <button
                    type="button"
                    onClick={() => void toggleWatchlist(featured)}
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-white/15 hover:bg-white/25 backdrop-blur-sm text-white text-sm font-semibold transition-colors whitespace-nowrap"
                  >
                    {featuredSaved ? (
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
                </div>
              </div>
            </section>
          )}

          {/* Continue Watching */}
          {activeContinueWatching.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <h2 className="font-display text-xl sm:text-2xl font-bold tracking-tight">
                  Continue Watching
                </h2>
                <Link
                  to="/continue-watching"
                  className="text-sm font-medium text-[#737373] dark:text-zinc-400 hover:text-[#E50914] transition-colors whitespace-nowrap"
                >
                  View All
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {activeContinueWatching.slice(0, 4).map((item) => {
                  const rawId =
                    item.mediaType === 'anime'
                      ? item.malId ?? item.mediaId.replace(/^anime_/, '')
                      : item.tmdbId ?? item.mediaId.replace(/^(movie|tv)_/, '');
                  const watchQuery =
                    item.mediaType === 'tv' && item.season && item.episode
                      ? `?s=${item.season}&e=${item.episode}`
                      : item.mediaType === 'anime' && item.episode
                        ? `?e=${item.episode}&audio=${item.subOrDub || 'sub'}`
                        : '';
                  return (
                    <Link
                      key={item.mediaId}
                      to={`/watch/${item.mediaType}/${rawId}${watchQuery}`}
                      className="group rounded-xl overflow-hidden border border-[#EEEEEE] dark:border-zinc-800 bg-[#F7F7F8] dark:bg-zinc-900 hover:border-[#E50914] transition-colors flex flex-col"
                    >
                      <div className="relative aspect-video bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
                        {item.backdropPath || item.posterPath ? (
                          <img
                            src={item.backdropPath || item.posterPath}
                            alt={item.title}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                          />
                        ) : null}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent flex items-end p-3">
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-white">
                            <Play className="w-3.5 h-3.5 fill-current text-[#E50914]" />
                            Resume {formatPlaybackTime(item.currentTime)}
                          </span>
                        </div>
                        <div className="absolute inset-x-0 bottom-0 h-1 bg-white/30">
                          <div
                            className="h-full bg-[#E50914]"
                            style={{ width: `${Math.min(100, item.progressPercent)}%` }}
                          />
                        </div>
                      </div>
                      <div className="p-3.5">
                        <p className="font-display text-sm font-semibold line-clamp-1">
                          {item.title}
                        </p>
                        <p className="text-xs text-[#737373] dark:text-zinc-400 font-mono-tabular mt-1">
                          {item.mediaType === 'tv' && item.season && item.episode
                            ? `S${item.season} E${item.episode} · `
                            : item.mediaType === 'anime' && item.episode
                              ? `Ep ${item.episode} · `
                              : ''}
                          {item.progressPercent.toFixed(0)}% watched
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}

          {/* Carousels */}
          {data && (
            <div className="space-y-10">
              <MediaCarousel
                title="Trending Movies"
                items={data.trendingMovies}
                viewAllTo="/movies?category=trending"
              />
              <MediaCarousel
                title="Popular Movies"
                items={data.popularMovies}
                viewAllTo="/movies?category=popular"
              />
              <MediaCarousel
                title="Top Rated Movies"
                items={data.topRatedMovies}
                viewAllTo="/movies?category=top_rated"
              />
              <MediaCarousel
                title="Upcoming Movies"
                items={data.upcomingMovies}
                viewAllTo="/movies?category=upcoming"
              />
              <MediaCarousel
                title="Popular TV Shows"
                items={data.popularTv}
                viewAllTo="/tv?category=popular"
              />
              <MediaCarousel
                title="Trending Anime"
                items={data.trendingAnime}
                viewAllTo="/anime?category=trending"
              />
              <MediaCarousel title="Recommended For You" items={data.recommended} />
              {recentlyViewed.length > 0 && (
                <MediaCarousel title="Recently Viewed" items={recentlyViewed} />
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
