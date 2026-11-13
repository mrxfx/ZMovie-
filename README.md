# ZyvoMovie

ZyvoMovie is a movie, TV series, and anime discovery and streaming platform in the Zyvo Ecosystem, designed with a Pure White (`#FFFFFF`) and Zyvo Red (`#E50914`) visual identity.

## Implemented Features

- **22 Complete Routes**: Home, Movies, TV Shows, Anime, Global Search, Movie Details, TV Details, Anime Details, Watch Player, My List, Continue Watching, Watch History, Login, Register, Forgot Password, Profile, Settings, Admin Panel (`/admin`), About, Privacy Policy, Terms of Service, and Custom 404.
- **Admin Publishing Studio (`/admin`)**: Firestore-backed `/catalogItems` management for verified administrators (`rahulhaldarx15@gmail.com` or `/admins/{uid}`) to publish, edit, and delete Movies, TV Shows, and Anime with compressed poster/backdrop image uploads, studio artwork presets, Featured Hero pinning, and TMDB/MAL ID mapping.
- **Server-Side TMDB Proxy (`/api/*`)**: Reads `TMDB_READ_ACCESS_TOKEN` exclusively on the server (`server/tmdb.ts`), with TTL caching, rate-limit handling, and an explicitly labeled local development fallback catalog when unconfigured.
- **Dedicated Anime Adapter**: Uses Jikan v4 / MyAnimeList (`server/anime.ts`) so `malId` and `tmdbId` are never conflated.
- **VidLink Streaming Player Adapter**: Official VidLink Pro URL builder (`src/utils/mediaFilters.ts`) supporting Default/JW Player (`player`), `default`/`vid` icon styles (`icons`), anime Sub/Dub fallback (`?fallback=true`), resume timestamps (`startAt`), external subtitles (`sub_file` + `sub_label`), fallback redirect URLs (`fallback_url`), and origin-validated `PLAYER_EVENT` + `MEDIA_DATA` (`vidLinkProgress`) synchronization (`src/utils/playerEvents.ts`).
- **Firebase Authentication & Firestore**: Google Sign-In, Email/Password auth & password reset flows, guest-to-account sync, and strict private ownership + admin-only catalog rules (`firestore.rules`, `firebase-blueprint.json`).
- **SEO**: Dynamic page `<title>`, Open Graph, Twitter cards, canonical links, Schema.org `WebApplication` JSON-LD, `/robots.txt`, and `/sitemap.xml`.

## Setup & Environment Variables

1. Copy `.env.example` to `.env` and configure:
   - `TMDB_READ_ACCESS_TOKEN`: Server-side TMDB v4 Bearer Read Access Token (optional for local development fallback; required for live TMDB catalog).
   - `APP_URL`: Public URL for canonical/sitemap links.
2. Firebase configuration is loaded from `firebase-applet-config.json`.
   - Google Sign-In is provisioned automatically.
   - To enable Email/Password sign-in, enable **Email/Password** under **Firebase Console → Authentication → Sign-in method**.
3. Run locally:
   ```bash
   npm install
   npm run dev
   ```
4. Run tests, typecheck, and build:
   ```bash
   npx --yes tsx --test src/utils/*.test.ts
   npm run lint
   npm run lint:rules
   npm run build
   ```
