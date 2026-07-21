# TrainFlow — exact production configuration (Railway + Vercel + Clerk + Supabase)

Placeholders only. Put real values in host dashboards / local gitignored `.env` files. **Never commit secrets.**

Linked Clerk app (dev already working): `app_3GobP2yKl5xJmkS5r1In46i02HE` (**TrainFlow**).  
Production uses that app’s **Production** instance (`pk_live_` / `sk_live_`), or a dedicated production instance in the same app.

---

## URL pairing (set after first deploy)

| Variable | Where | Exact shape |
|----------|--------|-------------|
| `WEB_ORIGIN` | Railway | `https://<vercel-host>` — no trailing slash |
| `NEXT_PUBLIC_API_URL` | Vercel | `https://<railway-host>` — no path prefix, no trailing slash |

Example shapes (replace hosts with yours):

```text
WEB_ORIGIN=https://trainflow.vercel.app
NEXT_PUBLIC_API_URL=https://trainflow-api.up.railway.app
```

CORS on the API is `origin: process.env.WEB_ORIGIN` (`apps/api/src/main.ts`). Mismatch → browser blocks API calls.

---

## Clerk (Production instance)

### Keys

| Variable | Host | Value |
|----------|------|--------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Vercel | `pk_live_…` |
| `CLERK_SECRET_KEY` | Vercel **and** Railway | `sk_live_…` (same key both places) |
| `CLERK_PUBLISHABLE_KEY` | Railway (optional helpers / invites) | `pk_live_…` |
| `CLERK_INSTANCE_ID` | Vercel (optional) | Production instance id `ins_…` from Dashboard |
| `CLERK_WEBHOOK_SECRET` | Railway | `whsec_…` for **trainer** webhook endpoint |
| `CLERK_INVITE_WEBHOOK_SECRET` | Railway | `whsec_…` for **invite** webhook endpoint (falls back to `CLERK_WEBHOOK_SECRET` if unset) |

Also on Vercel:

| Variable | Value |
|----------|--------|
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | `/sign-in` |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | `/sign-up` |

### Session token (required for roles in JWT)

**Clerk Dashboard → Configure → Sessions → Customize session token**

```json
{
  "metadata": "{{user.public_metadata}}"
}
```

App reads role from `sessionClaims.metadata.role` (fallback `publicMetadata.role`) — see `apps/web/src/lib/roles.ts` and `apps/api/src/common/guards/auth.guard.ts`.

### Public metadata roles

| Role | How it is set |
|------|----------------|
| `TRAINER` | Default for normal sign-up; `/post-auth` calls `ensureTrainerRole` if missing |
| `CLIENT` | Set on Clerk **invitation** `publicMetadata`: `{ "role": "CLIENT", "inviteToken": "<token>" }` by API invite flow |

### Paths / URLs in Clerk Dashboard

**Paths** (or equivalent):

- Sign-in: `/sign-in`
- Sign-up: `/sign-up`
- After sign-in / sign-up: `/post-auth` (matches `ClerkProvider` + SignIn/SignUp `forceRedirectUrl`)

**Allowed origins / redirect URLs:** your Vercel origin(s), e.g. `https://trainflow.vercel.app` (and custom domain if any). Include `http://localhost:3000` only for local.

### Webhooks (event: `user.created` on both)

Create **two** endpoints (Svix signing secret per endpoint):

| Endpoint URL | Event | Handler behavior |
|--------------|--------|------------------|
| `https://<railway-host>/trainers/signup-webhook` | `user.created` | Creates `Trainer` when `public_metadata.role` is missing or `TRAINER` (`apps/api/src/trainers/trainers.controller.ts`) |
| `https://<railway-host>/invites/accept` | `user.created` | Accepts invite when `public_metadata.role === "CLIENT"` and `inviteToken` present (`apps/api/src/invites/invites.controller.ts`) |

Both require raw body verification (`svix-id`, `svix-timestamp`, `svix-signature`). Nest is started with `{ rawBody: true }`.

Put each endpoint’s `whsec_…` into `CLERK_WEBHOOK_SECRET` and `CLERK_INVITE_WEBHOOK_SECRET` respectively.

---

## Railway (API)

### Project settings

