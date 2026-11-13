export type MediaType = 'movie' | 'tv' | 'anime';

export type CatalogSource = 'tmdb' | 'jikan' | 'local-fallback';

export interface GenreItem {
  id: number;
  name: string;
}

export interface CastMember {
  id: number;
  name: string;
  character: string;
  profilePath: string | null;
}

export interface VideoItem {
  id: string;
  key: string;
  name: string;
  site: string;
  type: string;
}

export interface EpisodeSummary {
  id: number;
  episodeNumber: number;
  seasonNumber: number;
  name: string;
  overview: string;
  stillPath: string | null;
  airDate: string;
  runtime: number | null;
}

export interface SeasonSummary {
  id: number;
  seasonNumber: number;
  name: string;
  episodeCount: number;
  airDate: string;
  posterPath: string | null;
  overview: string;
}

export interface MediaSummary {
  id: string;
  mediaType: MediaType;
  tmdbId?: number;
  malId?: number;
  title: string;
  originalTitle?: string;
  overview: string;
  posterPath: string | null;
  backdropPath: string | null;
  releaseYear: string;
  releaseDate: string;
  voteAverage: number;
  voteCount: number;
  popularity: number;
  originalLanguage: string;
  genreIds: number[];
  genres: string[];
  episodeCount?: number;
  seasonCount?: number;
  status?: string;
  source: CatalogSource;
  isFallback?: boolean;
}

export interface MediaDetails extends MediaSummary {
  tagline?: string;
  runtime?: number | null;
  numberOfSeasons?: number;
  numberOfEpisodes?: number;
  studios?: string[];
  credits: CastMember[];
  videos: VideoItem[];
  seasons?: SeasonSummary[];
  episodes?: EpisodeSummary[];
  similar: MediaSummary[];
  recommendations: MediaSummary[];
}

export interface PagedCatalogResponse {
  items: MediaSummary[];
  page: number;
  totalPages: number;
  totalResults: number;
  source: CatalogSource;
  configured: boolean;
  notice?: string;
}

export interface HomeCatalogResponse {
  featured: MediaSummary | null;
  trendingMovies: MediaSummary[];
  popularMovies: MediaSummary[];
  topRatedMovies: MediaSummary[];
  upcomingMovies: MediaSummary[];
  popularTv: MediaSummary[];
  trendingAnime: MediaSummary[];
  recommended: MediaSummary[];
  tmdbConfigured: boolean;
  source: CatalogSource;
  notice?: string;
}

export interface DiscoverFilters {
  genreId?: string;
  year?: string;
  language?: string;
  minRating?: string;
  sortBy?: string;
  page?: number;
}

export interface WatchlistItem {
  uid: string;
  mediaId: string;
  mediaType: MediaType;
  title: string;
  posterPath: string;
  releaseYear: string;
  voteAverage: number;
  tmdbId?: number;
  malId?: number;
  addedAtMs: number;
}

export interface WatchProgressItem {
  uid: string;
  mediaId: string;
  mediaType: MediaType;
  title: string;
  posterPath: string;
  backdropPath: string;
  tmdbId?: number;
  malId?: number;
  season?: number;
  episode?: number;
  subOrDub?: 'sub' | 'dub';
  currentTime: number;
  duration: number;
  progressPercent: number;
  completed: boolean;
  updatedAtMs: number;
}

export interface HistoryItem {
  uid: string;
  historyId: string;
  mediaId: string;
  mediaType: MediaType;
  title: string;
  posterPath: string;
  tmdbId?: number;
  malId?: number;
  season?: number;
  episode?: number;
  watchedAtMs: number;
}

export interface UserPreferences {
  theme: 'light' | 'dark';
  language: string;
  autoplayNext: boolean;
  preferredAnimeAudio: 'sub' | 'dub';
  saveSearchHistory: boolean;
  saveWatchHistory: boolean;
  updatedAtMs: number;
}

export interface SearchHistoryEntry {
  query: string;
  timestampMs: number;
}
