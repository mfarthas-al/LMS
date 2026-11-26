# ADR 0001 — Tech stack

**Status:** Accepted · 2026-11-27

## Context
LMS for the Sri Lankan market: three roles, paid courses (PayHere + manual bank slips), YouTube-hosted
videos, PDF materials, web + Android. Security matters (payments, auth, teacher content).
Live classes may come later. Hosting not decided.

## Decision
- **TypeScript everywhere**, pnpm + Turborepo monorepo.
- **API:** NestJS · **DB:** PostgreSQL + Prisma · **Cache/queues:** Redis + BullMQ.
- **Web:** Next.js (App Router) + Tailwind.
- **Mobile:** Expo React Native, Android only.
- **Storage:** S3-compatible private bucket with signed URLs.
- **Payments:** PayHere, behind a `PaymentProvider` interface.
- **Auth:** email/password + Google; Sri Lankan phone number mandatory, verified via SMS OTP.

## Consequences
- Shared types/validation between API, web and mobile.
- Videos cost nothing to host but cannot be fully protected from technical users (see security.md).
- Docker images keep the hosting decision open.