| Setting | Value |
|---------|--------|
| Repo | `lipereis/TrainFlow` (or your fork) |
| Builder | Dockerfile |
| Dockerfile path | `Dockerfile` (repo root) — see `railway.toml` |
| Healthcheck path | `/health` |
| Healthcheck expect | `200` body `{ "ok": true }` |
| Start | `docker-entrypoint.api.sh` → `prisma migrate deploy` then `node apps/api/dist/main.js` |
| Listen port | `PORT` (Railway-injected) or `API_PORT` (default `3001`) |

### Environment variables (Railway)

```text
DATABASE_URL=<Supabase pooler URI :6543 ?pgbouncer=true>
DIRECT_URL=<Supabase direct URI :5432>
CLERK_SECRET_KEY=sk_live_…
CLERK_PUBLISHABLE_KEY=pk_live_…
CLERK_WEBHOOK_SECRET=whsec_…          # trainers/signup-webhook
CLERK_INVITE_WEBHOOK_SECRET=whsec_…   # invites/accept (optional if same as above)
WEB_ORIGIN=https://<vercel-host>
API_PORT=3001
```

URL-encode special characters in DB passwords (`@` → `%40`, `?` → `%3F`, etc.).

### One-time seed (after first migrate)

From a machine with prod DB URLs set (do not commit):

```bash
pnpm db:seed
```

---

## Vercel (web)

### Project settings

| Setting | Value |
|---------|--------|
| Root Directory | `apps/web` |
| Framework | Next.js |
| Install Command | from `apps/web/vercel.json`: `cd ../.. && pnpm install --frozen-lockfile` |
| Build Command | `cd ../.. && pnpm --filter @trainflow/shared-types build && pnpm --filter @trainflow/workout-math build && pnpm --filter @trainflow/ui build && pnpm --filter @trainflow/web build` |
| Output | Next default (`.next`) |
| Node | `>= 20` (matches `package.json` engines) |

### Environment variables (Vercel)

```text
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_…
CLERK_SECRET_KEY=sk_live_…
CLERK_INSTANCE_ID=ins_…                 # production instance id
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_API_URL=https://<railway-host>
```

`NEXT_PUBLIC_*` are baked in at **build** time — set them before building / redeploy after changing API URL.

---

## Supabase (already in use)

| Variable | Host | Notes |
|----------|------|--------|
| `DATABASE_URL` | Railway | Pooler `:6543` + `pgbouncer=true` |
| `DIRECT_URL` | Railway | Direct `:5432` for migrations |

Provider remains `postgresql` only (`packages/db/prisma/schema.prisma`). No SQLite.

---

## Deploy order

1. Supabase URLs ready on Railway.  
2. Deploy Railway → copy public API HTTPS host.  
3. Configure Clerk **production** keys, session claim, paths, allowed origins (Vercel URL TBD → update after step 5).  
4. Add both webhooks pointing at Railway hosts; set webhook secrets on Railway; redeploy API if needed.  
5. Deploy Vercel with Root Directory `apps/web` and env above (`NEXT_PUBLIC_API_URL` = Railway).  
6. Set Railway `WEB_ORIGIN` to the Vercel URL; redeploy API.  
7. Update Clerk allowed origins / redirect URLs to the Vercel URL.  
8. Smoke: sign-up/sign-in → create client → workout → Excel/PDF.

---

## Smoke checklist (production)

- [ ] `GET https://<railway>/health` → `{ "ok": true }`
- [ ] Vercel home shows Sign in / Sign up; after auth, UserButton + dashboard
- [ ] Browser network: API calls to `NEXT_PUBLIC_API_URL` succeed (CORS)
- [ ] Clerk Dashboard → Webhooks: both endpoints recent `user.created` deliveries OK (for new sign-ups / invites)
- [ ] Create client → new workout → generate → autosave → export xlsx/pdf

---

## Code references

| Concern | Location |
|---------|----------|
| CORS / port | `apps/api/src/main.ts` |
| Trainer webhook | `POST /trainers/signup-webhook` |
| Invite webhook | `POST /invites/accept` |
| JWT role | `metadata.role` / `publicMetadata.role` |
| Web API base | `NEXT_PUBLIC_API_URL` in `apps/web/src/lib/api.ts`, `browser-api.ts`, `api-download.ts` |
| Invite redirect base | `WEB_ORIGIN` in `apps/api/src/clients/clients.service.ts` |
| Docker migrate+start | `docker-entrypoint.api.sh` |
| Vercel build | `apps/web/vercel.json` |
| Railway | `railway.toml` + root `Dockerfile` |
