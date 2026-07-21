# Production Deploy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make TrainFlow production-deployable on Vercel + Railway + Supabase + production Clerk, with placeholders only (no real secrets).

**Architecture:** Root multi-stage Dockerfile builds Nest API + workspace packages; entrypoint runs Prisma migrate against Supabase Postgres; Vercel builds Next web; `.env.example` documents the full env matrix including `DIRECT_URL`.

**Tech Stack:** Docker, Railway, Vercel, Supabase PostgreSQL, Prisma, Clerk live keys (placeholders), NestJS, Next.js 14, pnpm/Turborepo.

## Global Constraints

- PostgreSQL only — never SQLite.
- No real credentials in git; placeholders in `.env.example`.
- Match Foundation hosting: Supabase + Railway + Vercel + production Clerk.
- Operator creates cloud projects later.

---

### Task 1: Prisma `DIRECT_URL` for Supabase

**Files:**
- Modify: `packages/db/prisma/schema.prisma`
- Modify: `.env.example`, `.github/workflows/ci.yml`
- Modify: `apps/api/test/helpers/load-db-env.ts` (load DIRECT_URL if present)

- [ ] Add `directUrl = env("DIRECT_URL")` to datasource.
- [ ] Document placeholders; CI sets `DIRECT_URL` = `DATABASE_URL`.
- [ ] Commit.

### Task 2: API health + PORT binding

**Files:**
- Create: `apps/api/src/health/health.controller.ts`
- Modify: `apps/api/src/app.module.ts`, `apps/api/src/main.ts`

- [ ] `GET /health` returns `{ ok: true }` without auth.
- [ ] Listen on `PORT ?? API_PORT ?? 3001`.
- [ ] Commit.

### Task 3: Docker + Railway

**Files:**
- Create: `Dockerfile`, `.dockerignore`, `docker-entrypoint.api.sh`, `railway.toml`

- [ ] Multi-stage pnpm build for api + db + shared-types + workout-math.
- [ ] Entrypoint: migrate deploy then start.
- [ ] Railway healthcheck `/health`.
- [ ] Commit.

### Task 4: Vercel + env docs

**Files:**
- Create: `apps/web/vercel.json` (and/or root notes)
- Modify: `.env.example`, `README.md`
- Create: `docs/deploy.md` checklist

- [ ] Vercel build/install for monorepo.
- [ ] Full production env matrix with placeholders.
- [ ] Operator checklist (Supabase, Railway, Vercel, Clerk).
- [ ] Commit.

### Task 5: Verify

- [ ] `pnpm lint`, api unit + e2e, api build.
- [ ] Optional: `docker build` if Docker available.
