# Production deploy checklist

TrainFlow production stack: **Vercel (web) + Railway (API) + Supabase (Postgres) + Clerk (production app)**.

PostgreSQL only — do not use SQLite.

Placeholders live in:

- [`.env.example`](../.env.example) (root / API)
- [`apps/web/.env.example`](../apps/web/.env.example)
- [`packages/db/.env.example`](../packages/db/.env.example)

Fill real values only in cloud dashboards and local untracked `.env` files.

## 1. Supabase

1. Create a project.
2. Copy **Transaction pooler** URI → `DATABASE_URL` (port `6543`, often `?pgbouncer=true`).
3. Copy **Direct** URI → `DIRECT_URL` (port `5432`).
4. Keep both as `postgresql://…` (Prisma).

## 2. Clerk (production application)

1. Create a **production** Clerk application (live keys).
2. Session token customize: `{ "metadata": "{{user.public_metadata}}" }`.
3. Default `publicMetadata.role` = `TRAINER` for new sign-ups (or set via Dashboard / hook).
4. Allowed origins / redirect URLs: your Vercel URL (`https://…vercel.app` and custom domain if any).
5. Note **Instance ID** → `CLERK_INSTANCE_ID`.
6. After Railway URL exists, add webhooks:
   - `user.created` → `https://<railway-host>/trainers/signup-webhook`
   - Invite accept flow as configured in the app (`/invites/accept` — see Foundation README)
7. Copy `pk_live_…`, `sk_live_…`, webhook `whsec_…` into Vercel + Railway env.

## 3. Railway (API)

1. New project from this GitHub repo.
2. Builder uses root [`Dockerfile`](../Dockerfile) + [`railway.toml`](../railway.toml).
3. Set variables (from `.env.example`):
   - `DATABASE_URL`, `DIRECT_URL`
   - `CLERK_SECRET_KEY`, `CLERK_WEBHOOK_SECRET`, `CLERK_PUBLISHABLE_KEY`
   - `WEB_ORIGIN` = `https://<your-vercel-host>`
   - `API_PORT` = `3001` (Railway also sets `PORT`; the API listens on `PORT ?? API_PORT`)
4. Deploy. Healthcheck: `GET /health` → `{ "ok": true }`.
5. Entrypoint runs `prisma migrate deploy` then starts Nest.
6. One-time seed (Railway shell or local against prod URLs):

```bash
DATABASE_URL="…" DIRECT_URL="…" pnpm db:seed
```

## 4. Vercel (web)

1. Import the same GitHub repo.
2. Set **Root Directory** to `apps/web` (uses [`apps/web/vercel.json`](../apps/web/vercel.json)).
3. Framework: Next.js. Install/build commands are in `vercel.json`.
4. Env:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `CLERK_INSTANCE_ID`
   - `NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in`, `NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up`
   - `NEXT_PUBLIC_API_URL` = `https://<railway-host>` (no path prefix)
5. Deploy. Confirm CORS: Railway `WEB_ORIGIN` matches the Vercel URL exactly (scheme + host, no trailing slash mismatch).

## 5. Smoke (production)

1. Open Vercel URL → sign up / sign in (trainer).
2. Create client → new workout → generate → edit (Saved).
3. Export Excel + PDF.
4. Reopen from dashboard / client profile.

## Local parity

```bash
cp .env.example .env
cp apps/web/.env.example apps/web/.env.local
cp packages/db/.env.example packages/db/.env
# edit URLs/keys — for local Postgres set DATABASE_URL and DIRECT_URL to the same value
pnpm install
pnpm db:generate && pnpm db:migrate:deploy && pnpm db:seed
pnpm dev
```

Optional API image check:

```bash
docker build -t trainflow-api .
```
