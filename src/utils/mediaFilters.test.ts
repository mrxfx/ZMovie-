import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildVidLinkUrl,
  filterCatalogMedia,
  filterWatchlistItems,
  validateSubtitleUrl,
} from './mediaFilters';
import { FALLBACK_MOVIES } from '../data/fallbackCatalog';

test('buildVidLinkUrl builds movie, tv, and anime URLs with required theme params', () => {
  const movie = buildVidLinkUrl({ mediaType: 'movie', tmdbId: 550 });
  assert.ok(movie.url?.startsWith('https://vidlink.pro/movie/550?'));
  assert.ok(movie.url?.includes('primaryColor=E50914'));
  assert.ok(movie.url?.includes('secondaryColor=EEEEEE'));
  assert.ok(movie.url?.includes('iconColor=FFFFFF'));
  assert.ok(movie.url?.includes('autoplay=false'));
  assert.ok(movie.url?.includes('nextbutton=true'));

  const tv = buildVidLinkUrl({ mediaType: 'tv', tmdbId: 1396, season: 2, episode: 5 });
  assert.ok(tv.url?.startsWith('https://vidlink.pro/tv/1396/2/5?'));

  const anime = buildVidLinkUrl({ mediaType: 'anime', malId: 16498, episode: 4, subOrDub: 'dub' });
  assert.ok(anime.url?.startsWith('https://vidlink.pro/anime/16498/4/dub?'));
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
  const sciFi = filterCatalogMedia(FALLBACK_MOVIES, { genre: 'Science Fiction', minRating: 8.5 });
  assert.equal(sciFi.length, 1);
  assert.equal(sciFi[0].title, 'Orbital Meridian');
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
