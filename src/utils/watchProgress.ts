import type { HistoryItem, WatchProgressItem, WatchlistItem } from '../types/media';

export function clampNumber(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

export function calculateProgressPercent(currentTime: number, duration: number): number {
  if (!Number.isFinite(currentTime) || !Number.isFinite(duration) || duration <= 0) {
    return 0;
  }
  const raw = (currentTime / duration) * 100;
  return Math.round(clampNumber(raw, 0, 100) * 10) / 10;
}

export function isPlaybackCompleted(progressPercent: number, eventType?: string): boolean {
  if (eventType === 'ended') return true;
  return progressPercent >= 90;
}

export function formatPlaybackTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const total = Math.floor(seconds);
  const hours = Math.floor(total / 3600);
  const mins = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  const paddedSecs = String(secs).padStart(2, '0');
  if (hours > 0) {
    return `${hours}:${String(mins).padStart(2, '0')}:${paddedSecs}`;
  }
  return `${mins}:${paddedSecs}`;
}

export function createCanonicalMediaId(
  mediaType: 'movie' | 'tv' | 'anime',
  id: string | number
): string {
  const clean = String(id).replace(/[^a-zA-Z0-9_-]/g, '');
  if (clean.startsWith(`${mediaType}_`)) return clean;
  return `${mediaType}_${clean}`;
}

export function mergeWatchlistItems(
  remote: WatchlistItem[],
  guest: WatchlistItem[],
  uid: string
): WatchlistItem[] {
  const map = new Map<string, WatchlistItem>();
  for (const item of remote) {
    map.set(item.mediaId, { ...item, uid });
  }
  for (const item of guest) {
    const existing = map.get(item.mediaId);
    if (!existing || item.addedAtMs > existing.addedAtMs) {
      map.set(item.mediaId, { ...item, uid });
    }
  }
  return Array.from(map.values()).sort((a, b) => b.addedAtMs - a.addedAtMs);
}

export function mergeWatchProgressItems(
  remote: WatchProgressItem[],
  guest: WatchProgressItem[],
  uid: string
): WatchProgressItem[] {
  const map = new Map<string, WatchProgressItem>();
  for (const item of remote) {
    map.set(item.mediaId, { ...item, uid });
  }
  for (const item of guest) {
    const existing = map.get(item.mediaId);
    if (!existing || item.updatedAtMs > existing.updatedAtMs) {
      map.set(item.mediaId, { ...item, uid });
    }
  }
  return Array.from(map.values()).sort((a, b) => b.updatedAtMs - a.updatedAtMs);
}

export function mergeHistoryItems(
  remote: HistoryItem[],
  guest: HistoryItem[],
  uid: string
): HistoryItem[] {
  const map = new Map<string, HistoryItem>();
  for (const item of remote) {
    map.set(item.historyId, { ...item, uid });
  }
  for (const item of guest) {
    const existing = map.get(item.historyId);
    if (!existing || item.watchedAtMs > existing.watchedAtMs) {
      map.set(item.historyId, { ...item, uid });
    }
  }
  return Array.from(map.values()).sort((a, b) => b.watchedAtMs - a.watchedAtMs);
}

export function formatRuntime(minutes: number | null | undefined): string {
  if (!minutes || !Number.isFinite(minutes) || minutes <= 0) return '';
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hrs === 0) return `${mins}m`;
  if (mins === 0) return `${hrs}h`;
  return `${hrs}h ${mins}m`;
}
