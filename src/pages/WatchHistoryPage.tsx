import { Clock, Play, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLibrary } from '../context/LibraryContext';
import { getStoredMediaDetailRoute, getStoredMediaWatchRoute } from '../utils/mediaRoutes';
import { GlassButton, GlassPanel } from '../components/glass';
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
    <div className="w-full pt-2 space-y-6">
      <GlassPanel variant="default" padding="md" className="rounded-3xl flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            Watch History
          </h1>
          <p className="text-sm text-white/70 mt-1">
            Chronological log of titles launched in the ZyvoMovie player.
          </p>
        </div>

        {history.length > 0 && (
          <GlassButton
            variant="danger"
            size="sm"
            onClick={() => void clearHistory()}
          >
            <Trash2 className="w-4 h-4" />
            Clear Watch History
          </GlassButton>
        )}
      </GlassPanel>

      {history.length === 0 ? (
        <EmptyState
          title="Watch history is empty"
          description="Titles you play on ZyvoMovie will be recorded here unless disabled in Privacy Settings."
          actionLabel="Explore Catalog"
          actionTo="/"
        />
      ) : (
        <GlassPanel variant="default" padding="none" className="rounded-3xl overflow-hidden divide-y divide-white/15">
          {history.map((item) => {
            const watchQuery =
              item.mediaType === 'tv' && item.season && item.episode
                ? `?s=${item.season}&e=${item.episode}`
                : item.mediaType === 'anime' && item.episode
                  ? `?e=${item.episode}`
                  : '';
            return (
              <div
                key={item.historyId}
                className="p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-white/10 transition-colors"
              >
                <div className="min-w-0">
                  <Link
                    to={getStoredMediaDetailRoute(item)}
                    className="font-display text-base font-semibold text-white hover:text-[#E50914] line-clamp-1 transition-colors"
                  >
                    {item.title}
                  </Link>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-white/65 font-mono-tabular">
                    <span className="font-sans uppercase font-semibold text-[#E50914]">
                      {item.mediaType}
                    </span>
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

                <GlassButton
                  variant="primary"
                  size="sm"
                  to={getStoredMediaWatchRoute(item, watchQuery)}
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  Watch
                </GlassButton>
              </div>
            );
          })}
        </GlassPanel>
      )}
    </div>
  );
}
