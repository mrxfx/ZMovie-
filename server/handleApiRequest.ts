import type { IncomingMessage, ServerResponse } from 'node:http';
import {
  createTmdbRequestToken,
  createTmdbSession,
  fetchTmdbAccountWatchlist,
  fetchTmdbCatalogSyncBatch,
  fetchTmdbCategory,
  fetchTmdbDetails,
  fetchTmdbGenres,
  fetchTmdbSeasonEpisodes,
  isTmdbConfigured,
  searchTmdbMedia,
  toggleTmdbAccountWatchlist,
} from './tmdb.js';
import {
  fetchAnimeCatalogSyncBatch,
  fetchAnimeDetails,
  fetchAnimeGenres,
  fetchAnimeList,
  fetchJikanUserAnimeFavorites,
  fetchRandomAnime,
} from './anime.js';
import type { HomeCatalogResponse } from '../src/types/media.js';

const TV_CATEGORIES = new Set([
  'trending',
  'popular',
  'top_rated',
  'airing_today',
  'on_the_air',
  'discover',
]);

function sendJson(res: ServerResponse, statusCode: number, data: unknown): void {
  const body = JSON.stringify(data);
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(body);
}

function sendText(res: ServerResponse, statusCode: number, contentType: string, body: string): void {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', `${contentType}; charset=utf-8`);
  res.end(body);
}

function getQueryParam(searchParams: URLSearchParams, key: string): string | undefined {
  const value = searchParams.get(key);
  return value !== null && value !== '' ? value : undefined;
}

async function readJsonBody<T extends Record<string, unknown>>(req: IncomingMessage): Promise<T> {
  const chunks: Buffer[] = [];
  let total = 0;
  for await (const chunk of req) {
    const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    total += buf.length;
    if (total > 32 * 1024) {
      throw new Error('Request payload too large');
    }
    chunks.push(buf);
  }
  const raw = Buffer.concat(chunks).toString('utf8').trim();
  if (!raw) return {} as T;
  return JSON.parse(raw) as T;
}

function getRequestBaseUrl(req: IncomingMessage, url: URL): string {
  if (process.env.APP_URL) return process.env.APP_URL;
  const protoHeader = req.headers['x-forwarded-proto'];
  const proto = Array.isArray(protoHeader) ? protoHeader[0] : protoHeader || 'https';
  const hostHeader = req.headers['x-forwarded-host'] || req.headers.host;
  const host = Array.isArray(hostHeader) ? hostHeader[0] : hostHeader || url.host || 'localhost:3000';
  return `${proto}://${host}`;
}

