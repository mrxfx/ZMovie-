import test from 'node:test';
import assert from 'node:assert/strict';
import {
  extractShortSlug,
  getMediaDetailRoute,
  getMediaWatchRoute,
  getShortTypeCode,
  getStoredMediaDetailRoute,
  getStoredMediaWatchRoute,
} from './mediaRoutes';

test('getShortTypeCode maps movie, tv, and anime to 1-character codes', () => {
  assert.equal(getShortTypeCode('movie'), 'm');
  assert.equal(getShortTypeCode('tv'), 't');
  assert.equal(getShortTypeCode('anime'), 'a');
});

test('extractShortSlug prefers numeric TMDB/MAL IDs and compacts legacy adm_ IDs', () => {
  assert.equal(extractShortSlug('movie', 'movie_786892', 786892), '786892');
  assert.equal(extractShortSlug('tv', 'tv_94997', 94997), '94997');
  assert.equal(extractShortSlug('anime', 'anime_40748', undefined, 40748), '40748');
  assert.equal(extractShortSlug('movie', 'adm_movie_1794584936009_2p6uo'), '2p6uo');
  assert.equal(extractShortSlug('movie', 'movie_adm_movie_1794584936009_2p6uo'), '2p6uo');
  assert.equal(extractShortSlug('movie', 'mk8x4p2'), 'mk8x4p2');
  assert.equal(extractShortSlug('movie', 'movie_mk8x4p2'), 'mk8x4p2');
});

test('getMediaDetailRoute and getMediaWatchRoute generate short URLs', () => {
  assert.equal(
    getMediaDetailRoute({
      mediaType: 'movie',
      id: 'adm_movie_1794584936009_2p6uo',
      source: 'admin-firestore',
    }),
    '/m/2p6uo'
  );
  assert.equal(
    getMediaWatchRoute({
      mediaType: 'movie',
      id: 'adm_movie_1794584936009_2p6uo',
      source: 'admin-firestore',
    }),
    '/w/m/2p6uo'
  );
  assert.equal(
    getMediaDetailRoute({
      mediaType: 'tv',
      id: 'tv_94997',
      tmdbId: 94997,
      source: 'tmdb',
    }),
    '/t/94997'
  );
  assert.equal(
    getMediaWatchRoute(
      {
        mediaType: 'tv',
        id: 'tv_94997',
        tmdbId: 94997,
        source: 'tmdb',
      },
      '?s=1&e=2'
    ),
    '/w/t/94997?s=1&e=2'
  );
  assert.equal(
    getMediaDetailRoute({
      mediaType: 'anime',
      id: 'anime_40748',
      malId: 40748,
      source: 'jikan',
    }),
    '/a/40748'
  );
  assert.equal(
    getMediaWatchRoute(
      {
        mediaType: 'anime',
        id: 'anime_40748',
        malId: 40748,
        source: 'jikan',
      },
      '?e=1&audio=sub'
    ),
    '/w/a/40748?e=1&audio=sub'
  );
});

test('getStoredMediaDetailRoute and getStoredMediaWatchRoute normalize stored canonical IDs', () => {
  assert.equal(
    getStoredMediaDetailRoute({
      mediaType: 'movie',
      mediaId: 'movie_adm_movie_1794584936009_2p6uo',
    }),
    '/m/2p6uo'
  );
  assert.equal(
    getStoredMediaWatchRoute(
      {
        mediaType: 'movie',
        mediaId: 'movie_mk8x4p2',
      }
    ),
    '/w/m/mk8x4p2'
  );
  assert.equal(
    getStoredMediaWatchRoute(
      {
        mediaType: 'anime',
        mediaId: 'anime_40748',
        malId: 40748,
      },
      '?e=3&audio=dub'
    ),
    '/w/a/40748?e=3&audio=dub'
  );
});
