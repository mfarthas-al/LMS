# Deployment

**Status: hosting not decided yet.** Everything is built to be host-agnostic:

- `apps/api/Dockerfile` and `apps/web/Dockerfile` produce standalone, non-root images.
- All config comes from environment variables (see `.env.example`).
- Storage is S3-compatible (works with AWS S3, Cloudflare R2, DigitalOcean Spaces, MinIO).

## What is automated now
- `.github/workflows/ci.yml` — typecheck, lint, test, build, dependency audit, secret scan on every push/PR.
- `.github/workflows/android-build.yml` — manual Android build via Expo EAS (needs `EXPO_TOKEN` secret).

## To add once hosting is chosen
- `deploy-staging.yml` (on push to `develop`) and `deploy-production.yml` (on tag / manual approval).
- Managed Postgres with daily backups, managed Redis.
- TLS, domain, and the PayHere live notify URL.
- Error monitoring (e.g. Sentry) and uptime checks.

Candidate regions close to Sri Lanka: AWS `ap-south-1` (Mumbai), DigitalOcean BLR1 / SGP1.
