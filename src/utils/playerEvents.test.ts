import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isAllowedPlayerOrigin,
  parsePlayerPostMessage,
  parseVidLinkMediaData,
  shouldPersistProgressUpdate,
} from './playerEvents';

test('isAllowedPlayerOrigin permits only allowlisted vidlink origins', () => {
  assert.equal(isAllowedPlayerOrigin('https://vidlink.pro'), true);
  assert.equal(isAllowedPlayerOrigin('https://www.vidlink.pro'), true);
  assert.equal(isAllowedPlayerOrigin('https://evil.example.com'), false);
  assert.equal(isAllowedPlayerOrigin('http://vidlink.pro'), false);
});

test('parsePlayerPostMessage rejects untrusted origin or mismatched source', () => {
  const validPayload = { event: 'timeupdate', currentTime: 120, duration: 600 };
  assert.equal(parsePlayerPostMessage(validPayload, 'https://evil.com', true), null);
  assert.equal(parsePlayerPostMessage(validPayload, 'https://vidlink.pro', false), null);
});

test('parsePlayerPostMessage parses VidLink PLAYER_EVENT payloads accurately', () => {
  const parsed = parsePlayerPostMessage(
    {
      type: 'PLAYER_EVENT',
      data: {
        event: 'seeked',
        currentTime: 300,
        duration: 1200,
        mtmdbId: 94997,
        mediaType: 'tv',
        season: 2,
        episode: 4,
      },
    },
    'https://vidlink.pro',
    true
  );
  assert.ok(parsed);
  assert.equal(parsed.type, 'seeked');
  assert.equal(parsed.progressPercent, 25);
  assert.equal(parsed.mtmdbId, 94997);
  assert.equal(parsed.mediaType, 'tv');
  assert.equal(parsed.season, 2);
  assert.equal(parsed.episode, 4);
});

test('parseVidLinkMediaData parses VidLink MEDIA_DATA progress payloads', () => {
  const parsed = parseVidLinkMediaData(
    {
      type: 'MEDIA_DATA',
      data: {
        '76479': {
          id: 76479,
          type: 'tv',
          title: 'The Boys',
          poster_path: '/2zmTngn1tYC1AvfnrFLhxeD82hz.jpg',
          progress: { watched: 1800, duration: 3600 },
          last_season_watched: '1',
          last_episode_watched: '2',
        },
      },
    },
    'https://vidlink.pro',
    true
  );
  assert.ok(parsed);
  assert.equal(parsed.entries.length, 1);
  assert.equal(parsed.entries[0].id, 76479);
  assert.equal(parsed.entries[0].progressPercent, 50);
  assert.equal(parsed.entries[0].season, 1);
  assert.equal(parsed.entries[0].episode, 2);
});

test('parsePlayerPostMessage rejects negative or NaN values', () => {
  assert.equal(
    parsePlayerPostMessage(
      { event: 'play', currentTime: -5, duration: 100 },
      'https://vidlink.pro',
      true
    ),
    null
  );
  assert.equal(
    parsePlayerPostMessage(
      { event: 'unknown', currentTime: 10, duration: 100 },
      'https://vidlink.pro',
      true
    ),
    null
  );
});

test('shouldPersistProgressUpdate throttles timeupdate and flushes pause/seeked/ended', () => {
  assert.equal(
    shouldPersistProgressUpdate({
      lastSavedAtMs: 1000,
      lastSavedPercent: 10,
      nowMs: 3000,
      nextPercent: 11,
      eventType: 'timeupdate',
    }),
    false
  );
  assert.equal(
    shouldPersistProgressUpdate({
      lastSavedAtMs: 1000,
      lastSavedPercent: 10,
      nowMs: 12000,
      nextPercent: 11,
      eventType: 'timeupdate',
    }),
    true
  );
  assert.equal(
    shouldPersistProgressUpdate({
      lastSavedAtMs: 1000,
      lastSavedPercent: 10,
      nowMs: 1500,
      nextPercent: 10.2,
      eventType: 'pause',
    }),
    true
  );
});
