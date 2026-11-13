# ZyvoMovie Firestore Security Specification

## 1. Data Invariants

1. **Strict Private Ownership**: Every document under `/users/{uid}` and its subcollections (`watchlist`, `watchProgress`, `history`, `preferences`) belongs exclusively to the authenticated user whose `request.auth.uid == uid` and whose `request.auth.token.email_verified == true` (or Google provider verified).
2. **PII Isolation**: User emails and profile records under `/users/{uid}` are strictly readable and writable only by the owner (`isOwner(uid)`). No blanket `isSignedIn()` reads exist anywhere.
3. **ID & Path Integrity**: All document IDs (`uid`, `mediaId`, `historyId`, `prefId`) are validated against `^[a-zA-Z0-9_\\-]+$` and bounded to `<= 128` characters.
4. **Immutable Ownership & Timestamps**: `uid` and `createdAt` / `addedAt` / `watchedAt` cannot be reassigned after creation; server timestamps (`request.time`) are enforced on `createdAt`, `addedAt`, `watchedAt`, and `updatedAt`.
5. **No Shadow Fields**: Every `create` checks both `keys().hasAll(...)` and `keys().hasOnly(...)`; every `update` uses `affectedKeys().hasOnly(...)` combined with `isValid[Entity](incoming())`.

## 2. Dirty Dozen Attack Payloads (Must Return PERMISSION_DENIED)

1. Unauthenticated read of `/users/userA/watchlist/movie_123`.
2. Cross-user read of `/users/userA` by `userB`.
3. Cross-user write to `/users/userA/watchlist/movie_123` by `userB`.
4. Shadow field injection (`isAdmin: true`) on `/users/userA` create.
5. Identity spoofing (`uid: "userB"`) inside `/users/userA/watchlist/movie_123` payload.
6. Client-forged past/future timestamp (`updatedAt: "1999-01-01"`) instead of `request.time`.
7. Oversized title string (`title.length > 200`) causing resource exhaustion.
8. Invalid `mediaType: "podcast"` outside enum `['movie', 'tv', 'anime']`.
9. Out-of-bounds `progressPercent: 150` or negative `currentTime: -10`.
10. Poisoned document ID (`mediaId` containing slashes or 1KB random string).
11. Unverified email account (`email_verified == false`) attempting write to `/users/userA/preferences/settings`.
12. Mutating immutable `uid` or `createdAt` during `/users/userA` update.
