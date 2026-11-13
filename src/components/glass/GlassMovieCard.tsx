import { useState } from 'react';
import { Bookmark, BookmarkCheck, Film, Info, Play, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { MediaSummary } from '../../types/media';
import { useLibrary } from '../../context/LibraryContext';
import { createCanonicalMediaId } from '../../utils/watchProgress';
import { GlassBadge } from './GlassBadge';

export function getMediaDetailRoute(
  media: Pick<MediaSummary, 'mediaType' | 'id' | 'tmdbId' | 'malId' | 'source'>
) {
  if (media.source === 'admin-firestore') {
    return `/${media.mediaType}/${media.id}`;
  }
  const rawId =
    media.mediaType === 'anime'
      ? media.malId ?? media.id.replace(/^anime_/, '')
      : media.tmdbId ?? media.id.replace(/^(movie|tv)_/, '');
  return `/${media.mediaType}/${rawId}`;
}

export function getMediaWatchRoute(
  media: Pick<MediaSummary, 'mediaType' | 'id' | 'tmdbId' | 'malId' | 'source'>
) {
  if (media.source === 'admin-firestore') {
    return `/watch/${media.mediaType}/${media.id}`;
  }
  const rawId =
    media.mediaType === 'anime'
      ? media.malId ?? media.id.replace(/^anime_/, '')
      : media.tmdbId ?? media.id.replace(/^(movie|tv)_/, '');
  return `/watch/${media.mediaType}/${rawId}`;
}

export function GlassMovieCard({
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
      <div className="relative aspect-[2/3] rounded-2xl overflow-hidden glass-surface transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-[0_22px_40px_-14px_rgba(0,0,0,0.65)]">
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
              className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.05]"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center bg-gradient-to-br from-zinc-900 to-zinc-800 text-white/60">
              <Film className="w-8 h-8 mb-2 text-[#E50914]/80" />
              <span className="font-display text-xs font-semibold line-clamp-2 text-white">
                {media.title}
              </span>
            </div>
          )}
        </Link>

        {/* Floating Glass Rating Badge (top-left) */}
        {media.voteAverage > 0 && (
          <div className="pointer-events-none absolute top-2.5 left-2.5 z-10">
            <GlassBadge variant="dark" size="xs">
              <Star className="w-3 h-3 fill-[#E50914] text-[#E50914]" />
              {media.voteAverage.toFixed(1)}
            </GlassBadge>
          </div>
        )}

        {/* Watchlist quick toggle button */}
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
          className={`absolute top-2 right-2 z-10 min-w-[36px] min-h-[36px] w-9 h-9 rounded-full flex items-center justify-center transition-all duration-150 active:scale-95 focus-visible:outline-2 focus-visible:outline-[#E50914] cursor-pointer ${
            saved
              ? 'bg-[#E50914] text-white shadow-[0_6px_16px_-3px_rgba(229,9,20,0.5)] border border-white/30'
              : 'bg-black/45 hover:bg-black/70 backdrop-blur-md text-white border border-white/25'
          }`}
        >
          {saved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
        </button>

        {/* Hover Reveal Actions */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 p-2.5 pt-10 bg-gradient-to-t from-black/85 via-black/45 to-transparent opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200 flex items-center gap-1.5">
          <Link
            to={watchPath}
            className="pointer-events-auto flex-1 inline-flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-full bg-white hover:bg-zinc-100 text-[#171717] text-xs font-semibold transition-colors whitespace-nowrap shadow-md"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            Watch
          </Link>
          <Link
            to={detailPath}
            aria-label={`Details for ${media.title}`}
            className="pointer-events-auto inline-flex items-center justify-center w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/30 text-white transition-colors shrink-0"
          >
            <Info className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Optional Continue Watching progress bar */}
        {typeof progressPercent === 'number' && progressPercent > 0 && (
          <div className="absolute inset-x-0 bottom-0 h-1.5 bg-black/45 backdrop-blur-xs">
            <div
              className="h-full bg-[#E50914] shadow-[0_0_8px_rgba(229,9,20,0.65)]"
              style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
            />
          </div>
        )}
      </div>

      {/* Crisp White Editorial Metadata */}
      <div className="pt-2.5 px-0.5">
        <Link
          to={detailPath}
          className="font-display text-sm font-semibold text-white hover:text-[#E50914] transition-colors line-clamp-1"
        >
          {media.title}
        </Link>
        <div className="mt-0.5 flex items-center gap-1.5 text-xs text-white/60 font-mono-tabular truncate">
          <span>{media.releaseYear || 'TBA'}</span>
          <span aria-hidden="true">·</span>
          <span className="font-sans">{mediaLabel}</span>
        </div>
      </div>
    </article>
  );
}
