# Security baseline

## Authentication
- Passwords hashed with **argon2id**. Never logged.
- Access token: 15 min. Refresh token: 30 days, **rotated on every use**, stored **hashed** per device (`Session`).
  Reusing an old refresh token revokes all sessions for that user.
- Web: tokens in `httpOnly; Secure; SameSite=Lax` cookies (not readable by JS).
- Mobile: tokens in `expo-secure-store` (Android Keystore), never AsyncStorage.
- Phone verification via SMS OTP is mandatory. OTPs are 6 digits, hashed, 5 min TTL, max 5 attempts, rate-limited per phone and IP.
- `MAX_ACTIVE_DEVICES_PER_STUDENT` limits account sharing.

## Authorisation
- **Deny by default**: every API route requires a valid JWT unless explicitly marked `@Public()`.
- Role checks with `@Roles()`; ownership checks in services (a teacher edits only their own courses).
- Next.js middleware redirects are UX only — the API is always the gate.

## Payments
- PayHere notify: verify `md5sig`, merchant ID, amount and currency against the stored order before granting access.
- Gateway reference is `UNIQUE` → a webhook delivered twice cannot grant twice.
- Payment status change + enrollment creation happen in **one DB transaction**.
- Prices always come from the database, never from the client.
- Every approval/rejection is written to the append-only `AuditLog`.

## Files (PDFs, slips)
- Private bucket only. Access via **signed URLs (5 min)** after an access check.
- Validate MIME type by content (not extension) and size limits; random storage keys.

## Video protection (YouTube)
- Teachers must upload videos as **Unlisted**.
- The YouTube ID is stored server-side and released only to enrolled students through a short-lived token.
- Player hides YouTube UI (share, title, "Watch on YouTube") behind an overlay with custom controls.
- Moving watermark with the student's identity.
- Android: screenshots/screen recording blocked (`FLAG_SECURE`).
- **Known limit:** a technical user with browser dev tools can still find the video ID. For stronger protection,
  move to a DRM host (Bunny Stream / VdoCipher / Mux) — the `video-access` module is the single place to change.

## Platform
- Helmet security headers on the API; CSP, HSTS, `frame-ancestors 'none'` on the web app.
- Global rate limiting (stricter on auth/OTP routes).
- Env validated at boot — the API refuses to start with missing or weak secrets.
- Errors never return stack traces to clients.
- CI runs `pnpm audit` and gitleaks secret scanning; Dependabot keeps deps updated.
- Containers run as non-root.
