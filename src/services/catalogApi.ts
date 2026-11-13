import type {
  DiscoverFilters,
  EpisodeSummary,
  GenreItem,
  HomeCatalogResponse,
  MediaDetails,
  MediaType,
  PagedCatalogResponse,
} from '../types/media';

async function apiGet<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = (await res.json()) as { error?: string };
      if (body.error) message = body.error;
    } catch {
      // ignore json parse failure
    }
    throw new Error(message);
  }
  return (await res.json()) as T;
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
