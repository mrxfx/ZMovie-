import type { GenreItem, MediaDetails, MediaSummary } from '../types/media';

// Local development fallback catalog used ONLY when TMDB_READ_ACCESS_TOKEN is not configured
// or external metadata APIs are unreachable. Uses generated local assets to guarantee zero broken images.
export const FALLBACK_HERO_BACKDROP = '/src/assets/images/hero_cinema_backdrop_1794573963819.jpg';
export const FALLBACK_POSTER_SCIFI = '/src/assets/images/poster_scifi_odyssey_1794573963795.jpg';
export const FALLBACK_POSTER_NOIR = '/src/assets/images/poster_noir_thriller_1794573964910.jpg';
export const FALLBACK_POSTER_ANIME = '/src/assets/images/poster_anime_chronicle_1794573964598.jpg';
export const FALLBACK_POSTER_SERIES = '/src/assets/images/poster_series_horizon_1794573966000.jpg';

export const MOVIE_GENRES: GenreItem[] = [
  { id: 28, name: 'Action' },
  { id: 12, name: 'Adventure' },
  { id: 18, name: 'Drama' },
  { id: 878, name: 'Science Fiction' },
  { id: 53, name: 'Thriller' },
  { id: 80, name: 'Crime' },
  { id: 9648, name: 'Mystery' },
  { id: 16, name: 'Animation' },
];

export const TV_GENRES: GenreItem[] = [
  { id: 18, name: 'Drama' },
  { id: 10765, name: 'Sci-Fi & Fantasy' },
  { id: 80, name: 'Crime' },
  { id: 9648, name: 'Mystery' },
  { id: 10759, name: 'Action & Adventure' },
];

export const ANIME_GENRES: GenreItem[] = [
  { id: 1, name: 'Action' },
  { id: 2, name: 'Adventure' },
  { id: 8, name: 'Drama' },
  { id: 10, name: 'Fantasy' },
  { id: 24, name: 'Sci-Fi' },
  { id: 7, name: 'Mystery' },
];

export const FALLBACK_MOVIES: MediaSummary[] = [
  {
    id: 'movie_dev-101',
    mediaType: 'movie',
    title: 'Orbital Meridian',
    originalTitle: 'Orbital Meridian',
    overview:
      'Local development sample record. Configure TMDB_READ_ACCESS_TOKEN on the server to browse live TMDB cinema releases, trailers, and credits.',
    posterPath: FALLBACK_POSTER_SCIFI,
    backdropPath: FALLBACK_HERO_BACKDROP,
    releaseYear: '2025',
    releaseDate: '2025-09-12',
    voteAverage: 8.6,
    voteCount: 1420,
    popularity: 98.4,
    originalLanguage: 'en',
    genreIds: [878, 18, 12],
    genres: ['Science Fiction', 'Drama', 'Adventure'],
    source: 'local-fallback',
    isFallback: true,
  },
  {
    id: 'movie_dev-102',
    mediaType: 'movie',
    title: 'Crimson Lantern District',
    originalTitle: 'Crimson Lantern District',
    overview:
      'Local development sample record representing neo-noir mystery cinema. Add TMDB_READ_ACCESS_TOKEN in environment variables for real TMDB data.',
    posterPath: FALLBACK_POSTER_NOIR,
    backdropPath: FALLBACK_HERO_BACKDROP,
    releaseYear: '2024',
    releaseDate: '2024-11-08',
    voteAverage: 8.3,
    voteCount: 980,
    popularity: 89.1,
    originalLanguage: 'en',
    genreIds: [80, 9648, 53],
    genres: ['Crime', 'Mystery', 'Thriller'],
    source: 'local-fallback',
    isFallback: true,
  },
  {
    id: 'movie_dev-103',
    mediaType: 'movie',
    title: 'Glass Cliff Horizon',
    originalTitle: 'Glass Cliff Horizon',
    overview:
      'Local development sample record representing architectural thriller cinema. Real TMDB metadata loads automatically when credentials are supplied.',
    posterPath: FALLBACK_POSTER_SERIES,
    backdropPath: FALLBACK_HERO_BACKDROP,
    releaseYear: '2025',
    releaseDate: '2025-03-21',
    voteAverage: 7.9,
    voteCount: 640,
    popularity: 82.0,
    originalLanguage: 'en',
    genreIds: [53, 18],
    genres: ['Thriller', 'Drama'],
    source: 'local-fallback',
    isFallback: true,
  },
  {
    id: 'movie_dev-104',
    mediaType: 'movie',
    title: 'Rain Over Shinjuku',
    originalTitle: 'Rain Over Shinjuku',
    overview:
      'Local development sample record showcasing international urban drama. Configure TMDB_READ_ACCESS_TOKEN to fetch official TMDB movies.',
    posterPath: FALLBACK_POSTER_NOIR,
    backdropPath: FALLBACK_HERO_BACKDROP,
    releaseYear: '2023',
    releaseDate: '2023-10-14',
    voteAverage: 8.1,
    voteCount: 1120,
    popularity: 77.5,
    originalLanguage: 'ja',
    genreIds: [18, 9648],
    genres: ['Drama', 'Mystery'],
    source: 'local-fallback',
    isFallback: true,
  },
  {
    id: 'movie_dev-105',
    mediaType: 'movie',
    title: 'Perihelion Nine',
    originalTitle: 'Perihelion Nine',
    overview:
      'Local development sample record for upcoming sci-fi feature discovery. Real upcoming releases populate when TMDB is configured.',
    posterPath: FALLBACK_POSTER_SCIFI,
    backdropPath: FALLBACK_HERO_BACKDROP,
    releaseYear: '2026',
    releaseDate: '2026-06-18',
    voteAverage: 8.4,
    voteCount: 310,
    popularity: 91.2,
    originalLanguage: 'en',
    genreIds: [878, 28],
    genres: ['Science Fiction', 'Action'],
    source: 'local-fallback',
    isFallback: true,
  },
];

