import test from 'node:test';
import assert from 'node:assert/strict';
import {
  filterNewTmdbWatchlistItems,
  mapMediaDetailsToCatalogInput,
  planCatalogSync,
} from './tmdbSync';
import type { AdminCatalogItem, MediaDetails, MediaSummary, WatchlistItem } from '../types/media';

test('mapMediaDetailsToCatalogInput clamps ratings, limits genres, and extracts season/episode counts', () => {
  const details: MediaDetails = {
    id: 'tv_94605',
    mediaType: 'tv',
    tmdbId: 94605,
    title: 'Arcane',
    overview: 'Amid the stark discord of twin cities Piltover and Zaun.',
    posterPath: 'https://image.tmdb.org/t/p/w500/poster.jpg',
    backdropPath: 'https://image.tmdb.org/t/p/w1280/backdrop.jpg',
    releaseYear: '2021',
    releaseDate: '2021-11-06',
    voteAverage: 12.4,
    voteCount: 4000,
    popularity: 95,
    originalLanguage: 'en',
    genreIds: [16, 10765],
    genres: Array.from({ length: 14 }, (_, idx) => `Genre ${idx + 1}`),
    runtime: 41.6,
    numberOfSeasons: 2,
    numberOfEpisodes: 18,
    credits: [],
    videos: [],
    similar: [],
    recommendations: [],
    source: 'tmdb',
  };

  const mapped = mapMediaDetailsToCatalogInput(details, { featured: true });
  assert.equal(mapped.mediaType, 'tv');
  assert.equal(mapped.tmdbId, 94605);
  assert.equal(mapped.voteAverage, 10);
  assert.equal(mapped.runtime, 42);
  assert.equal(mapped.genres.length, 10);
  assert.equal(mapped.seasonCount, 2);
  assert.equal(mapped.episodeCount, 18);
  assert.equal(mapped.featured, true);
});

test('planCatalogSync separates new creates, existing updates by tmdbId, and skips duplicates', () => {
  const existing: AdminCatalogItem[] = [
    {
      itemId: 'm123abc',
      mediaType: 'movie',
      title: 'Dune: Part Two',
      overview: 'Old overview',
      posterPath: '',
      backdropPath: '',
      releaseYear: '2024',
      voteAverage: 8.1,
      originalLanguage: 'en',
      genres: ['Sci-Fi'],
      tmdbId: 693134,
      featured: true,
      createdBy: 'uid1',
      createdAtMs: 1000,
      updatedAtMs: 1000,
    },
  ];

  const duneInput = mapMediaDetailsToCatalogInput({
    id: 'movie_693134',
    mediaType: 'movie',
    tmdbId: 693134,
    title: 'Dune: Part Two',
    overview: 'Updated TMDB overview',
    posterPath: 'https://image.tmdb.org/t/p/w500/dune.jpg',
    backdropPath: null,
    releaseYear: '2024',
    releaseDate: '2024-02-27',
    voteAverage: 8.3,
    voteCount: 5000,
    popularity: 200,
    originalLanguage: 'en',
    genreIds: [],
    genres: ['Science Fiction', 'Adventure'],
    credits: [],
    videos: [],
    similar: [],
    recommendations: [],
    source: 'tmdb',
  });

  const newInput = mapMediaDetailsToCatalogInput({
    id: 'movie_533535',
    mediaType: 'movie',
    tmdbId: 533535,
    title: 'Deadpool & Wolverine',
    overview: 'Multiverse team-up.',
    posterPath: null,
    backdropPath: null,
    releaseYear: '2024',
    releaseDate: '2024-07-24',
    voteAverage: 7.7,
    voteCount: 3000,
    popularity: 180,
    originalLanguage: 'en',
    genreIds: [],
    genres: ['Action', 'Comedy'],
    credits: [],
    videos: [],
    similar: [],
    recommendations: [],
    source: 'tmdb',
  });

  const plan = planCatalogSync([duneInput, duneInput, newInput], existing, { updateExisting: true });
  assert.equal(plan.toCreate.length, 1);
  assert.equal(plan.toCreate[0].tmdbId, 533535);
  assert.equal(plan.toUpdate.length, 1);
  assert.equal(plan.toUpdate[0].itemId, 'm123abc');
  assert.equal(plan.toUpdate[0].input.featured, true);
  assert.equal(plan.skipped, 1);
});

