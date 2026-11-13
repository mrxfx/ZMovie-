import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildVidLinkUrl,
  filterCatalogMedia,
  filterWatchlistItems,
  validateSubtitleUrl,
} from './mediaFilters';
import type { MediaSummary } from '../types/media';

const SAMPLE_TEST_MOVIES: MediaSummary[] = [
  {
    id: 'movie_550',
    mediaType: 'movie',
    tmdbId: 550,
    title: 'Fight Club',
    overview: 'Drama feature test record.',
    posterPath: null,
    backdropPath: null,
    releaseYear: '1999',
    releaseDate: '1999-10-15',
    voteAverage: 8.4,
    voteCount: 25000,
    popularity: 90,
    originalLanguage: 'en',
    genreIds: [18],
    genres: ['Drama'],
    source: 'tmdb',
  },
  {
    id: 'movie_157336',
    mediaType: 'movie',
    tmdbId: 157336,
    title: 'Interstellar',
    overview: 'Sci-fi feature test record.',
    posterPath: null,
    backdropPath: null,
    releaseYear: '2014',
    releaseDate: '2014-11-05',
    voteAverage: 8.7,
    voteCount: 34000,
    popularity: 120,
    originalLanguage: 'en',
    genreIds: [878, 18],
    genres: ['Science Fiction', 'Drama'],
    source: 'tmdb',
  },
];

test('buildVidLinkUrl builds movie, tv, and anime URLs with required VidLink params', () => {
  const movie = buildVidLinkUrl({
    mediaType: 'movie',
    tmdbId: 550,
    playerType: 'jw',
    icons: 'vid',
    startAt: 95,
    subtitleUrl: 'https://cdn.example.com/en.vtt',
    subtitleLabel: 'English',
  });
  assert.ok(movie.url?.startsWith('https://vidlink.pro/movie/550?'));
  assert.ok(movie.url?.includes('primaryColor=ff0000'));
  assert.ok(movie.url?.includes('secondaryColor=a2a2a2'));
  assert.ok(movie.url?.includes('iconColor=eefdec'));
  assert.ok(movie.url?.includes('icons=vid'));
  assert.ok(movie.url?.includes('player=jw'));
  assert.ok(movie.url?.includes('startAt=95'));
  assert.ok(movie.url?.includes('sub_label=English'));
  assert.ok(movie.url?.includes('autoplay=false'));
  assert.ok(movie.url?.includes('nextbutton=false'));

  const tv = buildVidLinkUrl({ mediaType: 'tv', tmdbId: 1396, season: 2, episode: 5 });
  assert.ok(tv.url?.startsWith('https://vidlink.pro/tv/1396/2/5?'));
  assert.ok(tv.url?.includes('icons=default'));
  assert.ok(tv.url?.includes('player=default'));
  assert.ok(tv.url?.includes('nextbutton=false'));

  const anime = buildVidLinkUrl({
    mediaType: 'anime',
    malId: 40748,
    episode: 1,
    subOrDub: 'dub',
    animeFallback: true,
  });
  assert.ok(anime.url?.startsWith('https://vidlink.pro/anime/40748/1/dub?'));
  assert.ok(anime.url?.includes('fallback=true'));
});

test('buildVidLinkUrl refuses missing provider IDs instead of conflating TMDB and MAL IDs', () => {
  const badAnime = buildVidLinkUrl({ mediaType: 'anime', tmdbId: 550 });
  assert.equal(badAnime.url, null);
  assert.ok(badAnime.reason);
});

test('validateSubtitleUrl allows only https URLs', () => {
  assert.equal(validateSubtitleUrl('https://cdn.example.com/subs.vtt'), 'https://cdn.example.com/subs.vtt');
  assert.equal(validateSubtitleUrl('http://insecure.example.com/subs.vtt'), null);
  assert.equal(validateSubtitleUrl('javascript:alert(1)'), null);
});

test('filterCatalogMedia filters by genre, rating, and year', () => {
  const sciFi = filterCatalogMedia(SAMPLE_TEST_MOVIES, { genre: 'Science Fiction', minRating: 8.5 });
  assert.equal(sciFi.length, 1);
  assert.equal(sciFi[0].title, 'Interstellar');
});

test('filterWatchlistItems filters by type and sorts alphabetically', () => {
  const result = filterWatchlistItems(
    [
      {
        uid: 'u1',
        mediaId: 'movie_2',
        mediaType: 'movie',
        title: 'Zebra',
        posterPath: '',
        releaseYear: '2024',
        voteAverage: 7.5,
        addedAtMs: 100,
      },
      {
        uid: 'u1',
        mediaId: 'movie_1',
        mediaType: 'movie',
        title: 'Alpha',
        posterPath: '',
        releaseYear: '2025',
        voteAverage: 8.5,
        addedAtMs: 200,
      },
      {
        uid: 'u1',
        mediaId: 'anime_1',
        mediaType: 'anime',
        title: 'Blade',
        posterPath: '',
        releaseYear: '2025',
        voteAverage: 9.0,
        addedAtMs: 300,
      },
    ],
    { mediaType: 'movie', sortBy: 'title_asc' }
  );
  assert.equal(result.length, 2);
  assert.equal(result[0].title, 'Alpha');
  assert.equal(result[1].title, 'Zebra');
});