export const FALLBACK_TV_SERIES: MediaSummary[] = [
  {
    id: 'tv_dev-201',
    mediaType: 'tv',
    title: 'The Cliffside Accord',
    originalTitle: 'The Cliffside Accord',
    overview:
      'Local development sample TV series record. Configure TMDB_READ_ACCESS_TOKEN on the server to load live TMDB television seasons and episodes.',
    posterPath: FALLBACK_POSTER_SERIES,
    backdropPath: FALLBACK_HERO_BACKDROP,
    releaseYear: '2025',
    releaseDate: '2025-02-14',
    voteAverage: 8.7,
    voteCount: 840,
    popularity: 95.3,
    originalLanguage: 'en',
    genreIds: [18, 9648],
    genres: ['Drama', 'Mystery'],
    seasonCount: 2,
    episodeCount: 16,
    source: 'local-fallback',
    isFallback: true,
  },
  {
    id: 'tv_dev-202',
    mediaType: 'tv',
    title: 'Signal Zero: Orbital',
    originalTitle: 'Signal Zero: Orbital',
    overview:
      'Local development sample sci-fi series record. Real TMDB series metadata and episode guides appear automatically once TMDB_READ_ACCESS_TOKEN is set.',
    posterPath: FALLBACK_POSTER_SCIFI,
    backdropPath: FALLBACK_HERO_BACKDROP,
    releaseYear: '2024',
    releaseDate: '2024-08-30',
    voteAverage: 8.2,
    voteCount: 620,
    popularity: 88.6,
    originalLanguage: 'en',
    genreIds: [10765, 18],
    genres: ['Sci-Fi & Fantasy', 'Drama'],
    seasonCount: 3,
    episodeCount: 24,
    source: 'local-fallback',
    isFallback: true,
  },
  {
    id: 'tv_dev-203',
    mediaType: 'tv',
    title: 'Harbor Precinct',
    originalTitle: 'Harbor Precinct',
    overview:
      'Local development sample crime drama series. Add a TMDB token in your environment configuration to browse live airing schedules.',
    posterPath: FALLBACK_POSTER_NOIR,
    backdropPath: FALLBACK_HERO_BACKDROP,
    releaseYear: '2023',
    releaseDate: '2023-05-12',
    voteAverage: 8.0,
    voteCount: 530,
    popularity: 79.4,
    originalLanguage: 'en',
    genreIds: [80, 18],
    genres: ['Crime', 'Drama'],
    seasonCount: 4,
    episodeCount: 32,
    source: 'local-fallback',
    isFallback: true,
  },
];

