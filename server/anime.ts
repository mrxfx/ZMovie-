import { apiCache } from './cache.js';
import { ANIME_GENRES } from '../src/data/genres.js';
import type {
  CastMember,
  DiscoverFilters,
  EpisodeSummary,
  GenreItem,
  MediaDetails,
  MediaSummary,
  PagedCatalogResponse,
  VideoItem,
} from '../src/types/media.js';

const JIKAN_BASE_URL = 'https://api.jikan.moe/v4';
const JIKAN_MIN_INTERVAL_MS = 380; // Respect Jikan v4 3 req/sec limit cleanly
const KITSU_BASE_URL = 'https://kitsu.io/api/edge';

interface KitsuRawAnime {
  id: string;
  attributes?: {
    titles?: { en?: string; en_jp?: string; ja_jp?: string };
    canonicalTitle?: string;
    synopsis?: string;
    posterImage?: { original?: string; large?: string; medium?: string };
    coverImage?: { original?: string; large?: string };
    startDate?: string;
    averageRating?: string;
    popularityRank?: number;
    episodeCount?: number;
    status?: string;
    subtype?: string;
  };
}

export async function fetchKitsuSearch(query: string, limit = 20): Promise<MediaSummary[]> {
  const cacheKey = `kitsu:search:${query}:${limit}`;
  const cached = apiCache.get<MediaSummary[]>(cacheKey);
  if (cached) return cached;

  try {
    const res = await fetch(`${KITSU_BASE_URL}/anime?filter[text]=${encodeURIComponent(query)}&page[limit]=${limit}`, {
      headers: { Accept: 'application/vnd.api+json' },
    });
    if (!res.ok) return [];
    const json = (await res.json()) as { data?: KitsuRawAnime[] };
    const items = (json.data || []).map((raw): MediaSummary => {
      const attr = raw.attributes || {};
      const titles = attr.titles || {};
      const poster = attr.posterImage?.large || attr.posterImage?.original || attr.posterImage?.medium || null;
      const releaseDate = attr.startDate || '';
      const releaseYear = releaseDate ? releaseDate.slice(0, 4) : 'TBA';
      const score = attr.averageRating ? Number(attr.averageRating) / 10 : 0;

      return {
        id: `kitsu_${raw.id}`,
        mediaType: 'anime',
        malId: Number(raw.id),
        title: titles.en || attr.canonicalTitle || 'Untitled Anime',
        originalTitle: titles.ja_jp || titles.en_jp || attr.canonicalTitle,
        overview: attr.synopsis || 'No synopsis available.',
        posterPath: poster,
        backdropPath: attr.coverImage?.large || attr.coverImage?.original || poster,
        releaseYear,
        releaseDate,
        voteAverage: Math.round(score * 10) / 10,
        voteCount: attr.popularityRank ? 1000 - attr.popularityRank : 100,
        popularity: attr.popularityRank ? 10000 - attr.popularityRank : 500,
        originalLanguage: 'ja',
        genreIds: [],
        genres: ['Anime', attr.subtype || 'Series'],
        episodeCount: attr.episodeCount,
        status: attr.status,
        source: 'kitsu',
      };
    });

    apiCache.set(cacheKey, items, 600_000);
    return items;
  } catch {
    return [];
  }
}

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

