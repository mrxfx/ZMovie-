import { Clock, Play, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLibrary } from '../context/LibraryContext';
import { EmptyState } from '../components/StateBlocks';
import { useSeoMetadata } from '../utils/seo';

export function WatchHistoryPage() {
  useSeoMetadata({
    title: 'Watch History – ZyvoMovie',
    description: 'Review and manage your chronological watch history on ZyvoMovie.',
    path: '/history',
  });

  const { history, clearHistory } = useLibrary();

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-8 space-y-6">
      <div className="border-b border-[#EEEEEE] dark:border-zinc-800 pb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight">
            Watch History
          </h1>
          <p className="text-sm text-[#737373] dark:text-zinc-400 mt-1">
            Chronological log of titles launched in the ZyvoMovie player.
          </p>
        </div>

        {history.length > 0 && (
          <button
            type="button"
            onClick={() => void clearHistory()}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-[#EEEEEE] dark:border-zinc-800 text-sm font-medium text-[#737373] hover:text-[#E50914] hover:border-[#E50914] transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Clear Watch History
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <EmptyState
          title="Watch history is empty"
          description="Titles you play on ZyvoMovie will be recorded here unless disabled in Privacy Settings."
          actionLabel="Explore Catalog"
          actionTo="/"
        />
      ) : (
        <div className="divide-y divide-[#EEEEEE] dark:divide-zinc-800 rounded-2xl border border-[#EEEEEE] dark:border-zinc-800 bg-[#F7F7F8] dark:bg-zinc-900 overflow-hidden">
          {history.map((item) => {
            const rawId =
              item.mediaType === 'anime'
                ? item.malId ?? item.mediaId.replace(/^anime_/, '')
                : item.tmdbId ?? item.mediaId.replace(/^(movie|tv)_/, '');
            const watchQuery =
              item.mediaType === 'tv' && item.season && item.episode
                ? `?s=${item.season}&e=${item.episode}`
                : item.mediaType === 'anime' && item.episode
                  ? `?e=${item.episode}`
                  : '';
            return (
              <div
                key={item.historyId}
                className="p-4 flex items-center justify-between gap-4 hover:bg-white dark:hover:bg-zinc-800/60 transition-colors"
              >
                <div className="min-w-0">
                  <Link
                    to={`/${item.mediaType}/${rawId}`}
                    className="font-display text-base font-semibold hover:text-[#E50914] line-clamp-1"
                  >
                    {item.title}
                  </Link>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[#737373] dark:text-zinc-400 font-mono-tabular">
                    <span className="font-sans uppercase">{item.mediaType}</span>
                    {item.season && item.episode ? (
                      <>
                        <span aria-hidden="true">·</span>
                        <span>
                          S{item.season} E{item.episode}
                        </span>
                      </>
                    ) : item.episode ? (
                      <>
                        <span aria-hidden="true">·</span>
                        <span>Ep {item.episode}</span>
                      </>
                    ) : null}
                    <span aria-hidden="true">·</span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(item.watchedAtMs).toLocaleString()}
                    </span>
                  </div>
                </div>

                <Link
                  to={`/watch/${item.mediaType}/${rawId}${watchQuery}`}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#E50914] hover:bg-[#B20710] text-white text-xs font-semibold whitespace-nowrap shrink-0"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  Watch
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
