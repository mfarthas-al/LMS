# LMS — Learning Management System (Sri Lanka)

Three roles: **Student**, **Teacher**, **Admin**.
Teachers publish courses → units → lessons (Unlisted YouTube videos + PDF materials).
Students pay **online (PayHere, auto-access)** or **manually (bank slip, admin approves)**.

Web app (mobile responsive) + Android app, one TypeScript monorepo.

## Repo layout

```
apps/
  api/        NestJS REST API — auth, payments, access control, storage   (port 4000)
  web/        Next.js web app — public site + student/teacher/admin areas (port 3000)
  mobile/     Expo React Native — Android app
packages/
  shared/     Types, constants, zod schemas used by all apps
  api-client/ Typed HTTP client used by web + mobile
  config/     Shared tsconfig presets
infra/
  docker/     Local dev services (Postgres, Redis, MinIO, Mailpit)
docs/         Architecture, security, deployment, decision records
.github/      CI, Android build, Dependabot
```

## Getting started (local)

Requirements: Node 20, Docker Desktop, pnpm (`corepack enable`).

```bash
corepack enable
pnpm install
cp .env.example .env          # then fill in secrets
pnpm infra:up                 # Postgres, Redis, MinIO, Mailpit
pnpm db:migrate               # create tables
pnpm db:seed                  # create the super admin from SUPER_ADMIN_* in .env
pnpm dev                      # api + web
pnpm dev:mobile               # Android (Expo)
```

Local tools: MinIO console http://localhost:9001 · Mailpit http://localhost:8025 · Prisma Studio `pnpm db:studio`.

## Docs

- [Architecture](docs/architecture.md)
- [Security](docs/security.md)
- [Deployment](docs/deployment.md) — hosting not decided yet
- [ADR 0001 — Tech stack](docs/decisions/0001-tech-stack.md)
