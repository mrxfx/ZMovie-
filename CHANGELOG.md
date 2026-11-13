# Changelog

## 1.0.0 — 2026-11-13
- Initial end-to-end release of **ZyvoMovie** (Zyvo Ecosystem).
- Implemented Pure White + Zyvo Red responsive UI with desktop header and mobile bottom navigation.
- Added server-side TMDB API proxy (`server/tmdb.ts`), Jikan v4 Anime adapter (`server/anime.ts`), and TTL memory cache (`server/cache.ts`).
- Built all 21 requested pages with loading skeletons, empty states, error boundaries, and SEO metadata.
- Implemented VidLink player adapter with provider authorization gate, subtitle validation, and origin-validated `postMessage` progress sync.
- Provisioned Firebase Authentication & Firestore with hardened security rules (`firestore.rules`) and `firebase-blueprint.json`.
