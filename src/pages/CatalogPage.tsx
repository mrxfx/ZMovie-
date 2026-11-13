import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Shuffle, SlidersHorizontal } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  fetchAnimeCatalog,
  fetchGenres,
  fetchMoviesList,
  fetchRandomAnime,
  fetchTvList,
} from '../services/catalogApi';
import type { GenreItem, MediaSummary, MediaType, PagedCatalogResponse } from '../types/media';
import { GlassButton, GlassMovieCard, GlassPanel } from '../components/glass';
import { useAdminCatalog } from '../context/AdminCatalogContext';
import { filterCatalogMedia } from '../utils/mediaFilters';
import { getMediaDetailRoute } from '../utils/mediaRoutes';
import {
  CatalogNoticeBanner,
  EmptyState,
  ErrorState,
  GridSkeleton,
} from '../components/StateBlocks';
import { useSeoMetadata } from '../utils/seo';
import { GLASS_SPRING } from '../styles/glassTokens';

const CATEGORY_OPTIONS: Record<MediaType, { id: string; label: string }[]> = {
  movie: [
    { id: 'trending', label: 'Trending' },
    { id: 'popular', label: 'Popular' },
    { id: 'top_rated', label: 'Top Rated' },
    { id: 'now_playing', label: 'Now Playing' },
    { id: 'upcoming', label: 'Upcoming' },
  ],
  tv: [
    { id: 'trending', label: 'Trending' },
    { id: 'popular', label: 'Popular' },
    { id: 'top_rated', label: 'Top Rated' },
    { id: 'airing_today', label: 'Airing Today' },
    { id: 'on_the_air', label: 'On The Air' },
  ],
  anime: [
    { id: 'trending', label: 'Trending Airing' },
    { id: 'popular', label: 'Most Popular' },
    { id: 'top_rated', label: 'Top Rated' },
    { id: 'seasons_now', label: 'Seasonal Now' },
    { id: 'upcoming', label: 'Upcoming' },
    { id: 'top_movies', label: 'Anime Movies' },
    { id: 'schedules', label: 'Schedule' },
  ],
};

const YEARS = ['2026', '2025', '2024', '2023', '2022', '2021', '2020', '2019', '2015', '2010'];

