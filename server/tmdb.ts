import { apiCache } from './cache';
import { MOVIE_GENRES, TV_GENRES } from '../src/data/genres';
import type {
  CastMember,
  DiscoverFilters,
  EpisodeSummary,
  GenreItem,
  MediaDetails,
  MediaSummary,
  PagedCatalogResponse,
  SeasonSummary,
  VideoItem,
} from '../src/types/media';

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';

function getTmdbToken(): string {
  return (process.env.TMDB_READ_ACCESS_TOKEN || '').trim();
}

export function isTmdbConfigured(): boolean {
  const token = getTmdbToken();
  return token.length > 20 && !token.startsWith('YOUR_');
}

function tmdbImage(path: string | null | undefined, size: string): string | null {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('/src/')) {
    return path;
  }
  return `${TMDB_IMAGE_BASE}/${size}${path}`;
}

interface TmdbRawMedia {
  id: number;
  title?: string;
  name?: string;
  original_title?: string;
  original_name?: string;
  overview?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  release_date?: string;
  first_air_date?: string;
  vote_average?: number;
  vote_count?: number;
  popularity?: number;
  original_language?: string;
  genre_ids?: number[];
  genres?: { id: number; name: string }[];
  runtime?: number | null;
  episode_run_time?: number[];
  tagline?: string;
  status?: string;
  number_of_seasons?: number;
  number_of_episodes?: number;
  production_companies?: { id: number; name: string }[];
  seasons?: {
    id: number;
    season_number: number;
    name: string;
    episode_count: number;
    air_date?: string;
    poster_path?: string | null;
    overview?: string;
  }[];
  credits?: {
    cast?: {
      id: number;
      name: string;
      character?: string;
      profile_path?: string | null;
    }[];
  };
  videos?: {
    results?: {
      id: string;
      key: string;
      name: string;
      site: string;
      type: string;
    }[];
  };
  similar?: { results?: TmdbRawMedia[] };
  recommendations?: { results?: TmdbRawMedia[] };
}

function genreLookup(mediaType: 'movie' | 'tv'): Map<number, string> {
  const list = mediaType === 'movie' ? MOVIE_GENRES : TV_GENRES;
  return new Map(list.map((g) => [g.id, g.name]));
}

function mapTmdbSummary(raw: TmdbRawMedia, mediaType: 'movie' | 'tv'): MediaSummary {
  const releaseDate = (mediaType === 'movie' ? raw.release_date : raw.first_air_date) || '';
  const releaseYear = releaseDate ? releaseDate.slice(0, 4) : 'TBA';
  const lookup = genreLookup(mediaType);
  const genreIds = raw.genre_ids ?? raw.genres?.map((g) => g.id) ?? [];
  const genres =
    raw.genres?.map((g) => g.name) ??
    genreIds.map((id) => lookup.get(id)).filter((name): name is string => Boolean(name));

  return {
    id: `${mediaType}_${raw.id}`,
    mediaType,
    tmdbId: raw.id,
    title: (mediaType === 'movie' ? raw.title : raw.name) || 'Untitled',
    originalTitle: mediaType === 'movie' ? raw.original_title : raw.original_name,
    overview: raw.overview || 'No synopsis available.',
    posterPath: tmdbImage(raw.poster_path, 'w500'),
    backdropPath: tmdbImage(raw.backdrop_path, 'w1280'),
    releaseYear,
    releaseDate,
    voteAverage: Math.round((raw.vote_average ?? 0) * 10) / 10,
    voteCount: raw.vote_count ?? 0,
    popularity: raw.popularity ?? 0,
    originalLanguage: raw.original_language || 'en',
    genreIds,
    genres,
    seasonCount: raw.number_of_seasons,
    episodeCount: raw.number_of_episodes,
    status: raw.status,
    source: 'tmdb',
  };
}

