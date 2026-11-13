import { useEffect, useMemo, useState } from 'react';
import {
  Bookmark,
  BookmarkCheck,
  ChevronLeft,
  ChevronRight,
  Flame,
  Info,
  Play,
  Star,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { fetchHomeCatalog } from '../services/catalogApi';
import type { HomeCatalogResponse, MediaSummary } from '../types/media';
import { useLibrary } from '../context/LibraryContext';
import { useAdminCatalog } from '../context/AdminCatalogContext';
import { createCanonicalMediaId, formatPlaybackTime } from '../utils/watchProgress';
import { getStoredMediaWatchRoute } from '../utils/mediaRoutes';
import {
  GlassBadge,
  GlassButton,
  getMediaDetailRoute,
  getMediaWatchRoute,
} from '../components/glass';
import { MediaCarousel } from '../components/MediaCarousel';
import {
  CatalogNoticeBanner,
  EmptyState,
  ErrorState,
  GridSkeleton,
  HeroSkeleton,
} from '../components/StateBlocks';
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
  const [heroIndex, setHeroIndex] = useState(0);
  const [heroImgError, setHeroImgError] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  const { watchProgress, recentlyViewed, isInWatchlist, toggleWatchlist } = useLibrary();
  const { adminMediaSummaries } = useAdminCatalog();

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

  const heroSlides = useMemo(() => {
    const candidates: MediaSummary[] = [
      ...adminMediaSummaries.filter((m) => m.featured),
      ...(data?.featured ? [data.featured] : []),
      ...(data?.trendingMovies || []),
      ...(data?.popularTv || []),
      ...(data?.trendingAnime || []),
      ...adminMediaSummaries,
    ];
    const seen = new Set<string>();
    const unique: MediaSummary[] = [];
    for (const item of candidates) {
      if (!seen.has(item.id)) {
        seen.add(item.id);
        unique.push(item);
      }
      if (unique.length >= 6) break;
    }
    return unique;
  }, [adminMediaSummaries, data]);

  const activeSlideIndex = heroSlides.length > 0 ? heroIndex % heroSlides.length : 0;
  const featured = heroSlides[activeSlideIndex] || null;

  useEffect(() => {
    setHeroImgError(false);
  }, [featured?.id]);

  const featuredCanonicalId = featured
    ? createCanonicalMediaId(featured.mediaType, featured.id)
    : '';
  const featuredSaved = featured ? isInWatchlist(featuredCanonicalId) : false;

  const adminMovies = adminMediaSummaries.filter((m) => m.mediaType === 'movie');
  const adminTv = adminMediaSummaries.filter((m) => m.mediaType === 'tv');
  const adminAnime = adminMediaSummaries.filter((m) => m.mediaType === 'anime');

  const activeContinueWatching = watchProgress.filter((p) => !p.completed).slice(0, 4);

  const recommendedBento = useMemo(() => {
    const pool = [
      ...(data?.recommended || []),
      ...(data?.popularMovies || []),
      ...(data?.trendingAnime || []),
      ...adminMediaSummaries,
    ];
    const seen = new Set<string>(featured ? [featured.id] : []);
    const out: MediaSummary[] = [];
    for (const item of pool) {
      if (!seen.has(item.id)) {
        seen.add(item.id);
        out.push(item);
      }
      if (out.length >= 4) break;
    }
    return out;
  }, [data, adminMediaSummaries, featured]);

  const upcomingSideCards = useMemo(() => {
    const pool = [...(data?.upcomingMovies || []), ...(data?.trendingMovies || [])];
    const seen = new Set<string>();
    const out: MediaSummary[] = [];
    for (const item of pool) {
      if (!seen.has(item.id)) {
        seen.add(item.id);
        out.push(item);
      }
      if (out.length >= 2) break;
    }
    return out;
  }, [data]);

  const quickPicksFallback = useMemo(() => {
    if (recentlyViewed.length > 0) return recentlyViewed.slice(0, 4);
    return [...(data?.popularTv || []), ...(data?.trendingAnime || [])].slice(0, 4);
  }, [recentlyViewed, data]);

  const cycleHero = (delta: number) => {
    if (heroSlides.length <= 1) return;
    setHeroIndex((prev) => (prev + delta + heroSlides.length) % heroSlides.length);
  };

  return (
    <div className="pt-2 space-y-8 sm:space-y-10">
      {data?.notice && <CatalogNoticeBanner notice={data.notice} />}

      {loading ? (
        <div className="space-y-8">
          <HeroSkeleton />
          <GridSkeleton count={7} />
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={() => void loadHome()} />
      ) : heroSlides.length === 0 &&
        recommendedBento.length === 0 &&
        adminMediaSummaries.length === 0 &&
        (data?.trendingMovies.length || 0) === 0 &&
        (data?.popularTv.length || 0) === 0 &&
        (data?.trendingAnime.length || 0) === 0 ? (
        <EmptyState
          title="No catalog titles available yet"
          description="Set TMDB_READ_ACCESS_TOKEN on the server for live TMDB movies and series, browse live Anime, or publish custom titles in the Admin Studio."
          actionLabel="Open Admin Studio"
          actionTo="/admin"
        />
      ) : (
        <>
          {/* Full-Width Spatial Bento Grid Stage */}
          <div
            className={`grid grid-cols-1 gap-5 xl:gap-6 items-start ${
              upcomingSideCards.length > 0 ||
              activeContinueWatching.length > 0 ||
              quickPicksFallback.length > 0
                ? 'lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_380px] 2xl:grid-cols-[minmax(0,1fr)_420px]'
                : ''
            }`}
          >
            {/* Primary Column: Hero Showcase + "You might like" 4-Card Bento Row */}
            <div className="min-w-0 space-y-6">
              {featured && (
                <section
                  aria-label="Featured Title"
                  onTouchStart={(e) => setTouchStartX(e.touches[0]?.clientX ?? null)}
                  onTouchEnd={(e) => {
                    if (touchStartX === null) return;
                    const endX = e.changedTouches[0]?.clientX ?? touchStartX;
                    const deltaX = endX - touchStartX;
                    if (Math.abs(deltaX) > 48) {
                      cycleHero(deltaX < 0 ? 1 : -1);
                    }
                    setTouchStartX(null);
                  }}
                  className="relative rounded-2xl sm:rounded-3xl overflow-hidden bg-zinc-950 min-h-[340px] sm:min-h-[440px] xl:min-h-[500px] flex flex-col justify-between p-4 sm:p-7 xl:p-9 border border-white/20 shadow-[0_24px_60px_-16px_rgba(0,0,0,0.65)]"
                >
                  {(featured.backdropPath || featured.posterPath) && !heroImgError ? (
                    <img
                      src={featured.backdropPath || featured.posterPath || ''}
                      alt={featured.title}
                      decoding="async"
                      referrerPolicy="no-referrer"
                      onError={() => setHeroImgError(true)}
                      className="absolute inset-0 w-full h-full object-cover object-center sm:object-[50%_25%]"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-zinc-800 to-[#3a070b]" />
                  )}

                  {/* Cinematic Dark Scrim for High Legibility */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-black/25" />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/25 to-transparent" />

                  {/* Top Row: Trending Pill + Rating */}
                  <div className="relative z-10 flex items-center justify-between gap-2">
                    <GlassBadge variant="dark" size="sm">
                      <Flame className="w-3.5 h-3.5 text-[#E50914] fill-[#E50914]/30" />
                      Now Trending
                    </GlassBadge>
                    {featured.voteAverage > 0 && (
                      <GlassBadge variant="dark" size="sm">
                        <Star className="w-3.5 h-3.5 fill-[#E50914] text-[#E50914]" />
                        {featured.voteAverage.toFixed(1)}
                      </GlassBadge>
                    )}
                  </div>

                  {/* Bottom Content Row + Carousel Controls */}
                  <div className="relative z-10 flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:gap-4 pt-12 sm:pt-16">
                    <div className="max-w-2xl space-y-2 sm:space-y-3 min-w-0">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-white/80 font-mono-tabular">
                        <span>{featured.releaseYear || 'TBA'}</span>
                        {featured.genres.slice(0, 2).map((genre) => (
                          <span key={genre} className="inline-flex items-center gap-2 font-sans">
                            <span aria-hidden="true">·</span>
                            <span>{genre}</span>
                          </span>
                        ))}
                      </div>

                      <h1 className="font-display text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-[1.12] text-balance">
                        {featured.title}
                      </h1>

                      <p className="text-xs sm:text-sm text-white/80 line-clamp-2 leading-relaxed">
                        {featured.overview}
                      </p>

                      <div className="flex items-center gap-2 sm:gap-2.5 pt-1">
                        <GlassButton
                          variant="white"
                          size="md"
                          to={getMediaWatchRoute(featured)}
                          className="flex-1 sm:flex-none min-h-[44px]"
                        >
                          <Play className="w-4 h-4 fill-current" />
                          Watch
                        </GlassButton>
                        <GlassButton
                          variant="darkGlass"
                          size="md"
                          to={getMediaDetailRoute(featured)}
                          className="min-h-[44px]"
                        >
                          <Info className="w-4 h-4" />
                          Details
                        </GlassButton>
                        <button
                          type="button"
                          onClick={() => void toggleWatchlist(featured)}
                          aria-label={
                            featuredSaved
                              ? `Remove ${featured.title} from My List`
                              : `Add ${featured.title} to My List`
                          }
                          aria-pressed={featuredSaved}
                          className={`w-11 h-11 min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                            featuredSaved
                              ? 'bg-[#E50914] text-white border border-white/30'
                              : 'glass-control text-white hover:bg-white/25'
                          }`}
                        >
                          {featuredSaved ? (
                            <BookmarkCheck className="w-4 h-4" />
                          ) : (
                            <Bookmark className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {heroSlides.length > 1 && (
                      <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto shrink-0">
                        <div className="flex sm:hidden items-center gap-1.5" aria-hidden="true">
                          {heroSlides.map((slide, idx) => (
                            <span
                              key={slide.id}
                              className={`h-1.5 rounded-full transition-all ${
                                idx === activeSlideIndex ? 'w-5 bg-[#E50914]' : 'w-1.5 bg-white/35'
                              }`}
                            />
                          ))}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => cycleHero(-1)}
                            aria-label="Previous featured title"
                            className="w-11 h-11 sm:w-10 sm:h-10 rounded-full glass-control hover:bg-white/25 text-white flex items-center justify-center transition-colors cursor-pointer"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => cycleHero(1)}
                            aria-label="Next featured title"
                            className="w-11 h-11 sm:w-10 sm:h-10 rounded-full glass-control hover:bg-white/25 text-white flex items-center justify-center transition-colors cursor-pointer"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </section>
              )}

              {/* "You might like" 4-Card Bento Showcase */}
              {recommendedBento.length > 0 && (
                <section className="space-y-3.5">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="font-display text-lg sm:text-xl font-bold text-white tracking-tight">
                      You might like
                    </h2>
                    <Link
                      to="/movies"
                      className="px-3.5 py-1.5 rounded-full glass-control text-xs font-medium text-white/85 hover:text-white hover:bg-white/20 transition-colors"
                    >
                      See all
                    </Link>
                  </div>

                  <div className="grid grid-cols-2 xl:grid-cols-4 gap-2.5 sm:gap-4">
                    {recommendedBento.map((item) => {
                      const canonicalId = createCanonicalMediaId(item.mediaType, item.id);
                      const saved = isInWatchlist(canonicalId);
                      const genreLabel =
                        item.genres[0] ||
                        (item.mediaType === 'anime'
                          ? 'Anime'
                          : item.mediaType === 'tv'
                            ? 'Series'
                            : 'Movie');
                      return (
                        <article
                          key={item.id}
                          className="group relative aspect-[3/4] sm:aspect-[4/3] rounded-2xl overflow-hidden border border-white/18 bg-zinc-900 shadow-[0_14px_34px_-12px_rgba(0,0,0,0.55)]"
                        >
                          <Link
                            to={getMediaDetailRoute(item)}
                            aria-label={`View details for ${item.title}`}
                            className="block w-full h-full"
                          >
                            {item.backdropPath || item.posterPath ? (
                              <img
                                src={item.backdropPath || item.posterPath || ''}
                                alt={item.title}
                                loading="lazy"
                                decoding="async"
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover transition-transform duration-500 md:group-hover:scale-[1.06]"
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-950" />
                            )}
                          </Link>

                          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-transparent" />

                          {/* Top-right Bookmark Circle with 44px touch target */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              void toggleWatchlist(item);
                            }}
                            aria-label={
                              saved
                                ? `Remove ${item.title} from My List`
                                : `Add ${item.title} to My List`
                            }
                            aria-pressed={saved}
                            className="absolute top-0.5 right-0.5 z-10 min-w-[44px] min-h-[44px] flex items-center justify-center cursor-pointer rounded-full"
                          >
                            <span
                              className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                                saved
                                  ? 'bg-[#E50914] text-white border border-white/30'
                                  : 'bg-black/50 hover:bg-black/75 backdrop-blur-md text-white border border-white/25'
                              }`}
                            >
                              {saved ? (
                                <BookmarkCheck className="w-3.5 h-3.5" />
                              ) : (
                                <Bookmark className="w-3.5 h-3.5" />
                              )}
                            </span>
                          </button>

                          {/* Bottom Title, Genre & Crisp White Play Circle */}
                          <div className="absolute inset-x-0 bottom-0 p-2.5 sm:p-3 flex items-end justify-between gap-2">
                            <div className="min-w-0 space-y-0.5 sm:space-y-1">
                              <span className="text-[10px] font-medium text-white/75">
                                {genreLabel}
                              </span>
                              <Link
                                to={getMediaDetailRoute(item)}
                                className="block font-display text-xs sm:text-sm font-bold text-white hover:text-[#E50914] transition-colors line-clamp-1"
                              >
                                {item.title}
                              </Link>
                              <p className="hidden sm:block text-[11px] text-white/70 line-clamp-1">
                                {item.overview || `${item.releaseYear || 'TBA'}`}
                              </p>
                            </div>
                            <Link
                              to={getMediaWatchRoute(item)}
                              aria-label={`Play ${item.title}`}
                              className="w-9 h-9 min-w-[36px] min-h-[36px] rounded-full bg-white hover:bg-zinc-100 text-[#171717] flex items-center justify-center shrink-0 shadow-lg transition-transform md:group-hover:scale-105"
                            >
                              <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                            </Link>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </section>
              )}
            </div>

            {/* Right Side Glass Column: Upcoming + Continue Watching / Quick Picks */}
            {(upcomingSideCards.length > 0 ||
              activeContinueWatching.length > 0 ||
              quickPicksFallback.length > 0) && (
            <aside className="space-y-5">
              {/* New & Upcoming Panel */}
              {upcomingSideCards.length > 0 && (
                <section className="glass-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="font-display text-base font-bold text-white flex items-center gap-1.5">
                      <Flame className="w-4 h-4 text-[#E50914]" />
                      New &amp; Upcoming
                    </h2>
                    <Link
                      to="/movies?category=upcoming"
                      className="text-xs font-medium text-white/65 hover:text-white transition-colors"
                    >
                      See all
                    </Link>
                  </div>

                  <div className="grid grid-cols-2 lg:grid-cols-1 gap-2.5 sm:gap-3">
                    {upcomingSideCards.map((item) => (
                      <article
                        key={item.id}
                        className="group relative aspect-[4/3] lg:aspect-[16/9] rounded-2xl overflow-hidden border border-white/15 bg-zinc-900"
                      >
                        <Link
                          to={getMediaDetailRoute(item)}
                          aria-label={`View details for ${item.title}`}
                          className="block w-full h-full"
                        >
                          {item.backdropPath || item.posterPath ? (
                            <img
                              src={item.backdropPath || item.posterPath || ''}
                              alt={item.title}
                              loading="lazy"
                              decoding="async"
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover transition-transform duration-500 md:group-hover:scale-[1.05]"
                            />
                          ) : null}
                        </Link>
                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
                        <div className="absolute inset-x-0 bottom-0 p-2.5 sm:p-3 flex items-end justify-between gap-2">
                          <div className="min-w-0">
                            <Link
                              to={getMediaDetailRoute(item)}
                              className="block font-display text-xs sm:text-sm font-bold text-white line-clamp-1 hover:text-[#E50914] transition-colors"
                            >
                              {item.title}
                            </Link>
                            <span className="text-[11px] text-white/65 font-mono-tabular">
                              {item.releaseYear || 'Coming Soon'}
                            </span>
                          </div>
                          <Link
                            to={getMediaWatchRoute(item)}
                            aria-label={`Play ${item.title}`}
                            className="w-8 h-8 rounded-full bg-white/90 hover:bg-white text-[#171717] flex items-center justify-center shrink-0 shadow-md transition-transform md:group-hover:scale-105"
                          >
                            <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                          </Link>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              )}

              {/* Continue Watching (or Quick Picks if no resume checkpoints yet) */}
              {(activeContinueWatching.length > 0 || quickPicksFallback.length > 0) && (
              <section className="glass-white rounded-2xl sm:rounded-3xl p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="font-display text-base font-bold text-white">
                    {activeContinueWatching.length > 0 ? 'Continue Watching' : 'Quick Picks'}
                  </h2>
                  <Link
                    to={activeContinueWatching.length > 0 ? '/continue-watching' : '/tv'}
                    className="text-xs font-medium text-white/65 hover:text-white transition-colors"
                  >
                    See all
                  </Link>
                </div>

                {activeContinueWatching.length > 0 ? (
                  <div className="space-y-2.5">
                    {activeContinueWatching.map((item) => {
                      const watchQuery =
                        item.mediaType === 'tv' && item.season && item.episode
                          ? `?s=${item.season}&e=${item.episode}`
                          : item.mediaType === 'anime' && item.episode
                            ? `?e=${item.episode}&audio=${item.subOrDub || 'sub'}`
                            : '';
                      return (
                        <Link
                          key={item.mediaId}
                          to={getStoredMediaWatchRoute(item, watchQuery)}
                          className="group flex items-center gap-3 p-2 rounded-2xl hover:bg-white/10 transition-colors"
                        >
                          <div className="w-12 h-12 rounded-xl overflow-hidden bg-zinc-900 shrink-0 border border-white/15">
                            {item.backdropPath || item.posterPath ? (
                              <img
                                src={item.posterPath || item.backdropPath}
                                alt={item.title}
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover"
                              />
                            ) : null}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-display text-xs sm:text-sm font-semibold text-white line-clamp-1 group-hover:text-[#E50914] transition-colors">
                              {item.title}
                            </p>
                            <p className="text-[11px] text-white/60 font-mono-tabular mt-0.5">
                              {item.mediaType === 'tv' && item.season && item.episode
                                ? `Season ${item.season} Ep ${item.episode}`
                                : formatPlaybackTime(item.currentTime)}{' '}
                              · {item.progressPercent.toFixed(0)}%
                            </p>
                          </div>
                          <span className="w-8 h-8 rounded-full glass-control group-hover:bg-white group-hover:text-[#171717] flex items-center justify-center shrink-0 transition-colors">
                            <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {quickPicksFallback.map((item) => (
                      <Link
                        key={item.id}
                        to={getMediaWatchRoute(item)}
                        className="group flex items-center gap-3 p-2 rounded-2xl hover:bg-white/10 transition-colors"
                      >
                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-zinc-900 shrink-0 border border-white/15">
                          {item.posterPath || item.backdropPath ? (
                            <img
                              src={item.posterPath || item.backdropPath || ''}
                              alt={item.title}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                            />
                          ) : null}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-display text-xs sm:text-sm font-semibold text-white line-clamp-1 group-hover:text-[#E50914] transition-colors">
                            {item.title}
                          </p>
                          <p className="text-[11px] text-white/60 mt-0.5">
                            {item.releaseYear || 'TBA'} ·{' '}
                            {item.mediaType === 'tv'
                              ? 'TV Series'
                              : item.mediaType === 'anime'
                                ? 'Anime'
                                : 'Movie'}
                          </p>
                        </div>
                        <span className="w-8 h-8 rounded-full glass-control group-hover:bg-white group-hover:text-[#171717] flex items-center justify-center shrink-0 transition-colors">
                          <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
              </section>
              )}
            </aside>
            )}
          </div>

          {/* Horizontal Spatial Glass Carousels */}
          {data && (
            <div className="space-y-9">
              {adminMediaSummaries.length > 0 && (
                <MediaCarousel
                  title="Featured & Recently Published"
                  items={adminMediaSummaries}
                />
              )}
              <MediaCarousel
                title="Trending Movies"
                items={[...adminMovies, ...data.trendingMovies]}
                viewAllTo="/movies?category=trending"
              />
              <MediaCarousel
                title="Popular TV Shows"
                items={[...adminTv, ...data.popularTv]}
                viewAllTo="/tv?category=popular"
              />
              <MediaCarousel
                title="Trending Anime"
                items={[...adminAnime, ...data.trendingAnime]}
                viewAllTo="/anime?category=trending"
              />
              <MediaCarousel
                title="Top Rated Movies"
                items={data.topRatedMovies}
                viewAllTo="/movies?category=top_rated"
              />
              <MediaCarousel
                title="Popular Movies"
                items={[...adminMovies, ...data.popularMovies]}
                viewAllTo="/movies?category=popular"
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
