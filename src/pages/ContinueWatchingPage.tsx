import { Play, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLibrary } from '../context/LibraryContext';
import { formatPlaybackTime } from '../utils/watchProgress';
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 space-y-6">
      <div className="border-b border-[#EEEEEE] dark:border-zinc-800 pb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight">
            Continue Watching
          </h1>
          <p className="text-sm text-[#737373] dark:text-zinc-400 mt-1">
            Playback checkpoints synced from supported player progress events.
          </p>
        </div>
        <span className="text-sm font-mono-tabular text-[#737373]">
          {watchProgress.length} {watchProgress.length === 1 ? 'item' : 'items'}
        </span>
      </div>

      {watchProgress.length === 0 ? (
        <EmptyState
          title="No playback checkpoints yet"
          description="When you start watching a supported title, your progress and last episode will appear here."
          actionLabel="Discover Titles"
          actionTo="/"
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {watchProgress.map((item) => {
            const rawId =
              item.mediaType === 'anime'
                ? item.malId ?? item.mediaId.replace(/^anime_/, '')
                : item.tmdbId ?? item.mediaId.replace(/^(movie|tv)_/, '');
            const watchQuery =
              item.mediaType === 'tv' && item.season && item.episode
                ? `?s=${item.season}&e=${item.episode}`
                : item.mediaType === 'anime' && item.episode
                  ? `?e=${item.episode}&audio=${item.subOrDub || 'sub'}`
                  : '';
            return (
              <article
                key={item.mediaId}
                className="rounded-xl overflow-hidden border border-[#EEEEEE] dark:border-zinc-800 bg-[#F7F7F8] dark:bg-zinc-900 flex flex-col"
              >
                <Link
                  to={`/watch/${item.mediaType}/${rawId}${watchQuery}`}
                  className="relative aspect-video bg-zinc-900 overflow-hidden block group"
                >
                  {item.backdropPath || item.posterPath ? (
                    <img
                      src={item.backdropPath || item.posterPath}
                      alt={item.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                    />
                  ) : null}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-4">
                    <span className="inline-flex items-center gap-2 text-xs font-semibold text-white">
                      <Play className="w-4 h-4 fill-current text-[#E50914]" />
                      {item.completed ? 'Watch Again' : `Resume ${formatPlaybackTime(item.currentTime)}`}
                    </span>
                  </div>
                  <div className="absolute inset-x-0 bottom-0 h-1 bg-white/30">
                    <div
                      className="h-full bg-[#E50914]"
                      style={{ width: `${Math.min(100, item.progressPercent)}%` }}
                    />
                  </div>
                </Link>

                <div className="p-4 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <Link
                      to={`/${item.mediaType}/${rawId}`}
                      className="font-display text-base font-semibold hover:text-[#E50914] line-clamp-1"
                    >
                      {item.title}
                    </Link>
                    <p className="text-xs text-[#737373] dark:text-zinc-400 font-mono-tabular mt-1">
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
                    className="p-2.5 rounded-lg border border-[#EEEEEE] dark:border-zinc-700 text-[#737373] hover:text-[#E50914] hover:border-[#E50914] transition-colors shrink-0"
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
