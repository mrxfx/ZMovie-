import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isAllowedPlayerOrigin,
  parsePlayerPostMessage,
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

test('parsePlayerPostMessage parses valid JSON string and nested data objects', () => {
  const parsed = parsePlayerPostMessage(
    JSON.stringify({ type: 'MEDIA_TIMEUPDATE', data: { currentTime: 300, duration: 1200 } }),
    'https://vidlink.pro',
    true
  );
  assert.ok(parsed);
  assert.equal(parsed.type, 'timeupdate');
  assert.equal(parsed.progressPercent, 25);
  assert.equal(parsed.completed, false);
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
