# Changelog

## 1.1.0 — 2026-11-13
- **Admin Publishing Studio (`/admin`)**: Added Firestore-backed `/catalogItems` management with verified admin rules (`rahulhaldarx15@gmail.com` or `/admins/{uid}`), client-side image compression for poster/backdrop uploads, studio presets, Featured Spotlight pinning, and full CRUD across Home, Movies, TV Shows, Anime, Search, Details, and Watch Player.
- **Full VidLink API Adoption**: Added JW Player vs Default engine selector (`player=jw|default`), icon theme toggle (`icons=vid|default`), anime auto-fallback (`?fallback=true`), resume checkpoint (`startAt`), custom subtitle label (`sub_label`), fallback redirect URL (`fallback_url`), and `MEDIA_DATA` (`vidLinkProgress`) + `PLAYER_EVENT` postMessage listeners.

## 1.0.0 — 2026-11-13
- Initial end-to-end release of **ZyvoMovie** (Zyvo Ecosystem).
- Implemented Pure White + Zyvo Red responsive UI with desktop header and mobile bottom navigation.
- Added server-side TMDB API proxy (`server/tmdb.ts`), Jikan v4 Anime adapter (`server/anime.ts`), and TTL memory cache (`server/cache.ts`).
- Built all 21 requested pages with loading skeletons, empty states, error boundaries, and SEO metadata.
- Implemented VidLink player adapter with provider authorization gate, subtitle validation, and origin-validated `postMessage` progress sync.
- Provisioned Firebase Authentication & Firestore with hardened security rules (`firestore.rules`) and `firebase-blueprint.json`.