export async function handleApiRequest(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
  const rawUrl = req.url || '/';
  const url = new URL(rawUrl, 'http://localhost');
  const pathname = url.pathname;
  const params = url.searchParams;

  // SEO endpoints
  if (pathname === '/robots.txt') {
    const baseUrl = getRequestBaseUrl(req, url);
    sendText(
      res,
      200,
      'text/plain',
      `User-agent: *\nAllow: /\nDisallow: /profile\nDisallow: /settings\nSitemap: ${baseUrl}/sitemap.xml\n`
    );
    return true;
  }

  if (pathname === '/sitemap.xml') {
    const baseUrl = getRequestBaseUrl(req, url);
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

    sendText(
      res,
      200,
      'application/xml',
      `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`
    );
    return true;
  }

  if (!pathname.startsWith('/api')) {
    return false;
  }

  // Health & Integration Status
  if (pathname === '/api/status') {
    sendJson(res, 200, {
      ok: true,
      tmdbConfigured: isTmdbConfigured(),
      animeProvider: 'jikan-v4',
      streamingProvider: 'vidlink',
      timestamp: new Date().toISOString(),
    });
    return true;
  }

  // Aggregated Home Catalog
  if (pathname === '/api/home') {
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
      sendJson(res, 200, payload);
    } catch (error) {
      sendJson(res, 500, {
        error: error instanceof Error ? error.message : 'Failed to load home catalog',
      });
    }
    return true;
  }

  // Genres: /api/genres/:type
  const genresMatch = pathname.match(/^\/api\/genres\/([^/]+)$/);
  if (genresMatch) {
    const type = decodeURIComponent(genresMatch[1]);
    if (type === 'anime') {
      const genres = await fetchAnimeGenres();
      sendJson(res, 200, { genres, source: 'jikan' });
      return true;
    }
    if (type !== 'movie' && type !== 'tv') {
      sendJson(res, 400, { error: 'Invalid media type for genres.' });
      return true;
    }
    const result = await fetchTmdbGenres(type);
    sendJson(res, 200, result);
    return true;
  }

  // Movies list: /api/movies/:category
  const moviesListMatch = pathname.match(/^\/api\/movies\/([^/]+)$/);
  if (moviesListMatch) {
    const category = decodeURIComponent(moviesListMatch[1]);
    const pageNum = Number(getQueryParam(params, 'page') || '1');
    const result = await fetchTmdbCategory('movie', category, {
      genreId: getQueryParam(params, 'genre'),
      year: getQueryParam(params, 'year'),
      language: getQueryParam(params, 'language'),
      minRating: getQueryParam(params, 'minRating'),
      sortBy: getQueryParam(params, 'sortBy'),
      page: Number.isFinite(pageNum) && pageNum > 0 ? pageNum : 1,
    });
    sendJson(res, 200, result);
    return true;
  }

  // TV Season Episodes: /api/tv/:id/season/:seasonNumber
  const tvSeasonMatch = pathname.match(/^\/api\/tv\/([^/]+)\/season\/([^/]+)$/);
  if (tvSeasonMatch) {
    const rawId = decodeURIComponent(tvSeasonMatch[1]);
    const tmdbId = Number(rawId.replace(/^tv_/, ''));
    const seasonNumber = Number(decodeURIComponent(tvSeasonMatch[2]));
    if (!Number.isInteger(tmdbId) || tmdbId <= 0 || !Number.isInteger(seasonNumber) || seasonNumber < 0) {
      sendJson(res, 400, { error: 'Invalid TV ID or season number' });
      return true;
    }
    const episodes = await fetchTmdbSeasonEpisodes(tmdbId, seasonNumber);
    sendJson(res, 200, { episodes });
    return true;
  }

  // TV category OR TV details: /api/tv/:param
  const tvMatch = pathname.match(/^\/api\/tv\/([^/]+)$/);
  if (tvMatch) {
    const segment = decodeURIComponent(tvMatch[1]);
    if (TV_CATEGORIES.has(segment)) {
      const pageNum = Number(getQueryParam(params, 'page') || '1');
      const result = await fetchTmdbCategory('tv', segment, {
        genreId: getQueryParam(params, 'genre'),
        year: getQueryParam(params, 'year'),
        language: getQueryParam(params, 'language'),
        minRating: getQueryParam(params, 'minRating'),
        sortBy: getQueryParam(params, 'sortBy'),
        page: Number.isFinite(pageNum) && pageNum > 0 ? pageNum : 1,
      });
      sendJson(res, 200, result);
      return true;
    }

    const result = await fetchTmdbDetails('tv', segment);
    if (!result.details) {
      sendJson(res, 404, { error: result.notice || 'TV series not found' });
      return true;
    }
    sendJson(res, 200, result);
    return true;
  }

  // Movie details: /api/movie/:id
  const movieDetailMatch = pathname.match(/^\/api\/movie\/([^/]+)$/);
  if (movieDetailMatch) {
    const result = await fetchTmdbDetails('movie', decodeURIComponent(movieDetailMatch[1]));
    if (!result.details) {
      sendJson(res, 404, { error: result.notice || 'Movie not found' });
      return true;
    }
    sendJson(res, 200, result);
    return true;
  }

  // Anime list: /api/anime/list
  if (pathname === '/api/anime/list') {
    const category = getQueryParam(params, 'category') || 'popular';
    const pageNum = Number(getQueryParam(params, 'page') || '1');
    const result = await fetchAnimeList(category, {
      query: getQueryParam(params, 'q'),
      genreId: getQueryParam(params, 'genre'),
      year: getQueryParam(params, 'year'),
      minRating: getQueryParam(params, 'minRating'),
      sortBy: getQueryParam(params, 'sortBy'),
      page: Number.isFinite(pageNum) && pageNum > 0 ? pageNum : 1,
    });
    sendJson(res, 200, result);
    return true;
  }

  // Anime Catalog Sync Batch: /api/anime/sync
  if (pathname === '/api/anime/sync') {
    const category = getQueryParam(params, 'category') || 'trending';
    const rawLimit = Number(getQueryParam(params, 'limit') || '10');
    const result = await fetchAnimeCatalogSyncBatch(category, rawLimit);
    sendJson(res, 200, result);
    return true;
  }

  // Random Anime Discovery: /api/anime/random
  if (pathname === '/api/anime/random') {
    const result = await fetchRandomAnime();
    sendJson(res, 200, result);
    return true;
  }

  // Public MyAnimeList User Favorites (Read-Only via Jikan): /api/jikan/user/:username/favorites
  const jikanUserFavMatch = pathname.match(/^\/api\/jikan\/user\/([^/]+)\/favorites$/);
  if (jikanUserFavMatch) {
    const username = decodeURIComponent(jikanUserFavMatch[1]);
    const result = await fetchJikanUserAnimeFavorites(username);
    sendJson(res, 200, result);
    return true;
  }

  // Anime details: /api/anime/:malId
  const animeDetailMatch = pathname.match(/^\/api\/anime\/([^/]+)$/);
  if (animeDetailMatch) {
    const result = await fetchAnimeDetails(decodeURIComponent(animeDetailMatch[1]));
    if (!result.details) {
      sendJson(res, 404, { error: result.notice || 'Anime not found' });
      return true;
    }
    sendJson(res, 200, result);
    return true;
  }

  // Global Multi-Search: /api/search
  if (pathname === '/api/search') {
    const q = params.get('q') || '';
    const type = getQueryParam(params, 'type') || 'all';
    const rawPage = Number(getQueryParam(params, 'page') || '1');
    const page = Number.isFinite(rawPage) && rawPage > 0 ? Math.max(1, rawPage) : 1;

    if (!q.trim()) {
      sendJson(res, 200, {
        items: [],
        page: 1,
        totalPages: 1,
        totalResults: 0,
        source: 'tmdb',
        configured: isTmdbConfigured(),
      });
      return true;
    }

    if (type === 'anime') {
      const animeRes = await fetchAnimeList('discover', { query: q, page });
      sendJson(res, 200, animeRes);
      return true;
    }

    if (type === 'movie' || type === 'tv') {
      const tmdbRes = await searchTmdbMedia(q, type, page);
      sendJson(res, 200, tmdbRes);
      return true;
    }

    const [tmdbRes, animeRes] = await Promise.all([
      searchTmdbMedia(q, 'all', page),
      fetchAnimeList('discover', { query: q, page: 1 }),
    ]);

    const combined = [...tmdbRes.items, ...animeRes.items.slice(0, 6)];
    sendJson(res, 200, {
      items: combined,
      page,
      totalPages: tmdbRes.totalPages,
      totalResults: tmdbRes.totalResults + animeRes.items.length,
      source: tmdbRes.source,
      configured: tmdbRes.configured,
      notice: tmdbRes.notice || animeRes.notice,
    });
    return true;
  }

  // TMDB Catalog Sync Batch: /api/tmdb/sync
  if (pathname === '/api/tmdb/sync') {
    const typeParam = getQueryParam(params, 'type') === 'tv' ? 'tv' : 'movie';
    const category = getQueryParam(params, 'category') || 'trending';
    const rawLimit = Number(getQueryParam(params, 'limit') || '10');
    const result = await fetchTmdbCatalogSyncBatch(typeParam, category, rawLimit);
    sendJson(res, 200, result);
    return true;
  }

  // TMDB Authentication: POST /api/tmdb/auth/token
  if (pathname === '/api/tmdb/auth/token' && req.method === 'POST') {
    const result = await createTmdbRequestToken();
    sendJson(res, 200, result);
    return true;
  }

  // TMDB Authentication: POST /api/tmdb/auth/session
  if (pathname === '/api/tmdb/auth/session' && req.method === 'POST') {
    try {
      const body = await readJsonBody<{ requestToken?: string }>(req);
      const result = await createTmdbSession(String(body.requestToken || ''));
      sendJson(res, 200, result);
    } catch (error) {
      sendJson(res, 400, {
        configured: isTmdbConfigured(),
        notice: error instanceof Error ? error.message : 'Invalid request body',
      });
    }
    return true;
  }

  // TMDB Account Watchlist Sync: GET & POST /api/tmdb/account/watchlist
  if (pathname === '/api/tmdb/account/watchlist') {
    const sessionHeader = req.headers['x-tmdb-session'];
    const sessionId = Array.isArray(sessionHeader) ? sessionHeader[0] : sessionHeader || '';
    if (!sessionId.trim()) {
      sendJson(res, 401, {
        configured: isTmdbConfigured(),
        items: [],
        success: false,
        notice: 'TMDB session header missing. Connect your TMDB account first.',
      });
      return true;
    }

    if (req.method === 'POST') {
      try {
        const body = await readJsonBody<{
          accountId?: number;
          mediaType?: 'movie' | 'tv';
          tmdbId?: number;
          watchlist?: boolean;
        }>(req);
        const accountId = Number(body.accountId);
        const tmdbId = Number(body.tmdbId);
        const mediaType = body.mediaType === 'tv' ? 'tv' : 'movie';
        if (!Number.isInteger(accountId) || accountId <= 0 || !Number.isInteger(tmdbId) || tmdbId <= 0) {
          sendJson(res, 400, {
            configured: isTmdbConfigured(),
            success: false,
            notice: 'Valid accountId and tmdbId are required.',
          });
          return true;
        }
        const result = await toggleTmdbAccountWatchlist(
          sessionId.trim(),
          accountId,
          mediaType,
          tmdbId,
          body.watchlist !== false
        );
        sendJson(res, 200, result);
      } catch (error) {
        sendJson(res, 400, {
          configured: isTmdbConfigured(),
          success: false,
          notice: error instanceof Error ? error.message : 'Invalid JSON payload',
        });
      }
      return true;
    }

    const accountId = Number(getQueryParam(params, 'accountId') || '0');
    if (!Number.isInteger(accountId) || accountId <= 0) {
      sendJson(res, 400, {
        configured: isTmdbConfigured(),
        items: [],
        notice: 'Valid TMDB accountId query parameter is required.',
      });
      return true;
    }
    const result = await fetchTmdbAccountWatchlist(sessionId.trim(), accountId);
    sendJson(res, 200, result);
    return true;
  }

  sendJson(res, 404, { error: 'API route not found' });
  return true;
}
