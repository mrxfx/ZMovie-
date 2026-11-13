import { Play, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLibrary } from '../context/LibraryContext';
import { formatPlaybackTime } from '../utils/watchProgress';
import { getStoredMediaDetailRoute, getStoredMediaWatchRoute } from '../utils/mediaRoutes';
import { GlassBadge, GlassPanel } from '../components/glass';
import { EmptyState } from '../components/StateBlocks';
import { useSeoMetadata } from '../utils/seo';

export function ContinueWatchingPage() {
  useSeoMetadata({
    title: 'Continue Watching – ZyvoMovie',
    description: 'Resume movies, TV episodes, and anime right where you left off.',
    path: '/continue-watching',
  });

  const { watchProgress, removeWatchProgress } = useLibrary();

  return (
    <div className="w-full pt-2 space-y-6">
      <GlassPanel variant="default" padding="md" className="rounded-3xl flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            Continue Watching
          </h1>
          <p className="text-sm text-white/70 mt-1">
            Playback checkpoints synced from supported player progress events.
          </p>
        </div>
        <span className="px-3.5 py-1.5 rounded-full glass-control text-xs sm:text-sm font-mono-tabular text-white/80">
          {watchProgress.length} {watchProgress.length === 1 ? 'item' : 'items'}
        </span>
      </GlassPanel>

      {watchProgress.length === 0 ? (
        <EmptyState
          title="No playback checkpoints yet"
          description="When you start watching a supported title, your progress and last episode will appear here."
          actionLabel="Discover Titles"
          actionTo="/"
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3.5 sm:gap-5">
          {watchProgress.map((item) => {
            const watchQuery =
              item.mediaType === 'tv' && item.season && item.episode
                ? `?s=${item.season}&e=${item.episode}`
                : item.mediaType === 'anime' && item.episode
                  ? `?e=${item.episode}&audio=${item.subOrDub || 'sub'}`
                  : '';
            return (
              <article
                key={item.mediaId}
                className="glass-surface glass-specular rounded-2xl overflow-hidden flex flex-col hover:-translate-y-0.5 transition-all"
              >
                <Link
                  to={getStoredMediaWatchRoute(item, watchQuery)}
                  className="relative aspect-video bg-zinc-900 overflow-hidden block group"
                >
                  {item.backdropPath || item.posterPath ? (
                    <img
                      src={item.backdropPath || item.posterPath}
                      alt={item.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-300"
                    />
                  ) : null}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-4">
                    <GlassBadge variant="dark" size="sm">
                      <Play className="w-3.5 h-3.5 fill-current text-[#E50914]" />
                      {item.completed ? 'Watch Again' : `Resume ${formatPlaybackTime(item.currentTime)}`}
                    </GlassBadge>
                  </div>
                  <div className="absolute inset-x-0 bottom-0 h-1.5 bg-white/25">
                    <div
                      className="h-full bg-[#E50914]"
                      style={{ width: `${Math.min(100, item.progressPercent)}%` }}
                    />
                  </div>
                </Link>

                <div className="p-3.5 sm:p-4 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <Link
                      to={getStoredMediaDetailRoute(item)}
                      className="font-display text-base font-semibold text-white hover:text-[#E50914] line-clamp-1 transition-colors"
                    >
                      {item.title}
                    </Link>
                    <p className="text-xs text-white/65 font-mono-tabular mt-1">
                      {item.mediaType === 'tv' && item.season && item.episode
                        ? `S${item.season} E${item.episode} · `
                        : item.mediaType === 'anime' && item.episode
                          ? `Ep ${item.episode} · `
                          : ''}
                      {item.progressPercent.toFixed(0)}% ·{' '}
                      {new Date(item.updatedAtMs).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    type="button"
                    aria-label={`Remove ${item.title} from Continue Watching`}
                    onClick={() => void removeWatchProgress(item.mediaId)}
                    className="w-11 h-11 rounded-full glass-control text-white/75 hover:text-[#E50914] hover:border-[#E50914]/40 transition-colors shrink-0 inline-flex items-center justify-center cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
