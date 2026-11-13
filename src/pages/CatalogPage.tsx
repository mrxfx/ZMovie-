import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, SlidersHorizontal } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import {
  fetchAnimeCatalog,
  fetchGenres,
  fetchMoviesList,
  fetchTvList,
} from '../services/catalogApi';
import type { GenreItem, MediaSummary, MediaType, PagedCatalogResponse } from '../types/media';
import { MediaCard } from '../components/MediaCard';
import {
  CatalogNoticeBanner,
  EmptyState,
  ErrorState,
  GridSkeleton,
} from '../components/StateBlocks';
import { useSeoMetadata } from '../utils/seo';

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
  ],
};

const YEARS = ['2026', '2025', '2024', '2023', '2022', '2021', '2020', '2019', '2015', '2010'];

export function CatalogPage({ mediaType }: { mediaType: MediaType }) {
  const [searchParams, setSearchParams] = useSearchParams();

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

  const categories = CATEGORY_OPTIONS[mediaType];
  const items: MediaSummary[] = response?.items || [];

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#EEEEEE] dark:border-zinc-800 pb-6">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-[#171717] dark:text-white">
            {pageTitle}
          </h1>
          <p className="text-sm text-[#737373] dark:text-zinc-400 mt-1">
            {mediaType === 'anime'
              ? 'Curated anime catalog powered by MyAnimeList / Jikan metadata.'
              : `Explore ${pageTitle.toLowerCase()} with genre, year, rating, and sorting controls.`}
          </p>
        </div>

        {/* Category Filter Tabs */}
        <div
          role="tablist"
          aria-label={`${pageTitle} categories`}
          className="flex flex-wrap items-center gap-1.5 bg-[#F7F7F8] dark:bg-zinc-900 p-1 rounded-xl border border-[#EEEEEE] dark:border-zinc-800"
        >
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              role="tab"
              aria-selected={category === cat.id}
              onClick={() => {
                setCategory(cat.id);
                setPage(1);
              }}
              className={`px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-colors ${
                category === cat.id
                  ? 'bg-[#E50914] text-white'
                  : 'text-[#737373] dark:text-zinc-400 hover:text-[#171717] dark:hover:text-white'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Discovery Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 bg-[#F7F7F8] dark:bg-zinc-900/70 border border-[#EEEEEE] dark:border-zinc-800 rounded-xl p-3.5">
        <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#171717] dark:text-zinc-200 mr-1">
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
          className="px-3 py-2 rounded-lg bg-white dark:bg-zinc-900 border border-[#EEEEEE] dark:border-zinc-700 text-xs sm:text-sm text-[#171717] dark:text-zinc-100"
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
          className="px-3 py-2 rounded-lg bg-white dark:bg-zinc-900 border border-[#EEEEEE] dark:border-zinc-700 text-xs sm:text-sm text-[#171717] dark:text-zinc-100"
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
              className="px-3 py-2 rounded-lg bg-white dark:bg-zinc-900 border border-[#EEEEEE] dark:border-zinc-700 text-xs sm:text-sm text-[#171717] dark:text-zinc-100"
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
          className="px-3 py-2 rounded-lg bg-white dark:bg-zinc-900 border border-[#EEEEEE] dark:border-zinc-700 text-xs sm:text-sm text-[#171717] dark:text-zinc-100"
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
          className="px-3 py-2 rounded-lg bg-white dark:bg-zinc-900 border border-[#EEEEEE] dark:border-zinc-700 text-xs sm:text-sm text-[#171717] dark:text-zinc-100"
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
          className="ml-auto text-xs font-semibold text-[#E50914] hover:text-[#B20710] px-2 py-1.5"
        >
          Reset
        </button>
      </div>

      {response?.notice && <CatalogNoticeBanner notice={response.notice} />}

      {loading ? (
        <GridSkeleton count={10} />
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
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
            {items.map((item) => (
              <MediaCard key={item.id} media={item} />
            ))}
          </div>

          {/* Pagination */}
          {response && response.totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-6">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-[#EEEEEE] dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm font-medium disabled:opacity-40 hover:border-[#E50914] transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>
              <span className="text-sm font-mono-tabular text-[#737373] dark:text-zinc-400">
                Page {response.page} of {response.totalPages}
              </span>
              <button
                type="button"
                disabled={page >= response.totalPages}
                onClick={() => setPage((p) => Math.min(response.totalPages, p + 1))}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-[#EEEEEE] dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm font-medium disabled:opacity-40 hover:border-[#E50914] transition-colors"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
