# TrainFlow — Stripe Billing + Client Cap (v1)

**Date:** 2026-07-22  
**Status:** Approved design (pending implementation plan)  
**Scope:** Free tier (2 clients) + Pro subscription via Stripe Checkout/Portal; gate new client creation only  
**App:** `apps/web` + `packages/db`

## Goals

1. Let trainers use TrainFlow for free with a **2-client** cap.
2. Charge for **Pro** (unlimited clients) via **Stripe**, currency **BRL**, price configurable in Stripe (not hardcoded).
3. Sync subscription state into Postgres and enforce the cap on **create client** only.

## Non-goals

- Annual plans, multi-currency, Enterprise checkout.
- Gating workouts, exports, or client portal.
- Soft-locking the whole app when over limit.
- In-app invoice UI, dunning emails beyond Stripe defaults.
- Clerk Billing as source of truth.
- Production Clerk / custom domain (separate ops work).

## Decisions

| Topic | Choice |
|-------|--------|
| Offer | Free forever (2 clients) → Pro unlimited |
| Currency | BRL (single Stripe Price for v1) |
| Price | Owned in Stripe Dashboard (`STRIPE_PRICE_ID_PRO`); landing copy editable in i18n |
| Gating | New clients only |
| Over limit | Keep existing clients; block adds until under cap or Pro |
| Past due | Still treat as Pro (grace) until canceled/unpaid terminal |
| Integration | Stripe Checkout + Customer Portal + webhooks |
| Billing fields | On `Trainer` for v1 |

## Data model

Add to `Trainer` (`packages/db` Prisma):

| Field | Type | Notes |
|-------|------|--------|
| `stripeCustomerId` | `String?` `@unique` | Created on first checkout |
| `stripeSubscriptionId` | `String?` | Latest known subscription |
| `plan` | enum `FREE` \| `PRO` | Default `FREE` |
| `planStatus` | enum `NONE` \| `ACTIVE` \| `PAST_DUE` \| `CANCELED` \| `INCOMPLETE` | Default `NONE` |

**Pro entitled:** `plan === PRO` AND `planStatus ∈ { ACTIVE, PAST_DUE }`.

**Free limit:** `FREE_CLIENT_LIMIT` env, default `2`. Count = trainer’s clients (same query as list).

Migration: additive only; existing trainers stay `FREE` / `NONE`.

## Entitlement helper

Shared server helper (e.g. `apps/web/src/server/billing/entitlements.ts`):

- `isProEntitled(trainer)`
- `assertCanCreateClient(trainerId)` → counts clients; throws/returns typed error `CLIENT_LIMIT_REACHED` when free and at/over limit.

Call from clients **create** path only (API route or `clients.service.create`). Edit/delete/list/workouts/exports unchanged.

## Stripe integration

### Env

| Variable | Required |
|----------|----------|
| `STRIPE_SECRET_KEY` | Yes (server) |
| `STRIPE_WEBHOOK_SECRET` | Yes (webhook route) |
| `STRIPE_PRICE_ID_PRO` | Yes (BRL monthly Price id) |
| `FREE_CLIENT_LIMIT` | No (default 2) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Only if client Stripe.js needed; v1 can be Checkout redirect-only |

Document in `docs/deploy.md`.

### Routes

| Route | Auth | Behavior |
|-------|------|----------|
| `POST /api/billing/checkout` | Trainer | Ensure Stripe Customer (metadata `trainerId`); Checkout Session `mode=subscription` with `STRIPE_PRICE_ID_PRO`; success `/settings/billing?success=1`, cancel `?canceled=1` |
| `POST /api/billing/portal` | Trainer | Customer Portal session; return to `/settings/billing` |
| `POST /api/webhooks/stripe` | Stripe signature | Update Trainer billing fields from subscription events |

### Webhook events

Handle at least:

- `checkout.session.completed` (link customer/subscription if needed)
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted` → `plan=FREE`, `planStatus=CANCELED` (or `NONE`)
- `invoice.payment_failed` → `planStatus=PAST_DUE`

Map Stripe statuses roughly: `active`→`ACTIVE`, `past_due`→`PAST_DUE`, `canceled`/`unpaid`→ not entitled, `incomplete`→`INCOMPLETE`.

Never trust the browser for plan upgrades; webhooks (or verified session retrieve after success) are source of truth.

## UI

### `/settings/billing` (new trainer page)

- Show plan, status, usage `clients / limit` (or “Unlimited” for Pro).
- **Upgrade to Pro** → `POST` checkout → redirect.
- **Manage billing** → portal (if `stripeCustomerId` present).
- Flash messages for `success` / `canceled` query params.
- Nav link in trainer shell.

### Clients surfaces

- At free cap: disable/hide primary “new client” CTA; show short upgrade copy + link to billing.
- Create form/API: surface `CLIENT_LIMIT_REACHED` clearly.

### Marketing

- Pricing section: **Free** (2 clients) + **Pro** (unlimited, BRL amount in i18n — operator updates copy when price changes).
- Pro CTA: signed-out → `/sign-up`; signed-in trainer → checkout (or billing page).
- Drop Enterprise paid column for v1 (optional “Talk to us” mailto only).
- Update FAQ that claimed billing wasn’t required for demo.

## Operator setup (out of code, documented)

1. Stripe account, enable BRL Product + recurring Price → copy Price id to env.
2. Webhook endpoint → production `/api/webhooks/stripe` (+ Stripe CLI for local).
3. Customer Portal enabled in Stripe Dashboard (cancel/payment method).
4. Redeploy Vercel with secrets.

## Acceptance

- [ ] Free trainer can create up to 2 clients; 3rd create returns `CLIENT_LIMIT_REACHED`.
- [ ] Pro checkout + webhook → trainer becomes entitled; can create more clients.
- [ ] Cancel via Portal + webhook → free again; existing clients remain; new creates blocked if ≥ 2.
- [ ] `past_due` still allows creates (grace).
- [ ] Price change in Stripe does not require code change (only Price id / i18n copy).
- [ ] No unrelated auth/schema breakage; migrate deploy succeeds.

## Follow-on (not this spec)

- Production Clerk + custom domain.
- Annual Pro, Pix-specific UX if Stripe BR supports desired methods.
- Soft paywalls on exports later.
- Legal pages (terms/privacy) linked from Checkout/Portal.
