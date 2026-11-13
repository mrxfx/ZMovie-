import { apiCache } from './cache';
import { ANIME_GENRES } from '../src/data/genres';
import type {
  CastMember,
  DiscoverFilters,
  EpisodeSummary,
  MediaDetails,
  MediaSummary,
  PagedCatalogResponse,
  VideoItem,
} from '../src/types/media';

const JIKAN_BASE_URL = 'https://api.jikan.moe/v4';

interface JikanAnimeRaw {
  mal_id: number;
  title: string;
  title_english?: string | null;
  title_japanese?: string | null;
  synopsis?: string | null;
  images?: {
    jpg?: {
      image_url?: string | null;
      large_image_url?: string | null;
    };
  };
  trailer?: {
    youtube_id?: string | null;
    url?: string | null;
  };
  year?: number | null;
  aired?: {
    from?: string | null;
  };
  score?: number | null;
  scored_by?: number | null;
  popularity?: number | null;
  members?: number | null;
  episodes?: number | null;
  status?: string | null;
  genres?: { mal_id: number; name: string }[];
  studios?: { mal_id: number; name: string }[];
}

function mapJikanSummary(raw: JikanAnimeRaw): MediaSummary {
  const releaseDate = raw.aired?.from ? raw.aired.from.slice(0, 10) : '';
  const releaseYear = raw.year ? String(raw.year) : releaseDate ? releaseDate.slice(0, 4) : 'TBA';
  const poster = raw.images?.jpg?.large_image_url || raw.images?.jpg?.image_url || null;

  return {
    id: `anime_${raw.mal_id}`,
    mediaType: 'anime',
    malId: raw.mal_id, // Strictly MAL ID, never assigned to tmdbId
    title: raw.title_english || raw.title || 'Untitled Anime',
    originalTitle: raw.title_japanese || raw.title,
    overview: raw.synopsis || 'No synopsis available.',
    posterPath: poster,
    backdropPath: poster,
    releaseYear,
    releaseDate,
    voteAverage: Math.round((raw.score ?? 0) * 10) / 10,
    voteCount: raw.scored_by ?? 0,
    popularity: raw.members ?? 0,
    originalLanguage: 'ja',
    genreIds: (raw.genres || []).map((g) => g.mal_id),
    genres: (raw.genres || []).map((g) => g.name),
    episodeCount: raw.episodes ?? undefined,
    status: raw.status ?? undefined,
    source: 'jikan',
  };
}

let jikanCircuitOpenUntilMs = 0;

