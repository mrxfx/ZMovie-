import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Clock, Search, Trash2, X } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { searchCatalog } from '../services/catalogApi';
import type { MediaType, PagedCatalogResponse } from '../types/media';
import { useLibrary } from '../context/LibraryContext';
import { MediaCard } from '../components/MediaCard';
import {
  CatalogNoticeBanner,
  EmptyState,
  ErrorState,
  GridSkeleton,
} from '../components/StateBlocks';
import { useSeoMetadata } from '../utils/seo';

const QUICK_SUGGESTIONS = ['Orbital', 'Chronicle', 'Inception', 'Breaking', 'Attack on Titan'];

export function SearchPage() {
  useSeoMetadata({
    title: 'Search Movies, TV Shows & Anime – ZyvoMovie',
    description: 'Search across movies, TV series, and anime with instant suggestions and filters.',
    path: '/search',
  });

  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const initialType = (searchParams.get('type') as 'all' | MediaType) || 'all';

  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  const [mediaType, setMediaType] = useState<'all' | MediaType>(initialType);
  const [page, setPage] = useState(1);

  const [results, setResults] = useState<PagedCatalogResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { searchHistory, addSearchQuery, clearSearchHistory } = useLibrary();

  useEffect(() => {
    const paramQ = searchParams.get('q') || '';
    if (paramQ !== query) {
      setQuery(paramQ);
      setDebouncedQuery(paramQ);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Debounce input
  useEffect(() => {
    const timer = setTimeout(() => {
      const trimmed = query.trim();
      setDebouncedQuery(trimmed);
      setPage(1);
      if (trimmed) {
        setSearchParams({ q: trimmed, type: mediaType }, { replace: true });
      }
    }, 350);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, mediaType]);

  useEffect(() => {
    if (!debouncedQuery) {
      setResults(null);
      setError(null);
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);
    setError(null);

    void searchCatalog(debouncedQuery, mediaType, page)
      .then((res) => {
        if (!active) return;
        setResults(res);
        addSearchQuery(debouncedQuery);
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Search failed.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery, mediaType, page]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    setDebouncedQuery(trimmed);
    setPage(1);
    if (trimmed) {
      addSearchQuery(trimmed);
      setSearchParams({ q: trimmed, type: mediaType });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 space-y-6">
      <div className="space-y-4">
        <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight">
          Search ZyvoMovie
        </h1>

        <form onSubmit={handleSubmit} role="search" className="relative max-w-3xl">
          <label htmlFor="global-search-input" className="sr-only">
            Search movies, TV shows, and anime
          </label>
          <Search className="w-5 h-5 text-[#737373] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            id="global-search-input"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search movies, TV series, or anime titles..."
            className="w-full pl-12 pr-24 py-3.5 rounded-xl bg-[#F7F7F8] dark:bg-zinc-900 border border-[#EEEEEE] dark:border-zinc-800 text-base focus:outline-none focus:border-[#E50914]"
          />
          {query && (
            <button
              type="button"
              aria-label="Clear search query"
              onClick={() => {
                setQuery('');
                setDebouncedQuery('');
                setSearchParams({});
              }}
              className="absolute right-20 top-1/2 -translate-y-1/2 p-2 text-[#737373] hover:text-[#171717] dark:hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 rounded-lg bg-[#E50914] hover:bg-[#B20710] text-white text-sm font-semibold transition-colors"
          >
            Search
          </button>
        </form>

        {/* Media Type Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          {(['all', 'movie', 'tv', 'anime'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => {
                setMediaType(t);
                setPage(1);
              }}
              className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                mediaType === t
                  ? 'bg-[#E50914] text-white'
                  : 'bg-[#F7F7F8] dark:bg-zinc-900 text-[#737373] dark:text-zinc-400 border border-[#EEEEEE] dark:border-zinc-800 hover:text-[#171717] dark:hover:text-white'
              }`}
            >
              {t === 'all'
                ? 'All Titles'
                : t === 'movie'
                  ? 'Movies'
                  : t === 'tv'
                    ? 'TV Shows'
                    : 'Anime'}
            </button>
          ))}
        </div>
      </div>

      {/* Search History & Suggestions when input is empty */}
      {!debouncedQuery && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          <section className="p-6 rounded-2xl bg-[#F7F7F8] dark:bg-zinc-900 border border-[#EEEEEE] dark:border-zinc-800 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-base font-bold flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#E50914]" />
                Recent Searches
              </h2>
              {searchHistory.length > 0 && (
                <button
                  type="button"
                  onClick={clearSearchHistory}
                  className="inline-flex items-center gap-1 text-xs font-medium text-[#737373] hover:text-[#E50914]"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Clear History
                </button>
              )}
            </div>

            {searchHistory.length === 0 ? (
              <p className="text-sm text-[#737373] dark:text-zinc-400">
                Your recent search queries will appear here.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {searchHistory.map((entry) => (
                  <button
                    key={entry.query}
                    type="button"
                    onClick={() => setQuery(entry.query)}
                    className="px-3.5 py-2 rounded-lg bg-white dark:bg-zinc-800 border border-[#EEEEEE] dark:border-zinc-700 text-sm hover:border-[#E50914] transition-colors"
                  >
                    {entry.query}
                  </button>
                ))}
              </div>
            )}
          </section>

          <section className="p-6 rounded-2xl bg-[#F7F7F8] dark:bg-zinc-900 border border-[#EEEEEE] dark:border-zinc-800 space-y-4">
            <h2 className="font-display text-base font-bold">Quick Suggestions</h2>
            <div className="flex flex-wrap gap-2">
              {QUICK_SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setQuery(s)}
                  className="px-3.5 py-2 rounded-lg bg-white dark:bg-zinc-800 border border-[#EEEEEE] dark:border-zinc-700 text-sm hover:border-[#E50914] transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </section>
        </div>
      )}

      {results?.notice && <CatalogNoticeBanner notice={results.notice} />}

      {loading ? (
        <GridSkeleton count={10} />
      ) : error ? (
        <ErrorState message={error} onRetry={() => setDebouncedQuery(query.trim())} />
      ) : debouncedQuery && results ? (
        results.items.length === 0 ? (
          <EmptyState
            title={`No results for "${debouncedQuery}"`}
            description="Check your spelling or switch between Movies, TV Shows, and Anime filters."
            actionLabel="Clear Search"
            onAction={() => {
              setQuery('');
              setDebouncedQuery('');
              setSearchParams({});
            }}
          />
        ) : (
          <div className="space-y-6">
            <p className="text-sm text-[#737373] dark:text-zinc-400 font-mono-tabular">
              Showing {results.items.length} results for &ldquo;{debouncedQuery}&rdquo;
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
              {results.items.map((item) => (
                <MediaCard key={item.id} media={item} />
              ))}
            </div>

            {results.totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 pt-4">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-[#EEEEEE] dark:border-zinc-800 text-sm font-medium disabled:opacity-40"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </button>
                <span className="text-sm font-mono-tabular text-[#737373]">
                  Page {results.page} of {results.totalPages}
                </span>
                <button
                  type="button"
                  disabled={page >= results.totalPages}
                  onClick={() => setPage((p) => Math.min(results.totalPages, p + 1))}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-[#EEEEEE] dark:border-zinc-800 text-sm font-medium disabled:opacity-40"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )
      ) : null}
    </div>
  );
}
