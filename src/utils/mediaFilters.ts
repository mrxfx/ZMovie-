import type {
  MediaSummary,
  MediaType,
  VidLinkIconsStyle,
  VidLinkPlayerType,
  WatchlistItem,
} from '../types/media';

export interface VidLinkParams {
  mediaType: MediaType;
  tmdbId?: number;
  malId?: number;
  season?: number;
  episode?: number;
  subOrDub?: 'sub' | 'dub';
  animeFallback?: boolean;
  playerType?: VidLinkPlayerType;
  icons?: VidLinkIconsStyle;
  title?: boolean;
  poster?: boolean;
  autoplay?: boolean;
  nextbutton?: boolean;
  startAt?: number;
  subtitleUrl?: string;
  subtitleLabel?: string;
  fallbackUrl?: string;
}

export function validateHttpsUrl(rawUrl?: string): string | null {
  if (!rawUrl || typeof rawUrl !== 'string') return null;
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'https:') return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

export function validateSubtitleUrl(rawUrl?: string): string | null {
  return validateHttpsUrl(rawUrl);
}

export function buildVidLinkUrl(params: VidLinkParams): { url: string | null; reason?: string } {
  const baseQuery = new URLSearchParams({
    primaryColor: 'ff0000',
    secondaryColor: 'a2a2a2',
    iconColor: 'eefdec',
    icons: params.icons === 'vid' ? 'vid' : 'default',
    player: params.playerType === 'jw' ? 'jw' : 'default',
    title: params.title === false ? 'false' : 'true',
    poster: params.poster === false ? 'false' : 'true',
    autoplay: params.autoplay ? 'true' : 'false',
    nextbutton: params.nextbutton ? 'true' : 'false',
  });

  if (params.startAt && Number.isFinite(params.startAt) && params.startAt >= 5) {
    baseQuery.set('startAt', String(Math.floor(params.startAt)));
  }

  const validSubtitle = validateSubtitleUrl(params.subtitleUrl);
  if (validSubtitle) {
    baseQuery.set('sub_file', validSubtitle);
    const label = (params.subtitleLabel || '').trim();
    if (label) {
      baseQuery.set('sub_label', label.slice(0, 40));
    }
  }

  const validFallbackUrl = validateHttpsUrl(params.fallbackUrl);
  if (validFallbackUrl) {
    baseQuery.set('fallback_url', validFallbackUrl);
  }

  if (params.mediaType === 'movie') {
    if (!params.tmdbId || !Number.isInteger(params.tmdbId) || params.tmdbId <= 0) {
      return {
        url: null,
        reason: 'A valid TMDB movie ID is required for VidLink movie playback.',
      };
    }
    return { url: `https://vidlink.pro/movie/${params.tmdbId}?${baseQuery.toString()}` };
  }

  if (params.mediaType === 'tv') {
    if (!params.tmdbId || !Number.isInteger(params.tmdbId) || params.tmdbId <= 0) {
      return {
        url: null,
        reason: 'A valid TMDB series ID is required for VidLink TV playback.',
      };
    }
    const season = params.season && params.season > 0 ? Math.floor(params.season) : 1;
    const episode = params.episode && params.episode > 0 ? Math.floor(params.episode) : 1;
    return {
      url: `https://vidlink.pro/tv/${params.tmdbId}/${season}/${episode}?${baseQuery.toString()}`,
    };
  }

  // Anime uses MyAnimeList ID (malId), never conflated with TMDB ID
  if (!params.malId || !Number.isInteger(params.malId) || params.malId <= 0) {
    return {
      url: null,
      reason: 'A valid MyAnimeList (MAL) ID is required for VidLink anime playback.',
    };
  }
  const episode = params.episode && params.episode > 0 ? Math.floor(params.episode) : 1;
  const subOrDub = params.subOrDub === 'dub' ? 'dub' : 'sub';
  if (params.animeFallback !== false) {
    baseQuery.set('fallback', 'true');
  }
  return {
    url: `https://vidlink.pro/anime/${params.malId}/${episode}/${subOrDub}?${baseQuery.toString()}`,
  };
}

export function filterWatchlistItems(
  items: WatchlistItem[],
  options: {
    mediaType?: 'all' | MediaType;
    query?: string;
    sortBy?: 'added_desc' | 'title_asc' | 'rating_desc' | 'year_desc';
  }
): WatchlistItem[] {
  const q = (options.query ?? '').trim().toLowerCase();
  const filtered = items.filter((item) => {
    if (options.mediaType && options.mediaType !== 'all' && item.mediaType !== options.mediaType) {
      return false;
    }
    if (q && !item.title.toLowerCase().includes(q)) {
      return false;
    }
    return true;
  });

  const sorted = [...filtered];
  switch (options.sortBy) {
    case 'title_asc':
      sorted.sort((a, b) => a.title.localeCompare(b.title));
      break;
    case 'rating_desc':
      sorted.sort((a, b) => b.voteAverage - a.voteAverage);
      break;
    case 'year_desc':
      sorted.sort((a, b) => (b.releaseYear || '').localeCompare(a.releaseYear || ''));
      break;
    case 'added_desc':
    default:
      sorted.sort((a, b) => b.addedAtMs - a.addedAtMs);
      break;
  }
  return sorted;
}

export function filterCatalogMedia(
  items: MediaSummary[],
  options: {
    genre?: string;
    year?: string;
    minRating?: number;
    language?: string;
    query?: string;
    sortBy?: 'popularity' | 'rating' | 'newest' | 'title';
  }
): MediaSummary[] {
  const q = (options.query ?? '').trim().toLowerCase();
  const filtered = items.filter((item) => {
    if (q && !item.title.toLowerCase().includes(q) && !item.overview.toLowerCase().includes(q)) {
      return false;
    }
    if (options.genre && options.genre !== 'all') {
      const genreTarget = options.genre.toLowerCase();
      const matchesGenre =
        item.genres.some((g) => g.toLowerCase() === genreTarget) ||
        item.genreIds.some((id) => String(id) === options.genre);
      if (!matchesGenre) return false;
    }
    if (options.year && options.year !== 'all' && item.releaseYear !== options.year) {
      return false;
    }
    if (options.minRating && item.voteAverage < options.minRating) {
      return false;
    }
    if (
      options.language &&
      options.language !== 'all' &&
      item.originalLanguage.toLowerCase() !== options.language.toLowerCase()
    ) {
      return false;
    }
    return true;
  });

  const sorted = [...filtered];
  switch (options.sortBy) {
    case 'rating':
      sorted.sort((a, b) => b.voteAverage - a.voteAverage);
      break;
    case 'newest':
      sorted.sort((a, b) => (b.releaseDate || '').localeCompare(a.releaseDate || ''));
      break;
    case 'title':
      sorted.sort((a, b) => a.title.localeCompare(b.title));
      break;
    case 'popularity':
    default:
      sorted.sort((a, b) => b.popularity - a.popularity);
      break;
  }
  return sorted;
}
