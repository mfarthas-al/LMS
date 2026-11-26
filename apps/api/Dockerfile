# Build from the repo root:  docker build -f apps/api/Dockerfile .
FROM node:20-alpine AS base
RUN corepack enable
WORKDIR /repo

FROM base AS build
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @lms/api prisma:generate
RUN pnpm turbo run build --filter=@lms/api
RUN pnpm --filter @lms/api deploy --prod /out

FROM node:20-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
# Run as non-root
RUN addgroup -S app && adduser -S app -G app
COPY --from=build --chown=app:app /out ./
COPY --from=build --chown=app:app /repo/apps/api/dist ./dist
COPY --from=build --chown=app:app /repo/apps/api/prisma ./prisma
USER app
EXPOSE 4000
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
