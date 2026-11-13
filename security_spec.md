# ZyvoMovie Firestore Security Specification

## 1. Data Invariants

1. **Strict Private Ownership**: Every document under `/users/{uid}` and its subcollections (`watchlist`, `watchProgress`, `history`, `preferences`) belongs exclusively to the authenticated user whose `request.auth.uid == uid` and whose `request.auth.token.email_verified == true`.
2. **Admin-Only Catalog Publishing**: `/catalogItems/{itemId}` is publicly readable (`get` and `list`) so visitors can browse admin-posted titles, while `create`, `update`, and `delete` require `isAdmin()` (verified email `rahulhaldarx15@gmail.com` or trusted `/admins/{uid}` document), strict key allowlisting, and `request.time` timestamps.
3. **PII Isolation**: User emails and profile records under `/users/{uid}` are strictly readable and writable only by the owner (`isOwner(uid)`). No blanket `isSignedIn()` reads exist anywhere.
4. **ID & Path Integrity**: All document IDs (`uid`, `mediaId`, `historyId`, `prefId`, `itemId`) are validated against `^[a-zA-Z0-9_\\-]+$` and bounded to `<= 128` characters.
5. **Immutable Ownership & Timestamps**: `uid`, `createdBy`, `itemId`, and `createdAt` / `addedAt` / `watchedAt` cannot be reassigned after creation; server timestamps (`request.time`) are enforced on writes.
6. **No Shadow Fields**: Every `create` checks both `keys().hasAll(...)` and `keys().hasOnly(...)`; every `update` uses `affectedKeys().hasOnly(...)` combined with `isValid[Entity](incoming())`.

## 2. Dirty Dozen Attack Payloads (Must Return PERMISSION_DENIED)

1. Unauthenticated read of `/users/userA/watchlist/movie_123`.
2. Cross-user read of `/users/userA` by `userB`.
3. Cross-user write to `/users/userA/watchlist/movie_123` by `userB`.
4. Non-admin authenticated user attempting `create` on `/catalogItems/custom_1`.
5. Unverified admin email spoof (`email == "rahulhaldarx15@gmail.com"`, `email_verified == false`) attempting `create` on `/catalogItems/custom_1`.
6. Shadow field injection (`isVerified: true`) on `/catalogItems/custom_1` or `/users/userA`.
7. Identity spoofing (`createdBy: "someoneElse"` or `uid: "userB"`).
8. Client-forged timestamp (`updatedAt: "1999-01-01"`) instead of `request.time`.
9. Oversized title (`title.length > 200`) or oversized genres list (`genres.size() > 10`).
10. Invalid `mediaType: "podcast"` outside enum `['movie', 'tv', 'anime']`.
11. Out-of-bounds `progressPercent: 150` or negative `currentTime: -10`.
12. Mutating immutable `createdBy` or `createdAt` during `/catalogItems/{itemId}` update.
