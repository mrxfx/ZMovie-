import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Clock, Sparkles, Trash2 } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { searchCatalog } from '../services/catalogApi';
import type { MediaType, PagedCatalogResponse } from '../types/media';
import { useLibrary } from '../context/LibraryContext';
import { useAdminCatalog } from '../context/AdminCatalogContext';
import { GlassButton, GlassMovieCard, GlassPanel, GlassSearch } from '../components/glass';
import {
  CatalogNoticeBanner,
  EmptyState,
  ErrorState,
  GridSkeleton,
} from '../components/StateBlocks';
import { useSeoMetadata } from '../utils/seo';
import { GLASS_SPRING } from '../styles/glassTokens';

const QUICK_SUGGESTIONS = ['Inception', 'Interstellar', 'Breaking Bad', 'Attack on Titan', 'Spirited Away'];

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
  const { adminMediaSummaries } = useAdminCatalog();

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
    <div className="w-full pt-2 space-y-6">
      <GlassPanel variant="default" padding="lg" className="rounded-3xl space-y-5">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            Search ZyvoMovie
          </h1>
          <p className="text-sm text-white/70 mt-1">
            Find movies, television series, and anime instantly across the Zyvo ecosystem.
          </p>
        </div>

        <GlassSearch
          value={query}
          onChange={setQuery}
          onSubmit={handleSubmit}
          onClear={() => {
            setQuery('');
            setDebouncedQuery('');
            setSearchParams({});
          }}
          recentSearches={searchHistory.map((h) => h.query)}
          quickSuggestions={QUICK_SUGGESTIONS}
          onSelectSuggestion={(term) => {
            setQuery(term);
            setDebouncedQuery(term);
          }}
          className="max-w-4xl"
        />

        {/* Animated Media Type Filter Tabs */}
        <div className="inline-flex flex-wrap items-center gap-1 p-1 rounded-full bg-white/10 border border-white/15">
          {(['all', 'movie', 'tv', 'anime'] as const).map((t) => {
            const active = mediaType === t;
            return (
              <button
                key={t}
                type="button"
                onClick={() => {
                  setMediaType(t);
                  setPage(1);
                }}
                className={`relative px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-colors cursor-pointer ${
                  active
                    ? 'text-white font-semibold'
                    : 'text-white/70 hover:text-white'
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="search-type-active"
                    transition={GLASS_SPRING}
                    className="absolute inset-0 rounded-full bg-[#E50914] shadow-[0_6px_16px_-4px_rgba(229,9,20,0.45)] -z-10"
                  />
                )}
                <span className="relative z-10">
                  {t === 'all'
                    ? 'All Titles'
                    : t === 'movie'
                      ? 'Movies'
                      : t === 'tv'
                        ? 'TV Shows'
                        : 'Anime'}
                </span>
              </button>
            );
          })}
        </div>
      </GlassPanel>

      {/* Search History & Suggestions when input is empty */}
      {!debouncedQuery && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <GlassPanel variant="subtle" padding="md" className="rounded-3xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-base font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#E50914]" />
                Recent Searches
              </h2>
              {searchHistory.length > 0 && (
                <button
                  type="button"
                  onClick={clearSearchHistory}
                  className="inline-flex items-center gap-1 text-xs font-medium text-white/65 hover:text-[#E50914] cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Clear History
                </button>
              )}
            </div>

            {searchHistory.length === 0 ? (
              <p className="text-sm text-white/65">
                Your recent search queries will appear here.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {searchHistory.map((entry) => (
                  <button
                    key={entry.query}
                    type="button"
                    onClick={() => setQuery(entry.query)}
                    className="px-3.5 py-2 rounded-full glass-control text-sm text-white/90 hover:bg-white/20 transition-colors cursor-pointer"
                  >
                    {entry.query}
                  </button>
                ))}
              </div>
            )}
          </GlassPanel>

          <GlassPanel variant="subtle" padding="md" className="rounded-3xl space-y-4">
            <h2 className="font-display text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#E50914]" />
              Quick Suggestions
            </h2>
            <div className="flex flex-wrap gap-2">
              {QUICK_SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setQuery(s)}
                  className="px-3.5 py-2 rounded-full glass-control text-sm text-white/90 hover:bg-white/20 transition-colors cursor-pointer"
                >
                  {s}
                </button>
              ))}
            </div>
          </GlassPanel>
        </div>
      )}

      {results?.notice && <CatalogNoticeBanner notice={results.notice} />}

      {loading ? (
        <GridSkeleton count={14} />
      ) : error ? (
        <ErrorState message={error} onRetry={() => setDebouncedQuery(query.trim())} />
      ) : debouncedQuery && results ? (
        (() => {
          const qLower = debouncedQuery.toLowerCase();
          const adminMatches =
            page === 1
              ? adminMediaSummaries.filter((item) => {
                  if (mediaType !== 'all' && item.mediaType !== mediaType) return false;
                  return (
                    item.title.toLowerCase().includes(qLower) ||
                    item.overview.toLowerCase().includes(qLower) ||
                    item.genres.some((g) => g.toLowerCase().includes(qLower))
                  );
                })
              : [];
          const mergedItems = [...adminMatches, ...results.items];
          if (mergedItems.length === 0) {
            return (
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
            );
          }
          return (
            <div className="space-y-6">
              <p className="text-sm text-white/70 font-mono-tabular">
                Showing {mergedItems.length} results for &ldquo;{debouncedQuery}&rdquo;
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-4 sm:gap-5">
                {mergedItems.map((item) => (
                  <GlassMovieCard key={item.id} media={item} />
                ))}
              </div>
              {results.totalPages > 1 && (
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
                  <GlassPanel variant="subtle" padding="none" className="px-4 py-2 rounded-full text-sm font-mono-tabular text-white/80">
                    Page {results.page} of {results.totalPages}
                  </GlassPanel>
                  <GlassButton
                    variant="glass"
                    size="md"
                    disabled={page >= results.totalPages}
                    onClick={() => setPage((p) => Math.min(results.totalPages, p + 1))}
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </GlassButton>
                </div>
              )}
            </div>
          );
        })()
      ) : null}
    </div>
  );
}
