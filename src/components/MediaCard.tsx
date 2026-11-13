import { useState } from 'react';
import { Bookmark, BookmarkCheck, Film, Play } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { MediaSummary } from '../types/media';
import { useLibrary } from '../context/LibraryContext';
import { createCanonicalMediaId } from '../utils/watchProgress';

export function getMediaDetailRoute(media: Pick<MediaSummary, 'mediaType' | 'id' | 'tmdbId' | 'malId'>) {
  const rawId =
    media.mediaType === 'anime'
      ? media.malId ?? media.id.replace(/^anime_/, '')
      : media.tmdbId ?? media.id.replace(/^(movie|tv)_/, '');
  return `/${media.mediaType}/${rawId}`;
}

export function getMediaWatchRoute(media: Pick<MediaSummary, 'mediaType' | 'id' | 'tmdbId' | 'malId'>) {
  const rawId =
    media.mediaType === 'anime'
      ? media.malId ?? media.id.replace(/^anime_/, '')
      : media.tmdbId ?? media.id.replace(/^(movie|tv)_/, '');
  return `/watch/${media.mediaType}/${rawId}`;
}

export function MediaCard({
  media,
  progressPercent,
}: {
  media: MediaSummary;
  progressPercent?: number;
}) {
  const { isInWatchlist, toggleWatchlist } = useLibrary();
  const [imgError, setImgError] = useState(false);

  const canonicalId = createCanonicalMediaId(media.mediaType, media.id);
  const saved = isInWatchlist(canonicalId);
  const detailPath = getMediaDetailRoute(media);
  const watchPath = getMediaWatchRoute(media);
  const mediaLabel =
    media.mediaType === 'tv' ? 'TV Series' : media.mediaType === 'anime' ? 'Anime' : 'Movie';

  return (
    <article className="group flex flex-col">
      <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-[#F7F7F8] dark:bg-zinc-900 border border-[#EEEEEE] dark:border-zinc-800 transition-transform duration-200 group-hover:-translate-y-0.5">
        <Link
          to={detailPath}
          aria-label={`View details for ${media.title}`}
          className="block w-full h-full focus-visible:outline-2 focus-visible:outline-[#E50914]"
        >
          {media.posterPath && !imgError ? (
            <img
              src={media.posterPath}
              alt={`${media.title} poster`}
              loading="lazy"
              referrerPolicy="no-referrer"
              onError={() => setImgError(true)}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center bg-gradient-to-br from-[#F7F7F8] to-[#EEEEEE] dark:from-zinc-900 dark:to-zinc-800 text-[#737373] dark:text-zinc-400">
              <Film className="w-8 h-8 mb-2 text-[#E50914]/70" />
              <span className="font-display text-xs font-semibold line-clamp-2 text-[#171717] dark:text-zinc-200">
                {media.title}
              </span>
            </div>
          )}
        </Link>

        {/* Subtle bottom hover action scrim for immediate Play */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/70 via-black/25 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-end justify-between p-2.5">
          <Link
            to={watchPath}
            className="pointer-events-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#E50914] hover:bg-[#B20710] text-white text-xs font-semibold transition-colors whitespace-nowrap"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            Watch
          </Link>
        </div>

        {/* Watchlist quick toggle button (>=44px touch target) */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            void toggleWatchlist(media);
          }}
          aria-label={
            saved ? `Remove ${media.title} from My List` : `Add ${media.title} to My List`
          }
          aria-pressed={saved}
          className={`absolute top-2 right-2 min-w-[44px] min-h-[44px] w-11 h-11 rounded-lg flex items-center justify-center transition-colors focus-visible:outline-2 focus-visible:outline-[#E50914] ${
            saved
              ? 'bg-[#E50914] text-white shadow-sm'
              : 'bg-white/90 dark:bg-zinc-900/90 text-[#171717] dark:text-zinc-100 hover:bg-white dark:hover:bg-zinc-800 border border-[#EEEEEE] dark:border-zinc-700'
          }`}
        >
          {saved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
        </button>

        {/* Optional Continue Watching progress bar */}
        {typeof progressPercent === 'number' && progressPercent > 0 && (
          <div className="absolute inset-x-0 bottom-0 h-1 bg-black/25">
            <div
              className="h-full bg-[#E50914]"
              style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
            />
          </div>
        )}
      </div>

      {/* Zero-pill clean editorial metadata */}
      <div className="pt-2.5">
        <Link
          to={detailPath}
          className="font-display text-sm font-semibold text-[#171717] dark:text-zinc-100 hover:text-[#E50914] dark:hover:text-[#E50914] transition-colors line-clamp-1"
        >
          {media.title}
        </Link>
        <div className="mt-1 flex items-center gap-1.5 text-xs text-[#737373] dark:text-zinc-400 font-mono-tabular truncate">
          <span>{media.releaseYear || 'TBA'}</span>
          <span aria-hidden="true">·</span>
          <span>{media.voteAverage > 0 ? `★ ${media.voteAverage.toFixed(1)}` : 'NR'}</span>
          <span aria-hidden="true">·</span>
          <span className="font-sans">{mediaLabel}</span>
        </div>
      </div>
    </article>
  );
}
