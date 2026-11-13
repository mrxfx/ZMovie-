import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateProgressPercent,
  createCanonicalMediaId,
  formatPlaybackTime,
  isPlaybackCompleted,
  mergeHistoryItems,
  mergeWatchProgressItems,
  mergeWatchlistItems,
} from './watchProgress';

test('calculateProgressPercent clamps and rounds cleanly', () => {
  assert.equal(calculateProgressPercent(300, 600), 50);
  assert.equal(calculateProgressPercent(900, 600), 100);
  assert.equal(calculateProgressPercent(-10, 600), 0);
  assert.equal(calculateProgressPercent(100, 0), 0);
});

test('isPlaybackCompleted detects >=90% or ended event', () => {
  assert.equal(isPlaybackCompleted(89.9, 'timeupdate'), false);
  assert.equal(isPlaybackCompleted(90, 'timeupdate'), true);
  assert.equal(isPlaybackCompleted(10, 'ended'), true);
});

test('formatPlaybackTime formats seconds into mm:ss or h:mm:ss', () => {
  assert.equal(formatPlaybackTime(0), '0:00');
  assert.equal(formatPlaybackTime(65), '1:05');
  assert.equal(formatPlaybackTime(3665), '1:01:05');
});

test('createCanonicalMediaId prevents duplicate mediaType prefixes', () => {
  assert.equal(createCanonicalMediaId('movie', 550), 'movie_550');
  assert.equal(createCanonicalMediaId('movie', 'movie_550'), 'movie_550');
  assert.equal(createCanonicalMediaId('anime', 'mal/123'), 'anime_mal123');
});

test('mergeWatchlistItems merges guest and remote items keeping newer timestamps', () => {
  const merged = mergeWatchlistItems(
    [
      {
        uid: 'u1',
        mediaId: 'movie_10',
        mediaType: 'movie',
        title: 'Alpha',
        posterPath: '/a.jpg',
        releaseYear: '2024',
        voteAverage: 8.1,
        tmdbId: 10,
        addedAtMs: 1000,
      },
    ],
    [
      {
        uid: 'guest',
        mediaId: 'movie_10',
        mediaType: 'movie',
        title: 'Alpha Updated',
        posterPath: '/a.jpg',
        releaseYear: '2024',
        voteAverage: 8.1,
        tmdbId: 10,
        addedAtMs: 2000,
      },
      {
        uid: 'guest',
        mediaId: 'anime_5',
        mediaType: 'anime',
        title: 'Beta Anime',
        posterPath: '/b.jpg',
        releaseYear: '2025',
        voteAverage: 8.9,
        malId: 5,
        addedAtMs: 3000,
      },
    ],
    'u1'
  );

  assert.equal(merged.length, 2);
  assert.equal(merged[0].mediaId, 'anime_5');
  assert.equal(merged[0].uid, 'u1');
  assert.equal(merged[1].title, 'Alpha Updated');
});

test('mergeWatchProgressItems keeps newer progress checkpoints', () => {
  const merged = mergeWatchProgressItems(
    [
      {
        uid: 'u1',
        mediaId: 'tv_99',
        mediaType: 'tv',
        title: 'Show',
        posterPath: '',
        backdropPath: '',
        tmdbId: 99,
        season: 1,
        episode: 2,
        currentTime: 200,
        duration: 1000,
        progressPercent: 20,
        completed: false,
        updatedAtMs: 5000,
      },
    ],
    [
      {
        uid: 'guest',
        mediaId: 'tv_99',
        mediaType: 'tv',
        title: 'Show',
        posterPath: '',
        backdropPath: '',
        tmdbId: 99,
        season: 1,
        episode: 1,
        currentTime: 100,
        duration: 1000,
        progressPercent: 10,
        completed: false,
        updatedAtMs: 3000,
      },
    ],
    'u1'
  );

  assert.equal(merged.length, 1);
  assert.equal(merged[0].episode, 2);
  assert.equal(merged[0].progressPercent, 20);
});

test('mergeHistoryItems deduplicates by historyId and sorts descending', () => {
  const merged = mergeHistoryItems(
    [
      {
        uid: 'u1',
        historyId: 'h1',
        mediaId: 'movie_1',
        mediaType: 'movie',
        title: 'One',
        posterPath: '',
        watchedAtMs: 1000,
      },
    ],
    [
      {
        uid: 'guest',
        historyId: 'h2',
        mediaId: 'movie_2',
        mediaType: 'movie',
        title: 'Two',
        posterPath: '',
        watchedAtMs: 4000,
      },
    ],
    'u1'
  );
  assert.equal(merged.length, 2);
  assert.equal(merged[0].historyId, 'h2');
});
