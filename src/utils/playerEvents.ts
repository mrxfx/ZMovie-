import { calculateProgressPercent, clampNumber, isPlaybackCompleted } from './watchProgress';

export type PlayerEventName = 'play' | 'pause' | 'seeked' | 'ended' | 'timeupdate';

export interface ValidatedPlayerEvent {
  type: PlayerEventName;
  currentTime: number;
  duration: number;
  progressPercent: number;
  completed: boolean;
  mtmdbId?: number;
  mediaType?: 'movie' | 'tv';
  season?: number;
  episode?: number;
}

export interface VidLinkMediaProgressEntry {
  id: number;
  type: 'movie' | 'tv';
  title: string;
  posterPath?: string;
  backdropPath?: string;
  watched: number;
  duration: number;
  progressPercent: number;
  completed: boolean;
  season?: number;
  episode?: number;
  lastUpdated?: number;
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

  // VidLink PLAYER_EVENT wraps data inside { type: "PLAYER_EVENT", data: { event, currentTime, duration, ... } }
  if (record.type === 'MEDIA_DATA') return null;

  const inner =
    record.data && typeof record.data === 'object'
      ? (record.data as Record<string, unknown>)
      : record;

  const rawEvent =
    typeof inner.event === 'string'
      ? inner.event
      : typeof record.event === 'string'
        ? record.event
        : typeof record.type === 'string'
          ? record.type
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

  const mtmdbId =
    typeof inner.mtmdbId === 'number' && Number.isInteger(inner.mtmdbId) && inner.mtmdbId > 0
      ? inner.mtmdbId
      : undefined;
  const mediaType =
    inner.mediaType === 'movie' || inner.mediaType === 'tv' ? inner.mediaType : undefined;

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
    mtmdbId,
    mediaType,
    season,
    episode,
  };
}

export function parseVidLinkMediaData(
  rawData: unknown,
  origin: string,
  sourceMatchesIframe: boolean
): { rawMap: Record<string, unknown>; entries: VidLinkMediaProgressEntry[] } | null {
  if (!sourceMatchesIframe) return null;
  if (!isAllowedPlayerOrigin(origin)) return null;
  if (!rawData || typeof rawData !== 'object') return null;

  const record = rawData as Record<string, unknown>;
  if (record.type !== 'MEDIA_DATA' || !record.data || typeof record.data !== 'object') {
    return null;
  }

  const rawMap = record.data as Record<string, unknown>;
  const entries: VidLinkMediaProgressEntry[] = [];

  for (const [key, val] of Object.entries(rawMap)) {
    if (!val || typeof val !== 'object') continue;
    const item = val as Record<string, unknown>;
    const numericId = Number(item.id ?? key);
    if (!Number.isInteger(numericId) || numericId <= 0) continue;

    const mediaType = item.type === 'tv' ? 'tv' : item.type === 'movie' ? 'movie' : null;
    if (!mediaType) continue;

    const progressObj =
      item.progress && typeof item.progress === 'object'
        ? (item.progress as Record<string, unknown>)
        : null;
    const watched = Number(progressObj?.watched ?? 0);
    const duration = Number(progressObj?.duration ?? 0);
    if (!Number.isFinite(watched) || watched < 0 || !Number.isFinite(duration) || duration < 0) {
      continue;
    }

    const progressPercent = calculateProgressPercent(watched, duration);
    const season = item.last_season_watched ? Number(item.last_season_watched) : undefined;
    const episode = item.last_episode_watched ? Number(item.last_episode_watched) : undefined;

    entries.push({
      id: numericId,
      type: mediaType,
      title: typeof item.title === 'string' && item.title.trim() ? item.title : `Title #${numericId}`,
      posterPath: typeof item.poster_path === 'string' ? item.poster_path : undefined,
      backdropPath: typeof item.backdrop_path === 'string' ? item.backdrop_path : undefined,
      watched,
      duration,
      progressPercent,
      completed: isPlaybackCompleted(progressPercent),
      season: season && Number.isInteger(season) && season > 0 ? season : undefined,
      episode: episode && Number.isInteger(episode) && episode > 0 ? episode : undefined,
      lastUpdated: typeof item.last_updated === 'number' ? item.last_updated : undefined,
    });
  }

  return { rawMap, entries };
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