test('filterNewTmdbWatchlistItems excludes duplicates already present in My List', () => {
  const existingWatchlist: WatchlistItem[] = [
    {
      uid: 'u1',
      mediaId: 'movie_693134',
      mediaType: 'movie',
      title: 'Dune: Part Two',
      posterPath: '',
      releaseYear: '2024',
      voteAverage: 8.3,
      tmdbId: 693134,
      addedAtMs: 1000,
    },
  ];

  const tmdbItems: MediaSummary[] = [
    {
      id: 'movie_693134',
      mediaType: 'movie',
      tmdbId: 693134,
      title: 'Dune: Part Two',
      overview: '',
      posterPath: null,
      backdropPath: null,
      releaseYear: '2024',
      releaseDate: '',
      voteAverage: 8.3,
      voteCount: 0,
      popularity: 0,
      originalLanguage: 'en',
      genreIds: [],
      genres: [],
      source: 'tmdb',
    },
    {
      id: 'tv_94605',
      mediaType: 'tv',
      tmdbId: 94605,
      title: 'Arcane',
      overview: '',
      posterPath: null,
      backdropPath: null,
      releaseYear: '2021',
      releaseDate: '',
      voteAverage: 8.8,
      voteCount: 0,
      popularity: 0,
      originalLanguage: 'en',
      genreIds: [],
      genres: [],
      source: 'tmdb',
    },
  ];

  const additions = filterNewTmdbWatchlistItems(tmdbItems, existingWatchlist);
  assert.equal(additions.length, 1);
  assert.equal(additions[0].tmdbId, 94605);
});

test('planCatalogSync and filterNewTmdbWatchlistItems deduplicate Jikan anime by malId', () => {
  const animeDetails: MediaDetails = {
    id: 'anime_52991',
    mediaType: 'anime',
    malId: 52991,
    title: 'Sousou no Frieren',
    overview: 'An elven mage reflects after the hero party finishes its quest.',
    posterPath: 'https://cdn.myanimelist.net/images/anime/1015/138006l.jpg',
    backdropPath: null,
    releaseYear: '2023',
    releaseDate: '2023-09-29',
    voteAverage: 9.3,
    voteCount: 500000,
    popularity: 800000,
    originalLanguage: 'ja',
    genreIds: [2, 8, 10],
    genres: ['Adventure', 'Drama', 'Fantasy'],
    episodeCount: 28,
    credits: [],
    videos: [],
    similar: [],
    recommendations: [],
    source: 'jikan',
  };

  const mapped = mapMediaDetailsToCatalogInput(animeDetails);
  assert.equal(mapped.mediaType, 'anime');
  assert.equal(mapped.malId, 52991);
  assert.equal(mapped.tmdbId, undefined);
  assert.equal(mapped.episodeCount, 28);
  assert.equal(mapped.originalLanguage, 'ja');

  const existingAnime: AdminCatalogItem[] = [
    {
      itemId: 'a52991x',
      mediaType: 'anime',
      title: 'Frieren: Beyond Journey’s End',
      overview: 'Old overview',
      posterPath: '',
      backdropPath: '',
      releaseYear: '2023',
      voteAverage: 9.1,
      originalLanguage: 'ja',
      genres: ['Fantasy'],
      malId: 52991,
      featured: true,
      createdBy: 'uid1',
      createdAtMs: 1000,
      updatedAtMs: 1000,
    },
  ];

  const plan = planCatalogSync([mapped, mapped], existingAnime, { updateExisting: true });
  assert.equal(plan.toCreate.length, 0);
  assert.equal(plan.toUpdate.length, 1);
  assert.equal(plan.toUpdate[0].itemId, 'a52991x');
  assert.equal(plan.toUpdate[0].input.featured, true);
  assert.equal(plan.skipped, 1);

  const existingWatchlist: WatchlistItem[] = [
    {
      uid: 'u1',
      mediaId: 'anime_52991',
      mediaType: 'anime',
      title: 'Frieren',
      posterPath: '',
      releaseYear: '2023',
      voteAverage: 9.3,
      malId: 52991,
      addedAtMs: 1000,
    },
  ];

  const newWatchlist = filterNewTmdbWatchlistItems(
    [
      animeDetails,
      {
        ...animeDetails,
        id: 'anime_5114',
        malId: 5114,
        title: 'Fullmetal Alchemist: Brotherhood',
      },
    ],
    existingWatchlist
  );
  assert.equal(newWatchlist.length, 1);
  assert.equal(newWatchlist[0].malId, 5114);
});