async function jikanFetch<T>(endpoint: string, ttlMs = 600_000): Promise<T> {
  const cacheKey = `jikan:${endpoint}`;
  const cached = apiCache.get<T>(cacheKey);
  if (cached) return cached;

  if (Date.now() < jikanCircuitOpenUntilMs) {
    throw new Error('JIKAN_CIRCUIT_OPEN');
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const res = await fetch(`${JIKAN_BASE_URL}${endpoint}`, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });

    if (res.status === 429) {
      throw new Error('JIKAN_RATE_LIMIT');
    }
    if (!res.ok) {
      throw new Error(`JIKAN_HTTP_${res.status}`);
    }

    const json = (await res.json()) as T;
    apiCache.set(cacheKey, json, ttlMs);
    return json;
  } catch (err) {
    jikanCircuitOpenUntilMs = Date.now() + 60_000;
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchAnimeList(
  category: string,
  filters: DiscoverFilters & { query?: string } = {}
): Promise<PagedCatalogResponse> {
  const page = Math.max(1, Number(filters.page || 1));

  try {
    let endpoint = '';
    const hasCustomFilters =
      Boolean(filters.query && filters.query.trim()) ||
      Boolean(filters.genreId && filters.genreId !== 'all') ||
      Boolean(filters.year && filters.year !== 'all') ||
      Boolean(filters.minRating && Number(filters.minRating) > 0) ||
      category === 'discover';

    if (hasCustomFilters) {
      const params = new URLSearchParams({
        page: String(page),
        limit: '20',
        sfw: 'true',
      });
      if (filters.query && filters.query.trim()) params.set('q', filters.query.trim());
      if (filters.genreId && filters.genreId !== 'all') params.set('genres', filters.genreId);
      if (filters.year && filters.year !== 'all') {
        params.set('start_date', `${filters.year}-01-01`);
        params.set('end_date', `${filters.year}-12-31`);
      }
      if (filters.minRating && Number(filters.minRating) > 0) {
        params.set('min_score', filters.minRating);
      }
      if (filters.sortBy === 'vote_average.desc' || filters.sortBy === 'rating') {
        params.set('order_by', 'score');
        params.set('sort', 'desc');
      } else if (filters.sortBy === 'newest') {
        params.set('order_by', 'start_date');
        params.set('sort', 'desc');
      } else {
        params.set('order_by', 'members');
        params.set('sort', 'desc');
      }
      endpoint = `/anime?${params.toString()}`;
    } else if (category === 'trending') {
      endpoint = `/top/anime?filter=airing&page=${page}&limit=20`;
    } else if (category === 'top_rated') {
      endpoint = `/top/anime?page=${page}&limit=20`;
    } else {
      endpoint = `/top/anime?filter=bypopularity&page=${page}&limit=20`;
    }

    const res = await jikanFetch<{
      data: JikanAnimeRaw[];
      pagination?: {
        last_visible_page?: number;
        items?: { total?: number };
      };
    }>(endpoint);

    return {
      items: (res.data || []).map(mapJikanSummary),
      page,
      totalPages: Math.min(res.pagination?.last_visible_page || 1, 100),
      totalResults: res.pagination?.items?.total || res.data?.length || 0,
      source: 'jikan',
      configured: true,
    };
  } catch (err) {
    return {
      items: [],
      page: 1,
      totalPages: 1,
      totalResults: 0,
      source: 'jikan',
      configured: true,
      notice: `Jikan/MAL anime API unavailable (${err instanceof Error ? err.message : 'offline'}).`,
    };
  }
}

export async function fetchAnimeDetails(rawId: string): Promise<{
  details: MediaDetails | null;
  notice?: string;
}> {
  const malId = Number(String(rawId).replace(/^anime_/, ''));
  if (!Number.isInteger(malId) || malId <= 0) {
    return {
      details: null,
      notice: 'Invalid MyAnimeList (MAL) anime identifier.',
    };
  }

  try {
    const fullRes = await jikanFetch<{ data: JikanAnimeRaw }>(`/anime/${malId}/full`, 900_000);
    const summary = mapJikanSummary(fullRes.data);

    let episodes: EpisodeSummary[] = [];
    try {
      const epRes = await jikanFetch<{
        data?: { mal_id: number; title?: string; aired?: string }[];
      }>(`/anime/${malId}/episodes?page=1`, 900_000);
      episodes = (epRes.data || []).slice(0, 50).map((ep, idx) => ({
        id: ep.mal_id || idx + 1,
        episodeNumber: ep.mal_id || idx + 1,
        seasonNumber: 1,
        name: ep.title || `Episode ${idx + 1}`,
        overview: '',
        stillPath: null,
        airDate: ep.aired ? ep.aired.slice(0, 10) : '',
        runtime: 24,
      }));
    } catch {
      const count = Math.min(summary.episodeCount || 12, 24);
      episodes = Array.from({ length: count }, (_, idx) => ({
        id: idx + 1,
        episodeNumber: idx + 1,
        seasonNumber: 1,
        name: `Episode ${idx + 1}`,
        overview: '',
        stillPath: null,
        airDate: summary.releaseDate,
        runtime: 24,
      }));
    }

    let credits: CastMember[] = [];
    try {
      const charRes = await jikanFetch<{
        data?: {
          character?: { mal_id: number; name: string; images?: { jpg?: { image_url?: string } } };
          role?: string;
        }[];
      }>(`/anime/${malId}/characters`, 900_000);
      credits = (charRes.data || []).slice(0, 12).map((c) => ({
        id: c.character?.mal_id || 0,
        name: c.character?.name || 'Character',
        character: c.role || 'Cast',
        profilePath: c.character?.images?.jpg?.image_url || null,
      }));
    } catch {
      credits = [];
    }

    let recommendations: MediaSummary[] = [];
    try {
      const recRes = await jikanFetch<{
        data?: {
          entry: {
            mal_id: number;
            title: string;
            images?: { jpg?: { large_image_url?: string; image_url?: string } };
          };
        }[];
      }>(`/anime/${malId}/recommendations`, 900_000);
      recommendations = (recRes.data || []).slice(0, 10).map((r) => ({
        id: `anime_${r.entry.mal_id}`,
        mediaType: 'anime',
        malId: r.entry.mal_id,
        title: r.entry.title,
        overview: '',
        posterPath:
          r.entry.images?.jpg?.large_image_url || r.entry.images?.jpg?.image_url || null,
        backdropPath: null,
        releaseYear: '',
        releaseDate: '',
        voteAverage: 0,
        voteCount: 0,
        popularity: 0,
        originalLanguage: 'ja',
        genreIds: [],
        genres: ['Anime'],
        source: 'jikan',
      }));
    } catch {
      recommendations = [];
    }

    const videos: VideoItem[] = fullRes.data.trailer?.youtube_id
      ? [
          {
            id: 'mal-trailer',
            key: fullRes.data.trailer.youtube_id,
            name: 'Official Trailer',
            site: 'YouTube',
            type: 'Trailer',
          },
        ]
      : [];

    const details: MediaDetails = {
      ...summary,
      runtime: 24,
      numberOfEpisodes: summary.episodeCount,
      studios: (fullRes.data.studios || []).map((s) => s.name),
      credits,
      videos,
      episodes,
      similar: recommendations.slice(0, 6),
      recommendations,
    };

    return { details };
  } catch (err) {
    return {
      details: null,
      notice: `Unable to load live MAL/Jikan anime details (${err instanceof Error ? err.message : 'error'}).`,
    };
  }
}

export function getAnimeGenres() {
  return ANIME_GENRES;
}
