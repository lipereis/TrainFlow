# TrainFlow — production configuration (Vercel + Clerk + Supabase)

Placeholders only. Put real values in the Vercel / Clerk / Supabase dashboards and local gitignored `.env` files. **Never commit secrets.**

Target architecture:

| Layer | Host |
|-------|------|
| Frontend + API (Route Handlers) | **Vercel** — Next.js app at `apps/web` |
| Database | **Supabase** PostgreSQL |
| Auth + webhooks | **Clerk** |

Do **not** use Railway. The legacy Nest app under `apps/api` remains in the repo for reference until retired; production traffic goes through Next.js `/api/*`.

---

## First deploy (minimal)

**Vercel Root Directory:** `apps/web`

### Required on Vercel *before* first Deploy

| Variable | Copy from (local) | Notes |
|----------|-------------------|--------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | `apps/web/.env.local` or root `.env` | Build + runtime |
| `CLERK_SECRET_KEY` | `apps/web/.env.local` or root `.env` | Runtime (auth, invites) |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | `apps/web/.env.local` | Usually `/sign-in` |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | `apps/web/.env.local` | Usually `/sign-up` |
| `DATABASE_URL` | root `.env` or `packages/db/.env` | **Pooler** `:6543` + `pgbouncer=true` — **do not** use the localhost URL from `apps/web/.env.local` if present |
| `DIRECT_URL` | root `.env` or `packages/db/.env` | **Direct** `:5432` (`db.<project>.supabase.co`) |

### Not required for the first build (add after deploy)

| Variable | When |
|----------|------|
| `NEXT_PUBLIC_APP_URL` | Optional. Runtime falls back to `VERCEL_PROJECT_PRODUCTION_URL` / `VERCEL_URL`. Set after you know the stable `https://…` host (custom domain or `*.vercel.app`), then redeploy if you want it baked into client bundles. |
| `CLERK_WEBHOOK_SECRET` | After creating the trainer webhook in Clerk (signing secret). Missing → **runtime 503** on that route only; build succeeds. |
| `CLERK_INVITE_WEBHOOK_SECRET` | After creating the invite webhook (or reuse trainer secret). Missing → **runtime 503** on that route only. |
| `CLERK_INSTANCE_ID` | Optional |

Webhook signature verification is unchanged: when a secret **is** set, Svix still verifies the raw body. Secrets are never read at build time.

### After first successful deploy

1. Copy the Vercel HTTPS origin (e.g. `https://<project>.vercel.app`).
2. Clerk Dashboard → allow that origin + redirect URLs; paths `/sign-in`, `/sign-up`, after-auth `/post-auth`.
3. Create two Clerk webhooks (`user.created`):
   - `https://<vercel-host>/api/webhooks/clerk/trainer`
   - `https://<vercel-host>/api/webhooks/clerk/invite`
4. Paste each endpoint’s `whsec_…` into Vercel as `CLERK_WEBHOOK_SECRET` / `CLERK_INVITE_WEBHOOK_SECRET` → redeploy (or wait for env to apply).
5. Optionally set `NEXT_PUBLIC_APP_URL=https://<vercel-host>` (no trailing slash) → redeploy.
6. From a machine with prod DB URLs: `pnpm db:migrate:deploy` (and optional `pnpm db:seed`).
7. Smoke: `/api/health` → sign-in → client → workout → Excel/PDF.

---

## App URL resolution

`appOrigin()` order:

1. `NEXT_PUBLIC_APP_URL` (if set)
2. `VERCEL_PROJECT_PRODUCTION_URL` (Vercel-injected)
3. `VERCEL_URL` (Vercel-injected per deployment)
4. `http://localhost:3000`

Same-origin browser calls use `/api/...` — **no** `NEXT_PUBLIC_API_URL`.

---

## Clerk

### Session token (required for roles in JWT)

**Clerk Dashboard → Configure → Sessions → Customize session token**

```json
{
  "metadata": "{{user.public_metadata}}"
}
```

### Webhooks (event: `user.created` on both)

| Endpoint URL | Secret env | Behavior |
|--------------|------------|----------|
| `https://<vercel-host>/api/webhooks/clerk/trainer` | `CLERK_WEBHOOK_SECRET` | Creates `Trainer` when role is missing or `TRAINER` |
| `https://<vercel-host>/api/webhooks/clerk/invite` | `CLERK_INVITE_WEBHOOK_SECRET` (fallback: `CLERK_WEBHOOK_SECRET`) | Accepts invite when `role === "CLIENT"` + `inviteToken` |

---

## Vercel project settings

| Setting | Value |
|---------|--------|
| Root Directory | `apps/web` |
| Framework | Next.js |
| Install / Build | `apps/web/vercel.json` |
| Node | `>= 20` |

---

## Supabase

| Variable | Notes |
|----------|--------|
| `DATABASE_URL` | Transaction pooler `:6543` + `pgbouncer=true` (runtime) |
| `DIRECT_URL` | Direct `:5432` (migrations) |

---

## Smoke checklist (production)

- [ ] `GET https://<vercel>/api/health` → `{ "ok": true }`
- [ ] Sign-in / dashboard works
- [ ] Same-origin `/api/*` calls succeed
- [ ] Clerk webhooks deliver after secrets are set
- [ ] Client → workout → Excel/PDF

---

## Code references

| Concern | Location |
|---------|----------|
| Route Handlers | `apps/web/src/app/api/**` |
| `appOrigin()` | `apps/web/src/server/http.ts` |
| Trainer webhook | `POST /api/webhooks/clerk/trainer` |
| Invite webhook | `POST /api/webhooks/clerk/invite` |
| Vercel build | `apps/web/vercel.json` |
| Legacy Nest (not for prod) | `apps/api` |
