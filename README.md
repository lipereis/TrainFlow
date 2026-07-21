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
- PostgreSQL (Supabase or local)
- Clerk application (API keys + webhook secret)

## Setup

1. Copy `.env.example` → `.env` (root) and `apps/web/.env.local`
2. `pnpm install`
3. `pnpm db:generate && pnpm db:migrate`
4. Point Clerk webhooks:
   - `user.created` → `POST {API}/trainers/signup-webhook` (trainers)
   - `user.created` → `POST {API}/invites/accept` (clients with `publicMetadata.role=CLIENT`)
5. Customize Clerk session token to include `public_metadata` as `metadata`
6. `pnpm dev`

> **Note:** Prisma Dev may write `packages/db/.env`. Keep `DATABASE_URL` there in sync with the root `.env`, or e2e helpers may prefer the package file over a stale root value.

Web: http://localhost:3000  
API: http://localhost:3001

## Scripts

- `pnpm dev` — web + api
- `pnpm test` — unit tests (turbo: includes `@trainflow/api` + `@trainflow/workout-math`)
- `pnpm --filter @trainflow/api test:e2e` — invite e2e (needs DATABASE_URL)
- `pnpm db:seed` — seed exercises + sample workout templates

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
pnpm dev
```

- Web: http://localhost:3000  
- API: http://localhost:3001 (no `/api` prefix; set `NEXT_PUBLIC_API_URL` accordingly)

### Tests

```bash
pnpm test
# or targeted:
pnpm --filter @trainflow/api test
pnpm --filter @trainflow/workout-math test
pnpm --filter @trainflow/web exec tsc --noEmit
```

### Export notes

- Excel: `GET /workouts/:id/export.xlsx` (ExcelJS; summary + per-day sheets)
- PDF: `GET /workouts/:id/export.pdf` (PDFKit)
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
