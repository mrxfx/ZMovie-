import express from 'express';
import dotenv from 'dotenv';
import {
  fetchTmdbCategory,
  fetchTmdbDetails,
  fetchTmdbGenres,
  fetchTmdbSeasonEpisodes,
  isTmdbConfigured,
  searchTmdbMedia,
} from './tmdb';
import { fetchAnimeDetails, fetchAnimeList, getAnimeGenres } from './anime';
import type { HomeCatalogResponse } from '../src/types/media';

dotenv.config();

export function createApiApp(): express.Express {
  const app = express();

  app.use(express.json());

  // Health & Integration Status (never exposes secrets)
  app.get('/api/status', (_req, res) => {
    res.json({
      ok: true,
      tmdbConfigured: isTmdbConfigured(),
      animeProvider: 'jikan-v4',
      streamingProvider: 'vidlink',
      timestamp: new Date().toISOString(),
    });
  });

  // Aggregated Home Catalog
  app.get('/api/home', async (_req, res) => {
    try {
      const [trendingM, popularM, topRatedM, upcomingM, popularT, trendingA] = await Promise.all([
        fetchTmdbCategory('movie', 'trending'),
        fetchTmdbCategory('movie', 'popular'),
        fetchTmdbCategory('movie', 'top_rated'),
        fetchTmdbCategory('movie', 'upcoming'),
        fetchTmdbCategory('tv', 'popular'),
        fetchAnimeList('trending'),
      ]);

      const featured =
        trendingM.items[0] ||
        popularM.items[0] ||
        popularT.items[0] ||
        trendingA.items[0] ||
        null;
      const recommended = [
        ...topRatedM.items.slice(0, 4),
        ...popularT.items.slice(0, 3),
        ...trendingA.items.slice(0, 3),
      ];

      const payload: HomeCatalogResponse = {
        featured,
        trendingMovies: trendingM.items,
        popularMovies: popularM.items,
        topRatedMovies: topRatedM.items,
        upcomingMovies: upcomingM.items,
        popularTv: popularT.items,
        trendingAnime: trendingA.items,
        recommended,
        tmdbConfigured: trendingM.configured,
        source: trendingM.source,
        notice: trendingM.notice || trendingA.notice,
      };
      res.json(payload);
    } catch (error) {
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to load home catalog',
      });
    }
  });

  // Genres
  app.get('/api/genres/:type', async (req, res) => {
    const type = req.params.type;
    if (type === 'anime') {
      return res.json({ genres: getAnimeGenres(), source: 'jikan' });
    }
    if (type !== 'movie' && type !== 'tv') {
      return res.status(400).json({ error: 'Invalid media type for genres.' });
    }
    const result = await fetchTmdbGenres(type);
    return res.json(result);
  });

  // Movies & TV lists / discover
  app.get('/api/movies/:category', async (req, res) => {
    const result = await fetchTmdbCategory('movie', req.params.category, {
      genreId: typeof req.query.genre === 'string' ? req.query.genre : undefined,
      year: typeof req.query.year === 'string' ? req.query.year : undefined,
      language: typeof req.query.language === 'string' ? req.query.language : undefined,
      minRating: typeof req.query.minRating === 'string' ? req.query.minRating : undefined,
      sortBy: typeof req.query.sortBy === 'string' ? req.query.sortBy : undefined,
      page: typeof req.query.page === 'string' ? Number(req.query.page) : 1,
    });
    res.json(result);
  });

  app.get('/api/tv/:category', async (req, res) => {
    const result = await fetchTmdbCategory('tv', req.params.category, {
      genreId: typeof req.query.genre === 'string' ? req.query.genre : undefined,
      year: typeof req.query.year === 'string' ? req.query.year : undefined,
      language: typeof req.query.language === 'string' ? req.query.language : undefined,
      minRating: typeof req.query.minRating === 'string' ? req.query.minRating : undefined,
      sortBy: typeof req.query.sortBy === 'string' ? req.query.sortBy : undefined,
      page: typeof req.query.page === 'string' ? Number(req.query.page) : 1,
    });
    res.json(result);
  });

  // Details
  app.get('/api/movie/:id', async (req, res) => {
    const result = await fetchTmdbDetails('movie', req.params.id);
    if (!result.details) {
      return res.status(404).json({ error: result.notice || 'Movie not found' });
    }
    return res.json(result);
  });

  app.get('/api/tv/:id', async (req, res) => {
    const result = await fetchTmdbDetails('tv', req.params.id);
    if (!result.details) {
      return res.status(404).json({ error: result.notice || 'TV series not found' });
    }
    return res.json(result);
  });

  app.get('/api/tv/:id/season/:seasonNumber', async (req, res) => {
    const tmdbId = Number(String(req.params.id).replace(/^tv_/, ''));
    const seasonNumber = Number(req.params.seasonNumber);
    if (!Number.isInteger(tmdbId) || tmdbId <= 0 || !Number.isInteger(seasonNumber) || seasonNumber < 0) {
      return res.status(400).json({ error: 'Invalid TV ID or season number' });
    }
    const episodes = await fetchTmdbSeasonEpisodes(tmdbId, seasonNumber);
    return res.json({ episodes });
  });

  // Anime
  app.get('/api/anime/list', async (req, res) => {
    const category = typeof req.query.category === 'string' ? req.query.category : 'popular';
    const result = await fetchAnimeList(category, {
      query: typeof req.query.q === 'string' ? req.query.q : undefined,
      genreId: typeof req.query.genre === 'string' ? req.query.genre : undefined,
      year: typeof req.query.year === 'string' ? req.query.year : undefined,
      minRating: typeof req.query.minRating === 'string' ? req.query.minRating : undefined,
      sortBy: typeof req.query.sortBy === 'string' ? req.query.sortBy : undefined,
      page: typeof req.query.page === 'string' ? Number(req.query.page) : 1,
    });
    res.json(result);
  });

  app.get('/api/anime/:malId', async (req, res) => {
    const result = await fetchAnimeDetails(req.params.malId);
    if (!result.details) {
      return res.status(404).json({ error: result.notice || 'Anime not found' });
    }
    return res.json(result);
  });

  // Global Multi-Search (Movies, TV, Anime)
  app.get('/api/search', async (req, res) => {
    const q = typeof req.query.q === 'string' ? req.query.q : '';
    const type = typeof req.query.type === 'string' ? req.query.type : 'all';
    const page = typeof req.query.page === 'string' ? Math.max(1, Number(req.query.page)) : 1;

    if (!q.trim()) {
      return res.json({
        items: [],
        page: 1,
        totalPages: 1,
        totalResults: 0,
        source: 'tmdb',
        configured: isTmdbConfigured(),
      });
    }

    if (type === 'anime') {
      const animeRes = await fetchAnimeList('discover', { query: q, page });
      return res.json(animeRes);
    }

    if (type === 'movie' || type === 'tv') {
      const tmdbRes = await searchTmdbMedia(q, type, page);
      return res.json(tmdbRes);
    }

    const [tmdbRes, animeRes] = await Promise.all([
      searchTmdbMedia(q, 'all', page),
      fetchAnimeList('discover', { query: q, page: 1 }),
    ]);

    const combined = [...tmdbRes.items, ...animeRes.items.slice(0, 6)];
    return res.json({
      items: combined,
      page,
      totalPages: tmdbRes.totalPages,
      totalResults: tmdbRes.totalResults + animeRes.items.length,
      source: tmdbRes.source,
      configured: tmdbRes.configured,
      notice: tmdbRes.notice || animeRes.notice,
    });
  });

  // SEO: robots.txt & dynamic sitemap.xml
  app.get('/robots.txt', (req, res) => {
    const baseUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
    res
      .type('text/plain')
      .send(
        `User-agent: *\nAllow: /\nDisallow: /profile\nDisallow: /settings\nSitemap: ${baseUrl}/sitemap.xml\n`
      );
  });

  app.get('/sitemap.xml', (req, res) => {
    const baseUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
    const staticRoutes = [
      '/',
      '/movies',
      '/tv',
      '/anime',
      '/search',
      '/my-list',
      '/continue-watching',
      '/history',
      '/about',
      '/privacy',
      '/terms',
    ];
    const urls = staticRoutes
      .map(
        (route) =>
          `  <url><loc>${baseUrl}${route}</loc><changefreq>daily</changefreq><priority>${route === '/' ? '1.0' : '0.8'}</priority></url>`
      )
      .join('\n');

    res
      .type('application/xml')
      .send(
        `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`
      );
  });

  return app;
}