export interface JikanUserProfile {
  malId?: number;
  username: string;
  url: string;
  avatarPath: string | null;
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
let jikanQueueTail: Promise<void> = Promise.resolve();
let lastJikanRequestAtMs = 0;
const jikanEtagStore = new Map<string, { etag: string; data: unknown }>();

function scheduleJikanSlot(): Promise<void> {
  const next = jikanQueueTail.then(async () => {
    const elapsed = Date.now() - lastJikanRequestAtMs;
    if (elapsed < JIKAN_MIN_INTERVAL_MS) {
      await new Promise((resolve) => setTimeout(resolve, JIKAN_MIN_INTERVAL_MS - elapsed));
    }
    lastJikanRequestAtMs = Date.now();
  });
  jikanQueueTail = next.catch(() => {});
  return next;
}

async function jikanFetch<T>(endpoint: string, ttlMs = 600_000): Promise<T> {
  const cacheKey = `jikan:${endpoint}`;
  if (ttlMs > 0) {
    const cached = apiCache.get<T>(cacheKey);
    if (cached) return cached;
  }

  if (Date.now() < jikanCircuitOpenUntilMs) {
    throw new Error('JIKAN_CIRCUIT_OPEN');
  }

  await scheduleJikanSlot();

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 7000);
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'User-Agent': 'ZyvoMovie/1.0',
  };
  const etagEntry = jikanEtagStore.get(cacheKey);
  if (etagEntry?.etag) {
    headers['If-None-Match'] = etagEntry.etag;
  }

  try {
    const res = await fetch(`${JIKAN_BASE_URL}${endpoint}`, {
      headers,
      signal: controller.signal,
    });

    if (res.status === 304 && etagEntry) {
      const data = etagEntry.data as T;
      if (ttlMs > 0) apiCache.set(cacheKey, data, ttlMs);
      return data;
    }

    if (res.status === 429) {
      jikanCircuitOpenUntilMs = Date.now() + 5_000;
      throw new Error('JIKAN_RATE_LIMIT (HTTP 429)');
    }
    if (res.status === 404) {
      throw new Error('JIKAN_NOT_FOUND');
    }
    if (res.status === 503) {
      jikanCircuitOpenUntilMs = Date.now() + 5_000;
      throw new Error('JIKAN_HTTP_503');
    }
    if (!res.ok) {
      throw new Error(`JIKAN_HTTP_${res.status}`);
    }

    const json = (await res.json()) as T;
    const etag = res.headers.get('etag');
    if (etag && ttlMs > 0) {
      jikanEtagStore.set(cacheKey, { etag, data: json });
      if (jikanEtagStore.size > 200) {
        const oldestKey = jikanEtagStore.keys().next().value;
        if (oldestKey) jikanEtagStore.delete(oldestKey);
      }
    }
    if (ttlMs > 0) {
      apiCache.set(cacheKey, json, ttlMs);
    }
    return json;
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('Jikan API request timed out');
    }
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
      endpoint = `/top/anime?filter=airing&sfw=true&page=${page}&limit=20`;
    } else if (category === 'top_rated') {
      endpoint = `/top/anime?sfw=true&page=${page}&limit=20`;
    } else if (category === 'top_movies') {
      endpoint = `/top/anime?type=movie&sfw=true&page=${page}&limit=20`;
    } else if (category === 'seasons_now') {
      endpoint = `/seasons/now?sfw=true&page=${page}&limit=20`;
    } else if (category === 'upcoming') {
      endpoint = `/seasons/upcoming?sfw=true&page=${page}&limit=20`;
    } else if (category === 'schedules') {
      endpoint = `/schedules?sfw=true&page=${page}&limit=20`;
    } else {
      endpoint = `/top/anime?filter=bypopularity&sfw=true&page=${page}&limit=20`;
    }

    const res = await jikanFetch<{
      data: JikanAnimeRaw[];
      pagination?: {
        last_visible_page?: number;
        items?: { total?: number };
      };
    }>(endpoint);

    // Deduplicate entries by mal_id (seasons/schedules can return repeated entries across cours)
    const seen = new Set<number>();
    const items: MediaSummary[] = [];
    for (const raw of res.data || []) {
      if (!raw.mal_id || seen.has(raw.mal_id)) continue;
      seen.add(raw.mal_id);
      items.push(mapJikanSummary(raw));
    }

    return {
      items,
      page,
      totalPages: Math.min(res.pagination?.last_visible_page || 1, 100),
      totalResults: res.pagination?.items?.total || items.length,
      source: 'jikan',
      configured: true,
    };
  } catch (err) {
    const queryText = filters.query?.trim() || category;
    const kitsuResults = await fetchKitsuSearch(queryText, 20);
    if (kitsuResults.length > 0) {
      return {
        items: kitsuResults,
        page,
        totalPages: 1,
        totalResults: kitsuResults.length,
        source: 'kitsu',
        configured: true,
      };
    }
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

export async function fetchAnimeCatalogSyncBatch(
  category = 'trending',
  limit = 10
): Promise<{
  items: MediaDetails[];
  configured: boolean;
  notice?: string;
}> {
  const safeLimit = Math.min(15, Math.max(1, Math.floor(limit || 10)));
  const listRes = await fetchAnimeList(category, { page: 1 });
  if (listRes.items.length === 0) {
    return {
      items: [],
      configured: true,
      notice: listRes.notice || 'No Jikan anime titles returned for that feed.',
    };
  }

  // Convert list items straight to MediaDetails without hammering Jikan with 4 sub-calls per title
  const candidates: MediaDetails[] = listRes.items.slice(0, safeLimit).map((summary) => ({
    ...summary,
    runtime: 24,
    numberOfEpisodes: summary.episodeCount,
    studios: [],
    credits: [],
    videos: [],
    similar: [],
    recommendations: [],
  }));

  return {
    items: candidates,
    configured: true,
  };
}

export async function fetchRandomAnime(): Promise<{
  item: MediaSummary | null;
  notice?: string;
}> {
  try {
    const res = await jikanFetch<{ data: JikanAnimeRaw }>('/random/anime', 0);
    if (!res.data?.mal_id) {
      return { item: null, notice: 'Jikan did not return an anime.' };
    }
    return { item: mapJikanSummary(res.data) };
  } catch (err) {
    return {
      item: null,
      notice: `Unable to fetch random anime (${err instanceof Error ? err.message : 'offline'}).`,
    };
  }
}

export async function fetchJikanUserAnimeFavorites(username: string): Promise<{
  user: JikanUserProfile | null;
  items: MediaSummary[];
  notice?: string;
}> {
  const cleanUser = username.trim().replace(/^@/, '');
  if (!cleanUser || !/^[a-zA-Z0-9_-]{2,40}$/.test(cleanUser)) {
    return {
      user: null,
      items: [],
      notice: 'Enter a valid MyAnimeList username (2–40 letters, numbers, _ or -).',
    };
  }

  try {
    const profileRes = await jikanFetch<{
      data?: {
        mal_id?: number;
        username?: string;
        url?: string;
        images?: { jpg?: { image_url?: string | null } };
      };
    }>(`/users/${encodeURIComponent(cleanUser)}`, 300_000);

    const favRes = await jikanFetch<{
      data?: {
        anime?: Array<{
          mal_id: number;
          title: string;
          start_year?: number | null;
          images?: { jpg?: { image_url?: string | null; large_image_url?: string | null } };
        }>;
      };
    }>(`/users/${encodeURIComponent(cleanUser)}/favorites`, 300_000);

    const userProfile: JikanUserProfile = {
      malId: profileRes.data?.mal_id,
      username: profileRes.data?.username || cleanUser,
      url: profileRes.data?.url || `https://myanimelist.net/profile/${encodeURIComponent(cleanUser)}`,
      avatarPath: profileRes.data?.images?.jpg?.image_url || null,
    };

    const rawAnime = favRes.data?.anime || [];
    const items: MediaSummary[] = rawAnime.map((entry) => ({
      id: `anime_${entry.mal_id}`,
      mediaType: 'anime',
      malId: entry.mal_id,
      title: entry.title || `MAL #${entry.mal_id}`,
      overview: '',
      posterPath: entry.images?.jpg?.large_image_url || entry.images?.jpg?.image_url || null,
      backdropPath: entry.images?.jpg?.large_image_url || entry.images?.jpg?.image_url || null,
      releaseYear: entry.start_year ? String(entry.start_year) : '',
      releaseDate: '',
      voteAverage: 0,
      voteCount: 0,
      popularity: 0,
      originalLanguage: 'ja',
      genreIds: [],
      genres: ['Anime'],
      source: 'jikan',
    }));

    return {
      user: userProfile,
      items,
    };
  } catch (err) {
    if (err instanceof Error && err.message === 'JIKAN_NOT_FOUND') {
      return {
        user: null,
        items: [],
        notice: `MyAnimeList user "${cleanUser}" was not found.`,
      };
    }
    return {
      user: null,
      items: [],
      notice: `Unable to load MyAnimeList user via Jikan (${err instanceof Error ? err.message : 'offline'}).`,
    };
  }
}

export async function fetchAnimeGenres(): Promise<GenreItem[]> {
  try {
    const res = await jikanFetch<{
      data?: Array<{ mal_id: number; name: string }>;
    }>('/genres/anime', 86_400_000);

    const list = (res.data || [])
      .filter((g) => g.mal_id && g.name)
      .slice(0, 28)
      .map((g) => ({ id: g.mal_id, name: g.name }));

    return list.length > 0 ? list : ANIME_GENRES;
  } catch {
    return ANIME_GENRES;
  }
}

export function getAnimeGenres() {
  return ANIME_GENRES;
}
