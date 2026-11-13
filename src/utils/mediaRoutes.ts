import type { MediaSummary, MediaType } from '../types/media';

export function getShortTypeCode(mediaType: MediaType): 'm' | 't' | 'a' {
  return mediaType === 'tv' ? 't' : mediaType === 'anime' ? 'a' : 'm';
}

export function extractShortSlug(
  mediaType: MediaType,
  rawId: string,
  tmdbId?: number,
  malId?: number
): string {
  if (mediaType === 'anime' && malId && malId > 0) return String(malId);
  if ((mediaType === 'movie' || mediaType === 'tv') && tmdbId && tmdbId > 0) return String(tmdbId);

  const stripped = rawId.replace(/^(movie|tv|anime)_/, '');
  if (stripped.startsWith('adm_')) {
    const parts = stripped.split('_');
    const tail = parts[parts.length - 1];
    if (tail && tail.length >= 4) return tail;
  }
  return stripped;
}

export function getMediaDetailRoute(
  media: Pick<MediaSummary, 'mediaType' | 'id' | 'tmdbId' | 'malId' | 'source'>
): string {
  const code = getShortTypeCode(media.mediaType);
  const slug = extractShortSlug(media.mediaType, media.id, media.tmdbId, media.malId);
  return `/${code}/${slug}`;
}

export function getMediaWatchRoute(
  media: Pick<MediaSummary, 'mediaType' | 'id' | 'tmdbId' | 'malId' | 'source'>,
  query = ''
): string {
  const code = getShortTypeCode(media.mediaType);
  const slug = extractShortSlug(media.mediaType, media.id, media.tmdbId, media.malId);
  return `/w/${code}/${slug}${query}`;
}

export function getStoredMediaDetailRoute(item: {
  mediaType: MediaType;
  mediaId: string;
  tmdbId?: number;
  malId?: number;
}): string {
  const code = getShortTypeCode(item.mediaType);
  const slug = extractShortSlug(item.mediaType, item.mediaId, item.tmdbId, item.malId);
  return `/${code}/${slug}`;
}

export function getStoredMediaWatchRoute(
  item: {
    mediaType: MediaType;
    mediaId: string;
    tmdbId?: number;
    malId?: number;
  },
  query = ''
): string {
  const code = getShortTypeCode(item.mediaType);
  const slug = extractShortSlug(item.mediaType, item.mediaId, item.tmdbId, item.malId);
  return `/w/${code}/${slug}${query}`;
}
