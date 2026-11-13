import { useState } from 'react';
import { Cloud, HardDrive, Search, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { useLibrary } from '../context/LibraryContext';
import type { MediaSummary, MediaType } from '../types/media';
import { filterWatchlistItems } from '../utils/mediaFilters';
import { GlassButton, GlassMovieCard, GlassPanel } from '../components/glass';
import { EmptyState } from '../components/StateBlocks';
import { useSeoMetadata } from '../utils/seo';
import { GLASS_SPRING } from '../styles/glassTokens';

export function MyListPage() {
  useSeoMetadata({
    title: 'My List – ZyvoMovie',
    description: 'Manage your saved movies, TV shows, and anime watchlist on ZyvoMovie.',
    path: '/my-list',
  });

  const { watchlist, removeFromWatchlist, syncStatus } = useLibrary();
  const [mediaType, setMediaType] = useState<'all' | MediaType>('all');
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState<'added_desc' | 'title_asc' | 'rating_desc' | 'year_desc'>(
    'added_desc'
  );

  const filtered = filterWatchlistItems(watchlist, { mediaType, query, sortBy });

  return (
    <div className="w-full pt-2 space-y-6">
      <GlassPanel variant="default" padding="md" className="rounded-3xl">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              My List
            </h1>
            <p className="text-sm text-white/70 mt-1 flex items-center gap-2">
              {syncStatus === 'cloud-synced' ? (
                <>
                  <Cloud className="w-4 h-4 text-[#E50914]" />
                  <span>Synced with your Firebase account</span>
                </>
              ) : (
                <>
                  <HardDrive className="w-4 h-4 text-white/60" />
                  <span>
                    Saved locally in your browser ·{' '}
                    <Link to="/login" className="text-[#E50914] font-medium hover:underline">
                      Sign in to sync across devices
                    </Link>
                  </span>
                </>
              )}
            </p>
          </div>

          <span className="px-3.5 py-1.5 rounded-full glass-control text-xs sm:text-sm font-mono-tabular text-white/80 self-start sm:self-auto">
            {watchlist.length} saved {watchlist.length === 1 ? 'title' : 'titles'}
          </span>
        </div>
      </GlassPanel>

      {/* Glass Filters & Search */}
      {watchlist.length > 0 && (
        <GlassPanel variant="subtle" padding="sm" className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2.5 sm:gap-3">
          <div className="grid grid-cols-4 sm:flex items-center gap-1 p-1 rounded-full bg-white/10 border border-white/15">
            {(['all', 'movie', 'tv', 'anime'] as const).map((t) => {
              const active = mediaType === t;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setMediaType(t)}
                  className={`relative px-2 sm:px-3.5 py-1.5 min-h-[44px] sm:min-h-[36px] rounded-full text-xs sm:text-sm font-medium transition-colors cursor-pointer inline-flex items-center justify-center whitespace-nowrap ${
                    active
                      ? 'text-white font-semibold'
                      : 'text-white/70 hover:text-white'
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="mylist-type-active"
                      transition={GLASS_SPRING}
                      className="absolute inset-0 rounded-full bg-[#E50914] shadow-sm -z-10"
                    />
                  )}
                  <span className="relative z-10">
                    {t === 'all' ? 'All' : t === 'movie' ? 'Movies' : t === 'tv' ? 'TV Shows' : 'Anime'}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 sm:flex-1 min-w-0">
            <div className="relative flex-1 min-w-0 sm:max-w-xs">
              <Search className="w-4 h-4 text-white/60 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                aria-label="Filter My List by title"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Filter saved titles..."
                className="w-full min-h-[44px] sm:min-h-[38px] pl-9 pr-3.5 py-2 rounded-full bg-white/10 border border-white/20 text-sm text-white placeholder:text-white/50 focus:outline-none focus:border-white/45"
              />
            </div>

            <select
              aria-label="Sort My List"
              value={sortBy}
              onChange={(e) =>
                setSortBy(e.target.value as 'added_desc' | 'title_asc' | 'rating_desc' | 'year_desc')
              }
              className="min-h-[44px] sm:min-h-[38px] px-3 py-2 rounded-full glass-control text-xs sm:text-sm text-white sm:ml-auto shrink-0 focus:outline-none focus:border-white/45"
            >
              <option value="added_desc">Recently Added</option>
              <option value="title_asc">Title (A–Z)</option>
              <option value="rating_desc">Highest Rated</option>
              <option value="year_desc">Release Year</option>
            </select>
          </div>
        </GlassPanel>
      )}

      {watchlist.length === 0 ? (
        <EmptyState
          title="Your My List is empty"
          description="Bookmark movies, TV series, or anime while browsing to keep them organized here."
          actionLabel="Browse Home"
          actionTo="/"
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No saved titles match your filter"
          description="Clear your search text or switch category tabs to view your saved titles."
          actionLabel="Clear Filters"
          onAction={() => {
            setMediaType('all');
            setQuery('');
          }}
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-3 sm:gap-5">
          {filtered.map((item) => {
            const summary: MediaSummary = {
              id: item.mediaId,
              mediaType: item.mediaType,
              tmdbId: item.tmdbId,
              malId: item.malId,
              title: item.title,
              overview: '',
              posterPath: item.posterPath || null,
              backdropPath: null,
              releaseYear: item.releaseYear,
              releaseDate: '',
              voteAverage: item.voteAverage,
              voteCount: 0,
              popularity: 0,
              originalLanguage: 'en',
              genreIds: [],
              genres: [],
              source: 'tmdb',
            };
            return (
              <div key={item.mediaId} className="space-y-2">
                <GlassMovieCard media={summary} />
                <GlassButton
                  variant="glass"
                  size="sm"
                  onClick={() => void removeFromWatchlist(item.mediaId)}
                  className="w-full text-white/80 hover:text-[#E50914]"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Remove
                </GlassButton>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
