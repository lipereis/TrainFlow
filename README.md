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
- `pnpm test` — unit tests
- `pnpm --filter @trainflow/api test:e2e` — invite e2e (needs DATABASE_URL)
