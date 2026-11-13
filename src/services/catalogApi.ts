import type {
  DiscoverFilters,
  EpisodeSummary,
  GenreItem,
  HomeCatalogResponse,
  MediaDetails,
  MediaSummary,
  MediaType,
  PagedCatalogResponse,
} from '../types/media';

export interface TmdbAccountProfile {
  id: number;
  username: string;
  name: string;
  avatarPath: string | null;
}

async function apiRequest<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = (await res.json()) as { error?: string; notice?: string };
      if (body.error) message = body.error;
      else if (body.notice) message = body.notice;
    } catch {
      // ignore json parse failure
    }
    throw new Error(message);
  }
  return (await res.json()) as T;
}

function apiGet<T>(url: string): Promise<T> {
  return apiRequest<T>(url);
}

export function fetchHomeCatalog(): Promise<HomeCatalogResponse> {
  return apiGet<HomeCatalogResponse>('/api/home');
}

export function fetchGenres(type: MediaType): Promise<{ genres: GenreItem[] }> {
  return apiGet<{ genres: GenreItem[] }>(`/api/genres/${type}`);
}

export function fetchMoviesList(
  category: string,
  filters: DiscoverFilters = {}
): Promise<PagedCatalogResponse> {
  const params = new URLSearchParams();
  if (filters.genreId && filters.genreId !== 'all') params.set('genre', filters.genreId);
  if (filters.year && filters.year !== 'all') params.set('year', filters.year);
  if (filters.language && filters.language !== 'all') params.set('language', filters.language);
  if (filters.minRating) params.set('minRating', filters.minRating);
  if (filters.sortBy) params.set('sortBy', filters.sortBy);
  if (filters.page) params.set('page', String(filters.page));
  const qs = params.toString();
  return apiGet<PagedCatalogResponse>(`/api/movies/${category}${qs ? `?${qs}` : ''}`);
}

export function fetchTvList(
  category: string,
  filters: DiscoverFilters = {}
): Promise<PagedCatalogResponse> {
  const params = new URLSearchParams();
  if (filters.genreId && filters.genreId !== 'all') params.set('genre', filters.genreId);
  if (filters.year && filters.year !== 'all') params.set('year', filters.year);
  if (filters.language && filters.language !== 'all') params.set('language', filters.language);
  if (filters.minRating) params.set('minRating', filters.minRating);
  if (filters.sortBy) params.set('sortBy', filters.sortBy);
  if (filters.page) params.set('page', String(filters.page));
  const qs = params.toString();
  return apiGet<PagedCatalogResponse>(`/api/tv/${category}${qs ? `?${qs}` : ''}`);
}

export function fetchAnimeCatalog(
  category: string,
  filters: DiscoverFilters & { query?: string } = {}
): Promise<PagedCatalogResponse> {
  const params = new URLSearchParams({ category });
  if (filters.query) params.set('q', filters.query);
  if (filters.genreId && filters.genreId !== 'all') params.set('genre', filters.genreId);
  if (filters.year && filters.year !== 'all') params.set('year', filters.year);
  if (filters.minRating) params.set('minRating', filters.minRating);
  if (filters.sortBy) params.set('sortBy', filters.sortBy);
  if (filters.page) params.set('page', String(filters.page));
  return apiGet<PagedCatalogResponse>(`/api/anime/list?${params.toString()}`);
}

export function fetchMediaDetails(
  type: MediaType,
  id: string
): Promise<{ details: MediaDetails; configured?: boolean; notice?: string }> {
  if (type === 'anime') {
    return apiGet<{ details: MediaDetails; notice?: string }>(`/api/anime/${encodeURIComponent(id)}`);
  }
  return apiGet<{ details: MediaDetails; configured?: boolean; notice?: string }>(
    `/api/${type}/${encodeURIComponent(id)}`
  );
}

export function fetchTvSeasonEpisodes(
  tvId: string,
  seasonNumber: number
): Promise<{ episodes: EpisodeSummary[] }> {
  return apiGet<{ episodes: EpisodeSummary[] }>(
    `/api/tv/${encodeURIComponent(tvId)}/season/${seasonNumber}`
  );
}

export function searchCatalog(
  query: string,
  type: 'all' | MediaType = 'all',
  page = 1
): Promise<PagedCatalogResponse> {
  const params = new URLSearchParams({
    q: query,
    type,
    page: String(page),
  });
  return apiGet<PagedCatalogResponse>(`/api/search?${params.toString()}`);
}

export function fetchApiStatus(): Promise<{
  ok: boolean;
  tmdbConfigured: boolean;
  animeProvider: string;
  streamingProvider: string;
}> {
  return apiGet('/api/status');
}

export function fetchTmdbSyncBatch(
  type: 'movie' | 'tv',
  category: string,
  limit = 10
): Promise<{
  items: MediaDetails[];
  configured: boolean;
  notice?: string;
}> {
  const params = new URLSearchParams({
    type,
    category,
    limit: String(limit),
  });
  return apiGet(`/api/tmdb/sync?${params.toString()}`);
}

export function createTmdbAuthToken(): Promise<{
  configured: boolean;
  requestToken?: string;
  authenticateUrl?: string;
  expiresAt?: string;
  notice?: string;
}> {
  return apiRequest('/api/tmdb/auth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
}

export function createTmdbAuthSession(requestToken: string): Promise<{
  configured: boolean;
  sessionId?: string;
  account?: TmdbAccountProfile;
  notice?: string;
}> {
  return apiRequest('/api/tmdb/auth/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ requestToken }),
  });
}

export function fetchTmdbAccountWatchlist(
  sessionId: string,
  accountId: number
): Promise<{
  configured: boolean;
  items: MediaSummary[];
  notice?: string;
}> {
  const params = new URLSearchParams({ accountId: String(accountId) });
  return apiRequest(`/api/tmdb/account/watchlist?${params.toString()}`, {
    headers: {
      'x-tmdb-session': sessionId,
    },
  });
}

export function pushTmdbWatchlistItem(
  sessionId: string,
  accountId: number,
  mediaType: 'movie' | 'tv',
  tmdbId: number,
  watchlist = true
): Promise<{
  configured: boolean;
  success: boolean;
  notice?: string;
}> {
  return apiRequest('/api/tmdb/account/watchlist', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-tmdb-session': sessionId,
    },
    body: JSON.stringify({
      accountId,
      mediaType,
      tmdbId,
      watchlist,
    }),
  });
}

export interface JikanUserProfile {
  malId?: number;
  username: string;
  url: string;
  avatarPath: string | null;
}

export function fetchAnimeSyncBatch(
  category = 'trending',
  limit = 10
): Promise<{
  items: MediaDetails[];
  configured: boolean;
  notice?: string;
}> {
  const params = new URLSearchParams({
    category,
    limit: String(limit),
  });
  return apiGet(`/api/anime/sync?${params.toString()}`);
}

export function fetchRandomAnime(): Promise<{
  item: MediaSummary | null;
  notice?: string;
}> {
  return apiGet('/api/anime/random');
}

export function fetchJikanUserFavorites(username: string): Promise<{
  user: JikanUserProfile | null;
  items: MediaSummary[];
  notice?: string;
}> {
  return apiGet(`/api/jikan/user/${encodeURIComponent(username.trim())}/favorites`);
}