async function tmdbFetch<T>(endpoint: string, ttlMs = 300_000): Promise<T> {
  const cacheKey = `tmdb:${endpoint}`;
  const cached = apiCache.get<T>(cacheKey);
  if (cached) return cached;

  const token = getTmdbToken();
  if (!token) {
    throw new Error('TMDB_NOT_CONFIGURED');
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(`${TMDB_BASE_URL}${endpoint}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
      signal: controller.signal,
    });

    if (res.status === 429) {
      const retryAfter = Number(res.headers.get('retry-after') || '2');
      throw new Error(`TMDB_RATE_LIMIT:${retryAfter}`);
    }

    if (!res.ok) {
      throw new Error(`TMDB_HTTP_${res.status}`);
    }

    const json = (await res.json()) as T;
    apiCache.set(cacheKey, json, ttlMs);
    return json;
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchTmdbGenres(type: 'movie' | 'tv'): Promise<{
  genres: GenreItem[];
  source: 'tmdb';
}> {
  if (!isTmdbConfigured()) {
    return { genres: type === 'movie' ? MOVIE_GENRES : TV_GENRES, source: 'tmdb' };
  }
  try {
    const data = await tmdbFetch<{ genres: GenreItem[] }>(`/genre/${type}/list?language=en-US`, 3_600_000);
    return { genres: data.genres, source: 'tmdb' };
  } catch {
    return { genres: type === 'movie' ? MOVIE_GENRES : TV_GENRES, source: 'tmdb' };
  }
}

export async function fetchTmdbCategory(
  type: 'movie' | 'tv',
  category: string,
  filters: DiscoverFilters = {}
): Promise<PagedCatalogResponse> {
  const page = Math.max(1, Number(filters.page || 1));

  if (!isTmdbConfigured()) {
    return {
      items: [],
      page: 1,
      totalPages: 1,
      totalResults: 0,
      source: 'tmdb',
      configured: false,
      notice:
        'TMDB_READ_ACCESS_TOKEN is not configured on the server. Set TMDB_READ_ACCESS_TOKEN to browse live TMDB movies and TV shows.',
    };
  }

  let endpoint = '';
  const hasDiscoverFilters =
    Boolean(filters.genreId && filters.genreId !== 'all') ||
    Boolean(filters.year && filters.year !== 'all') ||
    Boolean(filters.language && filters.language !== 'all') ||
    Boolean(filters.minRating && Number(filters.minRating) > 0) ||
    category === 'discover';

  if (hasDiscoverFilters) {
    const params = new URLSearchParams({
      language: 'en-US',
      page: String(page),
      include_adult: 'false',
      sort_by: filters.sortBy || 'popularity.desc',
    });
    if (filters.genreId && filters.genreId !== 'all') params.set('with_genres', filters.genreId);
    if (filters.year && filters.year !== 'all') {
      params.set(type === 'movie' ? 'primary_release_year' : 'first_air_date_year', filters.year);
    }
    if (filters.language && filters.language !== 'all') {
      params.set('with_original_language', filters.language);
    }
    if (filters.minRating && Number(filters.minRating) > 0) {
      params.set('vote_average.gte', filters.minRating);
      params.set('vote_count.gte', '50');
    }
    endpoint = `/discover/${type}?${params.toString()}`;
  } else if (category === 'trending') {
    endpoint = `/trending/${type}/week?language=en-US&page=${page}`;
  } else {
    const validMovieCats = new Set(['popular', 'top_rated', 'now_playing', 'upcoming']);
    const validTvCats = new Set(['popular', 'top_rated', 'airing_today', 'on_the_air']);
    const safeCategory =
      type === 'movie'
        ? validMovieCats.has(category)
          ? category
          : 'popular'
        : validTvCats.has(category)
          ? category
          : 'popular';
    endpoint = `/${type}/${safeCategory}?language=en-US&page=${page}`;
  }

  try {
    const data = await tmdbFetch<{
      results: TmdbRawMedia[];
      page: number;
      total_pages: number;
      total_results: number;
    }>(endpoint);

    return {
      items: (data.results || []).map((r) => mapTmdbSummary(r, type)),
      page: data.page || page,
      totalPages: Math.min(data.total_pages || 1, 500),
      totalResults: data.total_results || 0,
      source: 'tmdb',
      configured: true,
    };
  } catch (err) {
    return {
      items: [],
      page: 1,
      totalPages: 1,
      totalResults: 0,
      source: 'tmdb',
      configured: true,
      notice: `TMDB request unavailable (${err instanceof Error ? err.message : 'network error'}).`,
    };
  }
}

export async function fetchTmdbDetails(
  type: 'movie' | 'tv',
  rawId: string
): Promise<{ details: MediaDetails | null; configured: boolean; notice?: string }> {
  const numericId = Number(String(rawId).replace(/^(movie|tv)_/, ''));

  if (!isTmdbConfigured()) {
    return {
      details: null,
      configured: false,
      notice:
        'TMDB_READ_ACCESS_TOKEN is not configured on the server. Set TMDB_READ_ACCESS_TOKEN to load live TMDB details.',
    };
  }

  if (!Number.isInteger(numericId) || numericId <= 0) {
    return {
      details: null,
      configured: true,
      notice: 'Invalid TMDB identifier.',
    };
  }

  try {
    const raw = await tmdbFetch<TmdbRawMedia>(
      `/${type}/${numericId}?append_to_response=credits,videos,similar,recommendations&language=en-US`,
      900_000
    );

    const summary = mapTmdbSummary(raw, type);
    const credits: CastMember[] = (raw.credits?.cast || []).slice(0, 14).map((c) => ({
      id: c.id,
      name: c.name,
      character: c.character || 'Cast',
      profilePath: tmdbImage(c.profile_path, 'w185'),
    }));

    const videos: VideoItem[] = (raw.videos?.results || [])
      .filter((v) => v.site === 'YouTube')
      .slice(0, 6)
      .map((v) => ({
        id: v.id,
        key: v.key,
        name: v.name,
        site: v.site,
        type: v.type,
      }));

    const seasons: SeasonSummary[] | undefined =
      type === 'tv'
        ? (raw.seasons || [])
            .filter((s) => s.season_number > 0)
            .map((s) => ({
              id: s.id,
              seasonNumber: s.season_number,
              name: s.name,
              episodeCount: s.episode_count,
              airDate: s.air_date || '',
              posterPath: tmdbImage(s.poster_path, 'w342'),
              overview: s.overview || '',
            }))
        : undefined;

    let episodes: EpisodeSummary[] | undefined;
    if (type === 'tv' && seasons && seasons.length > 0) {
      const firstSeason = seasons[0].seasonNumber;
      episodes = await fetchTmdbSeasonEpisodes(numericId, firstSeason);
    }

    const details: MediaDetails = {
      ...summary,
      tagline: raw.tagline || undefined,
      runtime: type === 'movie' ? raw.runtime ?? null : raw.episode_run_time?.[0] ?? null,
      numberOfSeasons: raw.number_of_seasons,
      numberOfEpisodes: raw.number_of_episodes,
      studios: (raw.production_companies || []).slice(0, 3).map((p) => p.name),
      credits,
      videos,
      seasons,
      episodes,
      similar: (raw.similar?.results || []).slice(0, 10).map((s) => mapTmdbSummary(s, type)),
      recommendations: (raw.recommendations?.results || [])
        .slice(0, 10)
        .map((r) => mapTmdbSummary(r, type)),
    };

    return { details, configured: true };
  } catch (err) {
    return {
      details: null,
      configured: true,
      notice: `Unable to load live TMDB record (${err instanceof Error ? err.message : 'error'}).`,
    };
  }
}

export async function fetchTmdbSeasonEpisodes(
  tmdbId: number,
  seasonNumber: number
): Promise<EpisodeSummary[]> {
  if (!isTmdbConfigured()) {
    return [];
  }

  try {
    const data = await tmdbFetch<{
      episodes?: {
        id: number;
        episode_number: number;
        season_number: number;
        name: string;
        overview?: string;
        still_path?: string | null;
        air_date?: string;
        runtime?: number | null;
      }[];
    }>(`/tv/${tmdbId}/season/${seasonNumber}?language=en-US`, 900_000);

    return (data.episodes || []).map((ep) => ({
      id: ep.id,
      episodeNumber: ep.episode_number,
      seasonNumber: ep.season_number,
      name: ep.name || `Episode ${ep.episode_number}`,
      overview: ep.overview || 'Episode synopsis unavailable.',
      stillPath: tmdbImage(ep.still_path, 'w500'),
      airDate: ep.air_date || '',
      runtime: ep.runtime ?? null,
    }));
  } catch {
    return [];
  }
}

export async function searchTmdbMedia(
  query: string,
  type: 'all' | 'movie' | 'tv' = 'all',
  page = 1
): Promise<PagedCatalogResponse> {
  const trimmed = query.trim();
  if (!trimmed) {
    return {
      items: [],
      page: 1,
      totalPages: 1,
      totalResults: 0,
      source: 'tmdb',
      configured: isTmdbConfigured(),
    };
  }

  if (!isTmdbConfigured()) {
    return {
      items: [],
      page: 1,
      totalPages: 1,
      totalResults: 0,
      source: 'tmdb',
      configured: false,
      notice: 'TMDB_READ_ACCESS_TOKEN is not configured on the server. Configure it for live TMDB search.',
    };
  }

  try {
    if (type === 'movie' || type === 'tv') {
      const data = await tmdbFetch<{
        results: TmdbRawMedia[];
        page: number;
        total_pages: number;
        total_results: number;
      }>(`/search/${type}?query=${encodeURIComponent(trimmed)}&include_adult=false&language=en-US&page=${page}`);

      return {
        items: (data.results || []).map((r) => mapTmdbSummary(r, type)),
        page: data.page || 1,
        totalPages: Math.min(data.total_pages || 1, 500),
        totalResults: data.total_results || 0,
        source: 'tmdb',
        configured: true,
      };
    }

    const data = await tmdbFetch<{
      results: (TmdbRawMedia & { media_type?: string })[];
      page: number;
      total_pages: number;
      total_results: number;
    }>(`/search/multi?query=${encodeURIComponent(trimmed)}&include_adult=false&language=en-US&page=${page}`);

    const items = (data.results || [])
      .filter((r) => r.media_type === 'movie' || r.media_type === 'tv')
      .map((r) => mapTmdbSummary(r, r.media_type === 'tv' ? 'tv' : 'movie'));

    return {
      items,
      page: data.page || 1,
      totalPages: Math.min(data.total_pages || 1, 500),
      totalResults: data.total_results || items.length,
      source: 'tmdb',
      configured: true,
    };
  } catch (err) {
    return {
      items: [],
      page: 1,
      totalPages: 1,
      totalResults: 0,
      source: 'tmdb',
      configured: true,
      notice: `TMDB search failed (${err instanceof Error ? err.message : 'network error'}).`,
    };
  }
}
