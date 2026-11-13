import { calculateProgressPercent, clampNumber, isPlaybackCompleted } from './watchProgress';

export type PlayerEventName = 'play' | 'pause' | 'seeked' | 'ended' | 'timeupdate';

export interface ValidatedPlayerEvent {
  type: PlayerEventName;
  currentTime: number;
  duration: number;
  progressPercent: number;
  completed: boolean;
  season?: number;
  episode?: number;
}

export const ALLOWED_PLAYER_ORIGINS: ReadonlySet<string> = new Set([
  'https://vidlink.pro',
  'https://www.vidlink.pro',
]);

const VALID_EVENT_TYPES: ReadonlySet<string> = new Set([
  'play',
  'pause',
  'seeked',
  'ended',
  'timeupdate',
]);

export function isAllowedPlayerOrigin(origin: string): boolean {
  if (!origin || typeof origin !== 'string') return false;
  return ALLOWED_PLAYER_ORIGINS.has(origin.toLowerCase());
}

export function parsePlayerPostMessage(
  rawData: unknown,
  origin: string,
  sourceMatchesIframe: boolean
): ValidatedPlayerEvent | null {
  if (!sourceMatchesIframe) return null;
  if (!isAllowedPlayerOrigin(origin)) return null;

  let payload: unknown = rawData;
  if (typeof rawData === 'string') {
    try {
      payload = JSON.parse(rawData);
    } catch {
      return null;
    }
  }

  if (!payload || typeof payload !== 'object') return null;
  const record = payload as Record<string, unknown>;

  // VidLink & standard postMessage adapters may wrap event in { type, data } or emit flat fields
  const inner =
    record.data && typeof record.data === 'object'
      ? (record.data as Record<string, unknown>)
      : record;

  const rawEvent =
    typeof record.event === 'string'
      ? record.event
      : typeof record.type === 'string'
        ? record.type
        : typeof inner.event === 'string'
          ? inner.event
          : null;

  if (!rawEvent) return null;
  const normalizedType = rawEvent.toLowerCase().replace(/^media_/, '');
  if (!VALID_EVENT_TYPES.has(normalizedType)) return null;

  const rawCurrentTime = Number(inner.currentTime ?? inner.time ?? 0);
  const rawDuration = Number(inner.duration ?? 0);

  if (!Number.isFinite(rawCurrentTime) || rawCurrentTime < 0) return null;
  if (!Number.isFinite(rawDuration) || rawDuration < 0) return null;

  const duration = Math.max(0, rawDuration);
  const currentTime = duration > 0 ? clampNumber(rawCurrentTime, 0, duration) : rawCurrentTime;
  const progressPercent =
    normalizedType === 'ended' ? 100 : calculateProgressPercent(currentTime, duration);
  const completed = isPlaybackCompleted(progressPercent, normalizedType);

  const season =
    typeof inner.season === 'number' && Number.isInteger(inner.season) && inner.season > 0
      ? inner.season
      : undefined;
  const episode =
    typeof inner.episode === 'number' && Number.isInteger(inner.episode) && inner.episode > 0
      ? inner.episode
      : undefined;

  return {
    type: normalizedType as PlayerEventName,
    currentTime,
    duration,
    progressPercent,
    completed,
    season,
    episode,
  };
}

export interface ThrottleCheckInput {
  lastSavedAtMs: number;
  lastSavedPercent: number;
  nowMs: number;
  nextPercent: number;
  eventType: PlayerEventName;
  minIntervalMs?: number;
}

export function shouldPersistProgressUpdate(input: ThrottleCheckInput): boolean {
  const minInterval = input.minIntervalMs ?? 10_000;
  if (
    input.eventType === 'pause' ||
    input.eventType === 'seeked' ||
    input.eventType === 'ended'
  ) {
    return true;
  }
  const elapsed = input.nowMs - input.lastSavedAtMs;
  const delta = Math.abs(input.nextPercent - input.lastSavedPercent);
  return elapsed >= minInterval || delta >= 5;
}
