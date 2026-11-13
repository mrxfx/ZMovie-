import { useState } from 'react';
import { Cloud, HardDrive, Search, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLibrary } from '../context/LibraryContext';
import type { MediaSummary, MediaType } from '../types/media';
import { filterWatchlistItems } from '../utils/mediaFilters';
import { MediaCard } from '../components/MediaCard';
import { EmptyState } from '../components/StateBlocks';
import { useSeoMetadata } from '../utils/seo';

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#EEEEEE] dark:border-zinc-800 pb-6">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight">
            My List
          </h1>
          <p className="text-sm text-[#737373] dark:text-zinc-400 mt-1 flex items-center gap-2">
            {syncStatus === 'cloud-synced' ? (
              <>
                <Cloud className="w-4 h-4 text-[#E50914]" />
                <span>Synced with your Firebase account</span>
              </>
            ) : (
              <>
                <HardDrive className="w-4 h-4 text-[#737373]" />
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

        <span className="text-sm font-mono-tabular text-[#737373] dark:text-zinc-400">
          {watchlist.length} saved {watchlist.length === 1 ? 'title' : 'titles'}
        </span>
      </div>

      {/* Filters & Search */}
      {watchlist.length > 0 && (
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 bg-[#F7F7F8] dark:bg-zinc-900 p-1 rounded-xl border border-[#EEEEEE] dark:border-zinc-800">
            {(['all', 'movie', 'tv', 'anime'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setMediaType(t)}
                className={`px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                  mediaType === t
                    ? 'bg-[#E50914] text-white'
                    : 'text-[#737373] dark:text-zinc-400 hover:text-[#171717] dark:hover:text-white'
                }`}
              >
                {t === 'all' ? 'All' : t === 'movie' ? 'Movies' : t === 'tv' ? 'TV Shows' : 'Anime'}
              </button>
            ))}
          </div>

          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="w-4 h-4 text-[#737373] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              aria-label="Filter My List by title"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter saved titles..."
              className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#F7F7F8] dark:bg-zinc-900 border border-[#EEEEEE] dark:border-zinc-800 text-sm focus:outline-none focus:border-[#E50914]"
            />
          </div>

          <select
            aria-label="Sort My List"
            value={sortBy}
            onChange={(e) =>
              setSortBy(e.target.value as 'added_desc' | 'title_asc' | 'rating_desc' | 'year_desc')
            }
            className="px-3.5 py-2 rounded-lg bg-[#F7F7F8] dark:bg-zinc-900 border border-[#EEEEEE] dark:border-zinc-800 text-sm ml-auto"
          >
            <option value="added_desc">Recently Added</option>
            <option value="title_asc">Title (A–Z)</option>
            <option value="rating_desc">Highest Rated</option>
            <option value="year_desc">Release Year</option>
          </select>
        </div>
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
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
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
              <div key={item.mediaId} className="space-y-1.5">
                <MediaCard media={summary} />
                <button
                  type="button"
                  onClick={() => void removeFromWatchlist(item.mediaId)}
                  className="w-full inline-flex items-center justify-center gap-1.5 py-1.5 rounded-lg border border-[#EEEEEE] dark:border-zinc-800 text-xs font-medium text-[#737373] hover:text-[#E50914] hover:border-[#E50914] transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Remove
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