export const FALLBACK_ANIME: MediaSummary[] = [
  {
    id: 'anime_dev-301',
    mediaType: 'anime',
    title: 'Chronicle of the Crimson Bridge',
    originalTitle: 'Aka-hashi no Kiseki',
    overview:
      'Local development fallback anime record with separate MAL-compatible adapter structure. Live anime data is fetched from Jikan/MAL when network access is available.',
    posterPath: FALLBACK_POSTER_ANIME,
    backdropPath: FALLBACK_HERO_BACKDROP,
    releaseYear: '2025',
    releaseDate: '2025-04-06',
    voteAverage: 8.9,
    voteCount: 1920,
    popularity: 97.1,
    originalLanguage: 'ja',
    genreIds: [1, 10, 8],
    genres: ['Action', 'Fantasy', 'Drama'],
    episodeCount: 24,
    source: 'local-fallback',
    isFallback: true,
  },
  {
    id: 'anime_dev-302',
    mediaType: 'anime',
    title: 'Starward Astral Drift',
    originalTitle: 'Hoshi no Kanata',
    overview:
      'Local development fallback sci-fi anime record. Separate MAL ID adapter prevents TMDB/MAL ID collisions.',
    posterPath: FALLBACK_POSTER_SCIFI,
    backdropPath: FALLBACK_HERO_BACKDROP,
    releaseYear: '2024',
    releaseDate: '2024-10-03',
    voteAverage: 8.5,
    voteCount: 1210,
    popularity: 86.2,
    originalLanguage: 'ja',
    genreIds: [24, 2, 8],
    genres: ['Sci-Fi', 'Adventure', 'Drama'],
    episodeCount: 12,
    source: 'local-fallback',
    isFallback: true,
  },
  {
    id: 'anime_dev-303',
    mediaType: 'anime',
    title: 'Midnight Shrine Casebook',
    originalTitle: 'Yoru no Yashiro',
    overview:
      'Local development fallback mystery anime record. Connects to Jikan v4 REST API automatically when online.',
    posterPath: FALLBACK_POSTER_ANIME,
    backdropPath: FALLBACK_HERO_BACKDROP,
    releaseYear: '2024',
    releaseDate: '2024-01-11',
    voteAverage: 8.4,
    voteCount: 890,
    popularity: 84.0,
    originalLanguage: 'ja',
    genreIds: [7, 10, 8],
    genres: ['Mystery', 'Fantasy', 'Drama'],
    episodeCount: 13,
    source: 'local-fallback',
    isFallback: true,
  },
];

export function buildFallbackDetails(rawId: string, mediaType: 'movie' | 'tv' | 'anime'): MediaDetails | null {
  const all = [...FALLBACK_MOVIES, ...FALLBACK_TV_SERIES, ...FALLBACK_ANIME];
  const cleanId = rawId.replace(/^(movie|tv|anime)_/, '');
  const found =
    all.find((m) => m.id === rawId || m.id === `${mediaType}_${cleanId}`) ??
    all.find((m) => m.mediaType === mediaType);
  if (!found) return null;

  const seasons =
    mediaType === 'tv'
      ? [
          {
            id: 1,
            seasonNumber: 1,
            name: 'Season 1',
            episodeCount: 8,
            airDate: found.releaseDate,
            posterPath: found.posterPath,
            overview: 'Local development sample season.',
          },
          {
            id: 2,
            seasonNumber: 2,
            name: 'Season 2',
            episodeCount: 8,
            airDate: found.releaseDate,
            posterPath: found.posterPath,
            overview: 'Local development sample season.',
          },
        ]
      : undefined;

  const episodeTotal = mediaType === 'anime' ? found.episodeCount ?? 12 : mediaType === 'tv' ? 8 : 0;
  const episodes =
    episodeTotal > 0
      ? Array.from({ length: Math.min(episodeTotal, 12) }, (_, idx) => ({
          id: idx + 1,
          episodeNumber: idx + 1,
          seasonNumber: 1,
          name: `Episode ${idx + 1}`,
          overview: 'Local development sample episode metadata.',
          stillPath: found.backdropPath,
          airDate: found.releaseDate,
          runtime: mediaType === 'anime' ? 24 : 48,
        }))
      : undefined;

  return {
    ...found,
    tagline: 'ZyvoMovie Local Development Catalog Sample',
    runtime: mediaType === 'movie' ? 128 : mediaType === 'anime' ? 24 : 48,
    numberOfSeasons: seasons?.length,
    numberOfEpisodes: found.episodeCount,
    studios: ['Zyvo Development Sandbox'],
    credits: [
      { id: 1, name: 'Sample Lead Cast', character: 'Protagonist', profilePath: null },
      { id: 2, name: 'Sample Supporting Cast', character: 'Navigator', profilePath: null },
    ],
    videos: [],
    seasons,
    episodes,
    similar: all.filter((m) => m.mediaType === mediaType && m.id !== found.id),
    recommendations: all.filter((m) => m.id !== found.id).slice(0, 4),
  };
}
