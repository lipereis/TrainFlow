# syntax=docker/dockerfile:1

# TrainFlow Nest API — production image (PostgreSQL / Supabase only).
# Build from monorepo root: docker build -t trainflow-api .

FROM node:20-bookworm-slim AS base
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app

FROM base AS build
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/db/package.json ./packages/db/
COPY packages/shared-types/package.json ./packages/shared-types/
COPY packages/workout-math/package.json ./packages/workout-math/
RUN pnpm install --frozen-lockfile --filter @trainflow/api...

COPY packages/db ./packages/db
COPY packages/shared-types ./packages/shared-types
COPY packages/workout-math ./packages/workout-math
COPY apps/api ./apps/api

# Prisma generate needs URL shape only (no live DB during image build).
ENV DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:5432/trainflow"
ENV DIRECT_URL="postgresql://postgres:postgres@127.0.0.1:5432/trainflow"

RUN pnpm --filter @trainflow/db generate \
  && pnpm --filter @trainflow/db build \
  && pnpm --filter @trainflow/shared-types build \
  && pnpm --filter @trainflow/workout-math build \
  && pnpm --filter @trainflow/api build

FROM base AS runner
ENV NODE_ENV=production
WORKDIR /app

COPY --from=build /app /app
COPY docker-entrypoint.api.sh /app/docker-entrypoint.api.sh
RUN chmod +x /app/docker-entrypoint.api.sh

EXPOSE 3001
ENV API_PORT=3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=45s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||process.env.API_PORT||3001)+'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

ENTRYPOINT ["/app/docker-entrypoint.api.sh"]
