# TrainFlow

AI-powered operating system for personal trainers.

## Foundation (this phase)

- Turborepo monorepo (`apps/web`, `apps/api`, `packages/*`)
- Clerk auth (`TRAINER` / `CLIENT`)
- Core DB: Trainer, Client, InviteToken
- Trainer invite flow + client list

## Prerequisites

- Node.js >= 20
- pnpm 9
- **PostgreSQL** (local or [Supabase](https://supabase.com) — **no SQLite**)
- Clerk application (API keys + webhook secret)

## Setup

1. Copy env templates (placeholders only — see comments inside):
   - `.env.example` → `.env` (root / API)
   - `apps/web/.env.example` → `apps/web/.env.local`
   - `packages/db/.env.example` → `packages/db/.env`  
   Set **both** `DATABASE_URL` and `DIRECT_URL` (same value locally; pooler + direct on Supabase).
2. `pnpm install`
3. `pnpm db:generate && pnpm db:migrate` (or `pnpm db:migrate:deploy`)
4. Point Clerk webhooks at the Next.js app:
   - `user.created` → `POST {APP}/api/webhooks/clerk/trainer` (trainers)
   - `user.created` → `POST {APP}/api/webhooks/clerk/invite` (clients with `publicMetadata.role=CLIENT`)
5. Customize Clerk session token to include `public_metadata` as `metadata`
6. `pnpm --filter @trainflow/web dev` (or `pnpm dev`)

> **Note:** Prisma may write `packages/db/.env`. Keep `DATABASE_URL` / `DIRECT_URL` in sync with root `.env` and `apps/web/.env.local`.

App + API (Route Handlers): http://localhost:3000 · Health: http://localhost:3000/api/health

## Production deploy

See **[docs/deploy.md](docs/deploy.md)** for the Vercel + Clerk + Supabase matrix (env vars, webhooks, session claims, build settings). **No Railway.**

| Layer | Host |
|-------|------|
| Frontend + backend | Vercel (`apps/web` Root Directory) |
| DB | Supabase PostgreSQL |
| Auth | Clerk |

Legacy Nest (`apps/api`) stays in the repo until retired; production uses Next.js `/api/*` only.

## Scripts

- `pnpm dev` — turbo (web; api package still present for local comparison)
- `pnpm test` — unit tests (turbo: includes `@trainflow/api` + `@trainflow/workout-math`)
- `pnpm --filter @trainflow/api test:e2e` — legacy Nest e2e (needs Postgres)
- `pnpm db:seed` — seed exercises + sample workout templates
- `pnpm db:migrate:deploy` — apply migrations (CI / production)

## Workout Spreadsheet MVP

Trainer workflow: full client profiles → multi-day wizard → autosaving spreadsheet with volume math → templates → Excel/PDF export.

### Install / migrate / seed

```bash
pnpm install
pnpm db:generate && pnpm db:migrate
pnpm db:seed
```

Seed loads the global exercise library (`packages/db/prisma/data/exercises.json`) and sample workout templates (`templates.json`). Idempotent upserts — safe to re-run.

### Dev

```bash
pnpm --filter @trainflow/web dev
```

- App: http://localhost:3000  
- API: same origin under `/api/*` (e.g. `/api/clients`, `/api/workouts/:id/export.xlsx`)

### Tests

```bash
pnpm test
# or targeted:
pnpm --filter @trainflow/api test
pnpm --filter @trainflow/workout-math test
pnpm --filter @trainflow/web exec tsc --noEmit
```

### Export notes

- Excel: `GET /api/workouts/:id/export.xlsx` (ExcelJS; summary + per-day sheets)
- PDF: `GET /api/workouts/:id/export.pdf` (PDFKit)
- Trainer ownership enforced; UI downloads via authenticated blob fetch (`apps/web/src/lib/api-download.ts`)
- Missing weight → volume shown as unavailable (never treated as 0)

### Manual DoD smoke (human)

1. Log in (Clerk)  
2. Register client (full profile)  
3. Create multi-day workout via wizard  
4. Generate spreadsheet  
5. Edit + autosave  
6. Confirm volume / weekly / muscle sets  
7. Export Excel  
8. Export PDF  
9. Reopen workout URL later  