export function CatalogPage({ mediaType }: { mediaType: MediaType }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [pickingRandom, setPickingRandom] = useState(false);

  const pageTitle =
    mediaType === 'movie' ? 'Movies' : mediaType === 'tv' ? 'TV Shows' : 'Anime';
  useSeoMetadata({
    title: `${pageTitle} – ZyvoMovie`,
    description: `Browse ${pageTitle.toLowerCase()} by genre, release year, language, and rating on ZyvoMovie.`,
    path: mediaType === 'movie' ? '/movies' : mediaType === 'tv' ? '/tv' : '/anime',
  });

  const initialCategory = searchParams.get('category') || 'popular';
  const [category, setCategory] = useState(initialCategory);
  const [genreId, setGenreId] = useState('all');
  const [year, setYear] = useState('all');
  const [language, setLanguage] = useState('all');
  const [minRating, setMinRating] = useState('');
  const [sortBy, setSortBy] = useState('popularity.desc');
  const [page, setPage] = useState(1);

  const [genres, setGenres] = useState<GenreItem[]>([]);
  const [response, setResponse] = useState<PagedCatalogResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setCategory(searchParams.get('category') || 'popular');
    setGenreId('all');
    setYear('all');
    setLanguage('all');
    setMinRating('');
    setPage(1);
  }, [mediaType, searchParams]);

  useEffect(() => {
    let active = true;
    void fetchGenres(mediaType)
      .then((res) => {
        if (active) setGenres(res.genres || []);
      })
      .catch(() => {
        if (active) setGenres([]);
      });
    return () => {
      active = false;
    };
  }, [mediaType]);

  const loadCatalog = async () => {
    setLoading(true);
    setError(null);
    try {
      const filters = {
        genreId,
        year,
        language,
        minRating,
        sortBy,
        page,
      };
      const res =
        mediaType === 'movie'
          ? await fetchMoviesList(category, filters)
          : mediaType === 'tv'
            ? await fetchTvList(category, filters)
            : await fetchAnimeCatalog(category, filters);
      setResponse(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to load ${pageTitle}.`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadCatalog();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mediaType, category, genreId, year, language, minRating, sortBy, page]);

  const { adminMediaSummaries } = useAdminCatalog();
  const categories = CATEGORY_OPTIONS[mediaType];
  const selectedGenreName =
    genreId === 'all' ? 'all' : genres.find((g) => String(g.id) === genreId)?.name || genreId;
  const matchingAdminItems =
    page === 1
      ? filterCatalogMedia(
          adminMediaSummaries.filter((m) => m.mediaType === mediaType),
          {
            genre: selectedGenreName,
            year,
            language: mediaType === 'anime' ? 'all' : language,
            minRating: minRating ? Number(minRating) : undefined,
            sortBy:
              sortBy === 'vote_average.desc'
                ? 'rating'
                : sortBy.includes('date') || sortBy === 'newest'
                  ? 'newest'
                  : 'popularity',
          }
        )
      : [];
  const items: MediaSummary[] = [...matchingAdminItems, ...(response?.items || [])];

  const resetFilters = () => {
    setCategory('popular');
    setGenreId('all');
    setYear('all');
    setLanguage('all');
    setMinRating('');
    setSortBy('popularity.desc');
    setPage(1);
    setSearchParams({});
  };

  return (
    <div className="w-full pt-2 space-y-6">
      <GlassPanel variant="default" padding="md" className="rounded-3xl">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
                {pageTitle}
              </h1>
              {mediaType === 'anime' && (
                <GlassButton
                  variant="glass"
                  size="sm"
                  disabled={pickingRandom}
                  onClick={() => {
                    setPickingRandom(true);
                    void fetchRandomAnime()
                      .then((res) => {
                        if (res.item) {
                          navigate(getMediaDetailRoute(res.item));
                        }
                      })
                      .finally(() => setPickingRandom(false));
                  }}
                  className="min-h-[44px] sm:min-h-[36px]"
                >
                  <Shuffle className="w-3.5 h-3.5 text-[#E50914]" />
                  {pickingRandom ? 'Rolling...' : 'Random Anime'}
                </GlassButton>
              )}
            </div>
            <p className="text-sm text-white/70 mt-1">
              {mediaType === 'anime'
                ? 'Curated anime catalog powered by Jikan v4 / MyAnimeList metadata.'
                : `Explore ${pageTitle.toLowerCase()} with genre, year, rating, and sorting controls.`}
            </p>
          </div>

          {/* Animated Glass Category Tabs */}
          <div
            role="tablist"
            aria-label={`${pageTitle} categories`}
            className="flex overflow-x-auto no-scrollbar max-w-full sm:flex-wrap items-center gap-1 p-1 rounded-full bg-white/10 border border-white/15"
          >
            {categories.map((cat) => {
              const active = category === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => {
                    setCategory(cat.id);
                    setPage(1);
                  }}
                  className={`relative px-3.5 py-2 min-h-[44px] sm:min-h-[38px] rounded-full text-xs sm:text-sm font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer inline-flex items-center justify-center ${
                    active
                      ? 'text-white font-semibold'
                      : 'text-white/70 hover:text-white'
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId={`catalog-active-tab-${mediaType}`}
                      transition={GLASS_SPRING}
                      className="absolute inset-0 rounded-full bg-[#E50914] shadow-[0_6px_16px_-4px_rgba(229,9,20,0.45)] -z-10"
                    />
                  )}
                  <span className="relative z-10">{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </GlassPanel>

      {/* Glass Discovery Filter Bar */}
      <GlassPanel variant="subtle" padding="sm" className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 sm:gap-2.5">
        <div className="col-span-2 sm:col-span-1 inline-flex items-center gap-2 text-xs font-semibold text-white px-1 pb-0.5 sm:pb-0 sm:mr-1">
          <SlidersHorizontal className="w-4 h-4 text-[#E50914]" />
          <span>Filters</span>
        </div>

        <label className="sr-only" htmlFor="filter-genre">
          Genre
        </label>
        <select
          id="filter-genre"
          value={genreId}
          onChange={(e) => {
            setGenreId(e.target.value);
            setPage(1);
          }}
          className="w-full sm:w-auto min-h-[44px] sm:min-h-[38px] px-3.5 py-2 rounded-full glass-control text-xs sm:text-sm text-white focus:outline-none focus:border-white/45"
        >
          <option value="all">All Genres</option>
          {genres.map((g) => (
            <option key={g.id} value={String(g.id)}>
              {g.name}
            </option>
          ))}
        </select>

        <label className="sr-only" htmlFor="filter-year">
          Release Year
        </label>
        <select
          id="filter-year"
          value={year}
          onChange={(e) => {
            setYear(e.target.value);
            setPage(1);
          }}
          className="w-full sm:w-auto min-h-[44px] sm:min-h-[38px] px-3.5 py-2 rounded-full glass-control text-xs sm:text-sm text-white focus:outline-none focus:border-white/45"
        >
          <option value="all">All Years</option>
          {YEARS.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>

        {mediaType !== 'anime' && (
          <>
            <label className="sr-only" htmlFor="filter-language">
              Language
            </label>
            <select
              id="filter-language"
              value={language}
              onChange={(e) => {
                setLanguage(e.target.value);
                setPage(1);
              }}
              className="w-full sm:w-auto min-h-[44px] sm:min-h-[38px] px-3.5 py-2 rounded-full glass-control text-xs sm:text-sm text-white focus:outline-none focus:border-white/45"
            >
              <option value="all">All Languages</option>
              <option value="en">English</option>
              <option value="ja">Japanese</option>
              <option value="ko">Korean</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="hi">Hindi</option>
            </select>
          </>
        )}

        <label className="sr-only" htmlFor="filter-rating">
          Minimum Rating
        </label>
        <select
          id="filter-rating"
          value={minRating}
          onChange={(e) => {
            setMinRating(e.target.value);
            setPage(1);
          }}
          className="w-full sm:w-auto min-h-[44px] sm:min-h-[38px] px-3.5 py-2 rounded-full glass-control text-xs sm:text-sm text-white focus:outline-none focus:border-white/45"
        >
          <option value="">Any Rating</option>
          <option value="6">6.0+ Rating</option>
          <option value="7">7.0+ Rating</option>
          <option value="8">8.0+ Rating</option>
        </select>

        <label className="sr-only" htmlFor="filter-sort">
          Sort By
        </label>
        <select
          id="filter-sort"
          value={sortBy}
          onChange={(e) => {
            setSortBy(e.target.value);
            setPage(1);
          }}
          className="w-full sm:w-auto min-h-[44px] sm:min-h-[38px] px-3.5 py-2 rounded-full glass-control text-xs sm:text-sm text-white focus:outline-none focus:border-white/45"
        >
          <option value="popularity.desc">Most Popular</option>
          <option value="vote_average.desc">Highest Rated</option>
          <option
            value={
              mediaType === 'movie'
                ? 'primary_release_date.desc'
                : mediaType === 'tv'
                  ? 'first_air_date.desc'
                  : 'newest'
            }
          >
            Newest Releases
          </option>
        </select>

        <button
          type="button"
          onClick={resetFilters}
          className="w-full sm:w-auto sm:ml-auto min-h-[44px] sm:min-h-[38px] text-xs font-semibold text-white/85 hover:text-white px-3 py-1.5 rounded-full bg-white/[0.06] sm:bg-transparent hover:bg-white/15 transition-colors cursor-pointer"
        >
          Reset
        </button>
      </GlassPanel>

      {response?.notice && <CatalogNoticeBanner notice={response.notice} />}

      {loading ? (
        <GridSkeleton count={14} />
      ) : error ? (
        <ErrorState message={error} onRetry={() => void loadCatalog()} />
      ) : items.length === 0 ? (
        <EmptyState
          title={`No ${pageTitle} matched your filters`}
          description="Try broadening your genre, release year, or rating threshold to view more titles."
          actionLabel="Reset Filters"
          onAction={resetFilters}
        />
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-3 sm:gap-5">
            {items.map((item) => (
              <GlassMovieCard key={item.id} media={item} />
            ))}
          </div>

          {/* Glass Pagination */}
          {response && response.totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-4">
              <GlassButton
                variant="glass"
                size="md"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </GlassButton>
              <GlassPanel variant="subtle" padding="none" className="px-4 py-2 rounded-full text-xs sm:text-sm font-mono-tabular text-white/80">
                Page {response.page} of {response.totalPages}
              </GlassPanel>
              <GlassButton
                variant="glass"
                size="md"
                disabled={page >= response.totalPages}
                onClick={() => setPage((p) => Math.min(response.totalPages, p + 1))}
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </GlassButton>
            </div>
          )}
        </>
      )}
    </div>
  );
}
