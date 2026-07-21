# TrainFlow — Production Deploy Design

## Context

Workout Spreadsheet MVP works locally. There is no production hosting config yet. Foundation already chose Supabase Postgres + Railway (API); web belongs on Vercel. Operator will create cloud projects and supply live credentials later; the repo must be production-ready with placeholders only.

## Goals

- Ship a production-ready deploy path: **Vercel (web) + Railway (API) + Supabase (Postgres) + production Clerk**.
- Keep **PostgreSQL only** (no SQLite fallback).
- Document every env var, webhook, and one-time migrate/seed step with placeholders.
- API container builds the monorepo packages it needs and runs migrations on boot.

## Non-Goals

- Creating the operator’s cloud accounts or pasting real secrets into the repo.
- Client portal feature work (follow-up after deploy is live).
- Playwright / i18n.
- Multi-region, CDN tuning, or autoscaling policies beyond platform defaults.

## Decisions

| Topic | Choice |
|-------|--------|
| Web | Vercel (`apps/web`, pnpm monorepo build) |
| API | Railway via root `Dockerfile` |
| DB | Supabase Postgres (`provider = postgresql` only) |
| Auth | New **production** Clerk application (live keys) |
| Migrations | `prisma migrate deploy` in API container entrypoint |
| Seed | Manual one-time `pnpm db:seed` against prod (or Railway one-off) |
| Secrets | Placeholders in `.env.example` only; real values in host dashboards |

## Architecture

```
Browser → Vercel (Next.js / apps/web)
              │ Clerk session + Bearer JWT to API
              ▼
         Railway (NestJS Docker)
              │ Prisma
              ▼
         Supabase PostgreSQL
```

Clerk production app issues JWTs; API verifies with `CLERK_SECRET_KEY`. Webhooks hit Railway HTTPS URLs. CORS allows `WEB_ORIGIN` (Vercel URL).

## Environment matrix (placeholders)

| Variable | Where | Purpose |
|----------|--------|---------|
| `DATABASE_URL` | Railway, local, CI | Prisma runtime (prefer Supabase **pooled** URL in prod) |
| `DIRECT_URL` | Railway, local, CI | Prisma migrations (Supabase **direct** URL; local/CI may equal `DATABASE_URL`) |
| `CLERK_SECRET_KEY` | Vercel + Railway | Live `sk_live_…` |
| `CLERK_PUBLISHABLE_KEY` | Railway (optional helpers) | Live `pk_live_…` |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Vercel | Live `pk_live_…` |
| `CLERK_WEBHOOK_SECRET` | Railway | Svix signing secret |
| `CLERK_INSTANCE_ID` | Vercel | Production instance id for middleware handshake checks |
| `NEXT_PUBLIC_API_URL` | Vercel | `https://<railway-api-host>` |
| `WEB_ORIGIN` | Railway | `https://<vercel-host>` |
| `API_PORT` | Railway | `3001` (or platform `PORT`) |

No SQLite. No file-based DB URLs.

## Supabase / Prisma

- Schema stays `provider = "postgresql"`.
- Add optional `directUrl = env("DIRECT_URL")` so pooler + migrate works with Supabase.
- First deploy: `migrate deploy` (entrypoint) then one-time seed of exercises/templates.

## Railway API container

- Multi-stage Docker image from monorepo root.
- Build: install workspace → generate Prisma → build `db`, `shared-types`, `workout-math`, `api`.
- Entrypoint: `prisma migrate deploy` then `node apps/api/dist/main.js`.
- Health: unauthenticated `GET /health` → `200`.
- Listen on `process.env.PORT ?? API_PORT ?? 3001` (Railway injects `PORT`).

## Vercel web

- Project linked to repo; root directory `apps/web` **or** root with filter build.
- Build must compile workspace packages (`shared-types`, `workout-math`, `ui` as needed).
- Env: Clerk live keys + `NEXT_PUBLIC_API_URL`.

## Clerk production checklist

1. Create production Clerk application.
2. Session token: `{ "metadata": "{{user.public_metadata}}" }`.
3. Default trainer `publicMetadata.role=TRAINER`.
4. Allowed origins / redirect URLs = Vercel URL.
5. Webhooks `user.created` → `https://<api>/trainers/signup-webhook` and invite accept path as documented in README.
6. Set `CLERK_INSTANCE_ID` to the production instance id.

## Success criteria

- Repo contains Dockerfile, Railway/Vercel config, expanded `.env.example`, deploy docs.
- `pnpm` lint/tests/API build still pass locally against Postgres.
- Operator can create Supabase/Railway/Vercel/Clerk projects, fill placeholders, and reach: sign-in → client → workout → Excel/PDF on production URLs.
- Zero SQLite references in runtime or deploy path.

## Follow-up (out of scope)

- Client portal workout viewing.
- Automate seed in CI/CD for prod.
- Playwright smoke against production.
