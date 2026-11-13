import type { AdminCatalogInput } from '../context/AdminCatalogContext';
import type { AdminCatalogItem, MediaDetails, MediaSummary, WatchlistItem } from '../types/media';
import { createCanonicalMediaId } from './watchProgress';

function sanitizeTitle(value: string): string {
  return value.trim().slice(0, 200) || 'Untitled';
}

function sanitizeOverview(value: string): string {
  return value.trim().slice(0, 4000) || 'Synopsis unavailable.';
}

function sanitizeYear(value: string): string {
  const clean = value.trim().slice(0, 10);
  return clean || 'TBA';
}

function clampVoteAverage(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round(Math.min(10, Math.max(0, value)) * 10) / 10;
}

export function mapMediaDetailsToCatalogInput(
  details: MediaDetails,
  options: { featured?: boolean } = {}
): AdminCatalogInput {
  const mediaType = details.mediaType === 'tv' ? 'tv' : details.mediaType === 'anime' ? 'anime' : 'movie';
  const genres = (details.genres || [])
    .map((g) => g.trim().slice(0, 32))
    .filter(Boolean)
    .slice(0, 10);

  const rawEpisodeTotal = details.numberOfEpisodes ?? details.episodeCount;

  return {
    mediaType,
    title: sanitizeTitle(details.title),
    overview: sanitizeOverview(details.overview),
    posterPath: (details.posterPath || '').trim().slice(0, 400_000),
    backdropPath: (details.backdropPath || details.posterPath || '').trim().slice(0, 400_000),
    releaseYear: sanitizeYear(details.releaseYear || ''),
    voteAverage: clampVoteAverage(details.voteAverage),
    runtime:
      typeof details.runtime === 'number' && Number.isFinite(details.runtime) && details.runtime > 0
        ? Math.round(details.runtime)
        : undefined,
    originalLanguage: (details.originalLanguage || (mediaType === 'anime' ? 'ja' : 'en')).trim().slice(0, 16) || 'en',
    genres,
    tmdbId:
      mediaType !== 'anime' && typeof details.tmdbId === 'number' && Number.isInteger(details.tmdbId) && details.tmdbId > 0
        ? details.tmdbId
        : undefined,
    malId:
      mediaType === 'anime' && typeof details.malId === 'number' && Number.isInteger(details.malId) && details.malId > 0
        ? details.malId
        : undefined,
    seasonCount:
      mediaType === 'tv' && typeof details.numberOfSeasons === 'number' && details.numberOfSeasons > 0
        ? Math.min(50, Math.round(details.numberOfSeasons))
        : mediaType === 'tv'
          ? 1
          : undefined,
    episodeCount:
      mediaType === 'tv' || mediaType === 'anime'
        ? typeof rawEpisodeTotal === 'number' && rawEpisodeTotal > 0
          ? Math.min(500, Math.round(rawEpisodeTotal))
          : 12
        : undefined,
    featured: Boolean(options.featured),
  };
}

export interface CatalogSyncPlan {
  toCreate: AdminCatalogInput[];
  toUpdate: Array<{ itemId: string; input: AdminCatalogInput }>;
  skipped: number;
}

export function planCatalogSync(
  candidates: AdminCatalogInput[],
  existingItems: AdminCatalogItem[],
  options: { updateExisting?: boolean } = {}
): CatalogSyncPlan {
  const updateExisting = options.updateExisting ?? true;
  const toCreate: AdminCatalogInput[] = [];
  const toUpdate: Array<{ itemId: string; input: AdminCatalogInput }> = [];
  let skipped = 0;

  const seenKeys = new Set<string>();

  for (const candidate of candidates) {
    const dedupeKey =
      candidate.mediaType === 'anime' && candidate.malId
        ? `anime:mal:${candidate.malId}`
        : candidate.tmdbId && candidate.mediaType !== 'anime'
          ? `${candidate.mediaType}:tmdb:${candidate.tmdbId}`
          : `${candidate.mediaType}:title:${candidate.title.toLowerCase()}:${candidate.releaseYear}`;

    if (seenKeys.has(dedupeKey)) {
      skipped += 1;
      continue;
    }
    seenKeys.add(dedupeKey);

    const existing = existingItems.find((item) => {
      if (item.mediaType !== candidate.mediaType) return false;
      if (candidate.mediaType === 'anime' && candidate.malId && item.malId === candidate.malId) {
        return true;
      }
      if (candidate.mediaType !== 'anime' && candidate.tmdbId && item.tmdbId === candidate.tmdbId) {
        return true;
      }
      return (
        item.title.trim().toLowerCase() === candidate.title.trim().toLowerCase() &&
        item.releaseYear.trim() === candidate.releaseYear.trim()
      );
    });

    if (!existing) {
      toCreate.push(candidate);
      continue;
    }

    if (!updateExisting) {
      skipped += 1;
      continue;
    }

    toUpdate.push({
      itemId: existing.itemId,
      input: {
        ...candidate,
        featured: existing.featured || candidate.featured,
      },
    });
  }

  return { toCreate, toUpdate, skipped };
}

export function filterNewTmdbWatchlistItems(
  tmdbItems: MediaSummary[],
  currentWatchlist: WatchlistItem[]
): MediaSummary[] {
  const existingKeys = new Set<string>();
  for (const item of currentWatchlist) {
    existingKeys.add(item.mediaId);
    if (item.tmdbId && item.mediaType !== 'anime') {
      existingKeys.add(`${item.mediaType}:tmdb:${item.tmdbId}`);
    }
    if (item.malId && item.mediaType === 'anime') {
      existingKeys.add(`anime:mal:${item.malId}`);
    }
  }

  const additions: MediaSummary[] = [];
  const seen = new Set<string>();

  for (const item of tmdbItems) {
    if (item.mediaType !== 'movie' && item.mediaType !== 'tv' && item.mediaType !== 'anime') {
      continue;
    }
    const canonicalId = createCanonicalMediaId(item.mediaType, item.id);
    const externalKey =
      item.mediaType === 'anime' && item.malId
        ? `anime:mal:${item.malId}`
        : item.tmdbId
          ? `${item.mediaType}:tmdb:${item.tmdbId}`
          : canonicalId;
    if (existingKeys.has(canonicalId) || existingKeys.has(externalKey) || seen.has(externalKey)) {
      continue;
    }
    seen.add(externalKey);
    additions.push(item);
  }

  return additions;
}
