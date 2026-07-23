# Stripe Billing + Client Cap Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship free tier (2 clients) + BRL Pro via Stripe Checkout/Portal, sync plan on `Trainer`, and block new client creates (including invite) when over the free cap.

**Architecture:** Additive Prisma fields on `Trainer`. Pure entitlement helpers (Jest). Stripe SDK server-only routes for Checkout, Customer Portal, and webhooks that update `plan` / `planStatus`. UI: `/settings/billing`, clients CTAs, marketing Free+Pro.

**Tech Stack:** Next.js Route Handlers, Prisma/`@trainflow/db`, Stripe Node SDK, Clerk `requireTrainerId`, existing `ApiError` / `withHandler`, Jest + ts-jest.

## Global Constraints

- Free forever with **2** clients (`FREE_CLIENT_LIMIT` default `2`); Pro = unlimited.
- Currency **BRL**; price owned by Stripe Price id `STRIPE_PRICE_ID_PRO` (not hardcoded).
- Gate **new clients only** (both `create` and `invite` — both insert a `Client` row).
- Over limit: keep existing clients; block adds until under cap or Pro.
- Pro entitled when `plan === PRO` AND `planStatus ∈ { ACTIVE, PAST_DUE }` (past_due = grace).
- Never trust the browser for plan upgrades; webhooks (and server Checkout) are source of truth.
- Do not gate workouts, exports, or client portal.
- Typecheck: prefer `cd apps/web && pnpm exec tsc --noEmit` (filter may not match).

---

## File map

| Path | Task |
|------|------|
| `packages/db/prisma/schema.prisma` | 1 |
| `packages/db/prisma/migrations/*` | 1 |
| `packages/db/src/index.ts` | 1 |
| `apps/web/src/server/billing/entitlements.ts` | 2 |
| `apps/web/src/server/billing/entitlements.spec.ts` | 2 |
| `apps/web/src/server/clients.service.ts` | 3 |
| `apps/web/package.json` (add `stripe`) | 4 |
| `apps/web/src/server/billing/stripe.ts` | 4 |
| `apps/web/src/server/billing/sync-subscription.ts` | 4–5 |
| `apps/web/src/app/api/billing/checkout/route.ts` | 4 |
| `apps/web/src/app/api/billing/portal/route.ts` | 4 |
| `apps/web/src/app/api/webhooks/stripe/route.ts` | 5 |
| `apps/web/src/app/(trainer)/settings/billing/page.tsx` | 6 |
| `apps/web/src/components/billing-actions.tsx` | 6 |
| `apps/web/src/components/trainer-shell.tsx` | 6 |
| `apps/web/messages/en.json` + `pt-BR.json` | 6–7 |
| `apps/web/src/app/(trainer)/clients/page.tsx` | 7 |
| `apps/web/src/app/(trainer)/clients/new/page.tsx` | 7 |
| `apps/web/src/app/(trainer)/clients/invite/page.tsx` | 7 |
| `apps/web/src/components/marketing/pricing-section.tsx` | 7 |
| `docs/deploy.md` (+ `.env.example` if present) | 8 |

---

### Task 1: Prisma billing fields + migration

**Files:**
- Modify: `packages/db/prisma/schema.prisma`
- Create: migration via Prisma
- Modify: `packages/db/src/index.ts`

**Interfaces:**
- Produces: enums `TrainerPlan`, `TrainerPlanStatus`; Trainer fields `stripeCustomerId`, `stripeSubscriptionId`, `plan`, `planStatus`

- [ ] **Step 1: Add enums and Trainer fields**

In `schema.prisma`, after existing enums:

```prisma
enum TrainerPlan {
  FREE
  PRO
}

enum TrainerPlanStatus {
  NONE
  ACTIVE
  PAST_DUE
  CANCELED
  INCOMPLETE
}
```

On `model Trainer`, add:

```prisma
  stripeCustomerId     String?            @unique
  stripeSubscriptionId String?
  plan                 TrainerPlan        @default(FREE)
  planStatus           TrainerPlanStatus  @default(NONE)
```

- [ ] **Step 2: Create migration**

```bash
pnpm db:migrate
```

Use migration name `trainer_billing` when prompted (or `prisma migrate dev --name trainer_billing` from `packages/db`). Expected: migration SQL adds columns + enums; client regenerates.

- [ ] **Step 3: Re-export enums from `@trainflow/db`**

In `packages/db/src/index.ts`, add `TrainerPlan` and `TrainerPlanStatus` to the value export list from `@prisma/client`.

- [ ] **Step 4: Commit**

```bash
git add packages/db/prisma packages/db/src/index.ts
git commit -m "$(cat <<'EOF'
feat(db): add trainer Stripe billing fields and plan enums

Support free/pro entitlement sync from Stripe webhooks.
EOF
)"
```

---

### Task 2: Entitlement helpers (TDD)

**Files:**
- Create: `apps/web/src/server/billing/entitlements.ts`
- Create: `apps/web/src/server/billing/entitlements.spec.ts`

**Interfaces:**
- Consumes: `TrainerPlan`, `TrainerPlanStatus` from `@trainflow/db`; `forbidden` from `@/server/errors`; `prisma` from app db client
- Produces:
  - `freeClientLimit(): number`
  - `isProEntitled(trainer: { plan: TrainerPlan; planStatus: TrainerPlanStatus }): boolean`
  - `assertCanCreateClient(trainerId: string): Promise<void>` — throws `ApiError` 403 `CLIENT_LIMIT_REACHED` when not entitled and count ≥ limit

- [ ] **Step 1: Write failing tests**

Create `entitlements.spec.ts`:

```ts
import { ApiError } from "../errors";
import {
  freeClientLimit,
  isProEntitled,
  assertCanCreateClient,
} from "./entitlements";

jest.mock("@/server/prisma", () => ({
  prisma: {
    trainer: { findUniqueOrThrow: jest.fn() },
    client: { count: jest.fn() },
  },
}));

import { prisma } from "@/server/prisma";

const mockedPrisma = prisma as unknown as {
  trainer: { findUniqueOrThrow: jest.Mock };
  client: { count: jest.Mock };
};

describe("isProEntitled", () => {
  it("true for PRO + ACTIVE", () => {
    expect(isProEntitled({ plan: "PRO", planStatus: "ACTIVE" })).toBe(true);
  });
  it("true for PRO + PAST_DUE (grace)", () => {
    expect(isProEntitled({ plan: "PRO", planStatus: "PAST_DUE" })).toBe(true);
  });
  it("false for FREE + NONE", () => {
    expect(isProEntitled({ plan: "FREE", planStatus: "NONE" })).toBe(false);
  });
  it("false for PRO + CANCELED", () => {
    expect(isProEntitled({ plan: "PRO", planStatus: "CANCELED" })).toBe(false);
  });
});

describe("freeClientLimit", () => {
  const prev = process.env.FREE_CLIENT_LIMIT;
  afterEach(() => {
    if (prev === undefined) delete process.env.FREE_CLIENT_LIMIT;
    else process.env.FREE_CLIENT_LIMIT = prev;
  });
  it("defaults to 2", () => {
    delete process.env.FREE_CLIENT_LIMIT;
    expect(freeClientLimit()).toBe(2);
  });
  it("reads env", () => {
    process.env.FREE_CLIENT_LIMIT = "5";
    expect(freeClientLimit()).toBe(5);
  });
});

describe("assertCanCreateClient", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.FREE_CLIENT_LIMIT;
  });

  it("allows when Pro", async () => {
    mockedPrisma.trainer.findUniqueOrThrow.mockResolvedValue({
      plan: "PRO",
      planStatus: "ACTIVE",
    });
    await expect(assertCanCreateClient("t1")).resolves.toBeUndefined();
    expect(mockedPrisma.client.count).not.toHaveBeenCalled();
  });

  it("allows free under limit", async () => {
    mockedPrisma.trainer.findUniqueOrThrow.mockResolvedValue({
      plan: "FREE",
      planStatus: "NONE",
    });
    mockedPrisma.client.count.mockResolvedValue(1);
    await expect(assertCanCreateClient("t1")).resolves.toBeUndefined();
  });

  it("403 CLIENT_LIMIT_REACHED when free at limit", async () => {
    mockedPrisma.trainer.findUniqueOrThrow.mockResolvedValue({
      plan: "FREE",
      planStatus: "NONE",
    });
    mockedPrisma.client.count.mockResolvedValue(2);
    try {
      await assertCanCreateClient("t1");
      fail("expected throw");
    } catch (e) {
      expect(e).toBeInstanceOf(ApiError);
      expect((e as ApiError).status).toBe(403);
      expect((e as ApiError).code).toBe("CLIENT_LIMIT_REACHED");
    }
  });
});
```

- [ ] **Step 2: Run tests — expect FAIL**

```bash
cd apps/web && pnpm test -- entitlements.spec.ts
```

Expected: FAIL (module missing).

- [ ] **Step 3: Implement `entitlements.ts`**

```ts
import type { TrainerPlan, TrainerPlanStatus } from "@trainflow/db";
import { prisma } from "@/server/prisma";
import { forbidden } from "@/server/errors";

export function freeClientLimit(): number {
  const raw = process.env.FREE_CLIENT_LIMIT;
  const n = raw ? Number.parseInt(raw, 10) : 2;
  return Number.isFinite(n) && n >= 0 ? n : 2;
}

export function isProEntitled(trainer: {
  plan: TrainerPlan;
  planStatus: TrainerPlanStatus;
}): boolean {
  return (
    trainer.plan === "PRO" &&
    (trainer.planStatus === "ACTIVE" || trainer.planStatus === "PAST_DUE")
  );
}

export async function assertCanCreateClient(trainerId: string): Promise<void> {
  const trainer = await prisma.trainer.findUniqueOrThrow({
    where: { id: trainerId },
    select: { plan: true, planStatus: true },
  });
  if (isProEntitled(trainer)) return;

  const count = await prisma.client.count({ where: { trainerId } });
  if (count >= freeClientLimit()) {
    throw forbidden(
      "CLIENT_LIMIT_REACHED",
      `Free plan allows up to ${freeClientLimit()} clients. Upgrade to Pro to add more.`,
    );
  }
}
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
cd apps/web && pnpm test -- entitlements.spec.ts
```

Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/server/billing/entitlements.ts apps/web/src/server/billing/entitlements.spec.ts
git commit -m "$(cat <<'EOF'
feat(web): add billing entitlement helpers with tests

Free client cap and Pro grace rules for create gating.
EOF
)"
```

---

### Task 3: Gate client create + invite

**Files:**
- Modify: `apps/web/src/server/clients.service.ts`

**Interfaces:**
- Consumes: `assertCanCreateClient` from Task 2
- `create` and `invite` must call it before inserting a Client

- [ ] **Step 1: Call assert at start of create and invite**

At the top of `create` and `invite` (before any `prisma.client.create` / transaction):

```ts
await assertCanCreateClient(trainerId);
```

Import from `@/server/billing/entitlements`. Do **not** gate `resendInvite`, `update`, or `remove`.

- [ ] **Step 2: Typecheck**

```bash
cd apps/web && pnpm exec tsc --noEmit
```

Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/server/clients.service.ts
git commit -m "$(cat <<'EOF'
feat(web): enforce free client cap on create and invite

Block new Client rows when free trainer is at FREE_CLIENT_LIMIT.
EOF
)"
```

---

### Task 4: Stripe client, sync helper, checkout + portal routes

**Files:**
- Modify: `apps/web/package.json` (+ lockfile via pnpm)
- Create: `apps/web/src/server/billing/stripe.ts`
- Create: `apps/web/src/server/billing/sync-subscription.ts`
- Create: `apps/web/src/app/api/billing/checkout/route.ts`
- Create: `apps/web/src/app/api/billing/portal/route.ts`

**Interfaces:**
- Consumes: `requireTrainerId`, `appOrigin`, `prisma`, Trainer billing fields
- Produces: `getStripe()`, `ensureStripeCustomer(trainer)`, `applyStripeSubscription(trainerId, sub)`, checkout/portal JSON `{ url: string }`

- [ ] **Step 1: Install Stripe**

```bash
cd apps/web && pnpm add stripe
```

- [ ] **Step 2: `stripe.ts`**

```ts
import Stripe from "stripe";
import { misconfigured } from "@/server/errors";

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw misconfigured("STRIPE_NOT_CONFIGURED", "STRIPE_SECRET_KEY is not set");
  }
  return new Stripe(key);
}

export function proPriceId(): string {
  const id = process.env.STRIPE_PRICE_ID_PRO;
  if (!id) {
    throw misconfigured("STRIPE_PRICE_MISSING", "STRIPE_PRICE_ID_PRO is not set");
  }
  return id;
}
```

If TypeScript rejects `apiVersion`, omit the option or use the version exported by the installed `stripe` package.

- [ ] **Step 3: `sync-subscription.ts`**

```ts
import type Stripe from "stripe";
import type { TrainerPlan, TrainerPlanStatus } from "@trainflow/db";
import { prisma } from "@/server/prisma";

export function mapStripeStatus(
  status: Stripe.Subscription.Status,
): { plan: TrainerPlan; planStatus: TrainerPlanStatus } {
  switch (status) {
    case "active":
      return { plan: "PRO", planStatus: "ACTIVE" };
    case "past_due":
      return { plan: "PRO", planStatus: "PAST_DUE" };
    case "incomplete":
    case "incomplete_expired":
      return { plan: "FREE", planStatus: "INCOMPLETE" };
    case "canceled":
    case "unpaid":
    default:
      return { plan: "FREE", planStatus: "CANCELED" };
  }
}

export async function applyStripeSubscription(
  trainerId: string,
  sub: Stripe.Subscription,
): Promise<void> {
  const mapped = mapStripeStatus(sub.status);
  await prisma.trainer.update({
    where: { id: trainerId },
    data: {
      stripeSubscriptionId: sub.id,
      stripeCustomerId:
        typeof sub.customer === "string" ? sub.customer : sub.customer.id,
      plan: mapped.plan,
      planStatus: mapped.planStatus,
    },
  });
}
```

Also export a small unit-testable `mapStripeStatus` — add `sync-subscription.spec.ts` with 4–5 cases (`active`, `past_due`, `canceled`, `unpaid`, `incomplete`) following the entitlements test style; run `pnpm test -- sync-subscription.spec.ts`.

- [ ] **Step 4: Checkout route**

`apps/web/src/app/api/billing/checkout/route.ts`:

```ts
import { NextRequest } from "next/server";
import { requireTrainerId } from "@/server/auth";
import { prisma } from "@/server/db";
import { appOrigin, jsonOk, withHandler } from "@/server/http";
import { getStripe, proPriceId } from "@/server/billing/stripe";
import { badRequest } from "@/server/errors";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  return withHandler(async () => {
    const { trainerId } = await requireTrainerId();
    const trainer = await prisma.trainer.findUniqueOrThrow({
      where: { id: trainerId },
    });

    const stripe = getStripe();
    let customerId = trainer.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: trainer.email,
        name: trainer.name,
        metadata: { trainerId: trainer.id },
      });
      customerId = customer.id;
      await prisma.trainer.update({
        where: { id: trainer.id },
        data: { stripeCustomerId: customerId },
      });
    }

    const origin = appOrigin();
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: proPriceId(), quantity: 1 }],
      success_url: `${origin}/settings/billing?success=1`,
      cancel_url: `${origin}/settings/billing?canceled=1`,
      client_reference_id: trainer.id,
      metadata: { trainerId: trainer.id },
      subscription_data: { metadata: { trainerId: trainer.id } },
    });

    if (!session.url) {
      throw badRequest("CHECKOUT_FAILED", "Stripe did not return a checkout URL");
    }
    return jsonOk({ url: session.url });
  });
}
```

- [ ] **Step 5: Portal route**

```ts
// POST /api/billing/portal — requireTrainerId, require stripeCustomerId,
// stripe.billingPortal.sessions.create({ customer, return_url: `${appOrigin()}/settings/billing` })
// return jsonOk({ url })
// If no customer: badRequest("NO_CUSTOMER", "...")
```

Mirror Clerk webhook style: `export const runtime = "nodejs"`, `withHandler`.

- [ ] **Step 6: Typecheck + tests + commit**

```bash
cd apps/web && pnpm test -- sync-subscription.spec.ts && pnpm exec tsc --noEmit
git add apps/web/package.json pnpm-lock.yaml apps/web/src/server/billing apps/web/src/app/api/billing
git commit -m "$(cat <<'EOF'
feat(web): add Stripe checkout and billing portal routes

Create customers, start Pro Checkout, open Customer Portal.
EOF
)"
```

---

### Task 5: Stripe webhook

**Files:**
- Create: `apps/web/src/app/api/webhooks/stripe/route.ts`

**Interfaces:**
- Consumes: `getStripe`, `applyStripeSubscription`, `mapStripeStatus`, `prisma`
- Resolve trainer by `subscription.metadata.trainerId` or `stripeCustomerId`

- [ ] **Step 1: Implement webhook**

Pattern (raw body + signature):

```ts
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  return withHandler(async () => {
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!secret) {
      throw misconfigured("WEBHOOK_SECRET_MISSING", "STRIPE_WEBHOOK_SECRET is not configured");
    }
    const stripe = getStripe();
    const payload = await req.text();
    const sig = req.headers.get("stripe-signature");
    if (!sig) throw unauthorized("UNAUTHORIZED", "Missing stripe-signature");

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(payload, sig, secret);
    } catch {
      throw unauthorized("UNAUTHORIZED", "Invalid Stripe signature");
    }

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const trainerId =
          session.metadata?.trainerId ?? session.client_reference_id;
        if (trainerId && session.subscription) {
          const subId =
            typeof session.subscription === "string"
              ? session.subscription
              : session.subscription.id;
          const sub = await stripe.subscriptions.retrieve(subId);
          await applyStripeSubscription(trainerId, sub);
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const trainerId =
          sub.metadata?.trainerId ??
          (
            await prisma.trainer.findFirst({
              where: {
                stripeCustomerId:
                  typeof sub.customer === "string"
                    ? sub.customer
                    : sub.customer.id,
              },
              select: { id: true },
            })
          )?.id;
        if (trainerId) await applyStripeSubscription(trainerId, sub);
        break;
      }
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId =
          typeof invoice.customer === "string"
            ? invoice.customer
            : invoice.customer?.id;
        if (customerId) {
          await prisma.trainer.updateMany({
            where: { stripeCustomerId: customerId },
            data: { planStatus: "PAST_DUE", plan: "PRO" },
          });
        }
        break;
      }
      default:
        break;
    }

    return jsonOk({ received: true });
  });
}
```

On `customer.subscription.deleted`, `applyStripeSubscription` with canceled status must set `plan=FREE` (via `mapStripeStatus`).

- [ ] **Step 2: Typecheck + commit**

```bash
cd apps/web && pnpm exec tsc --noEmit
git add apps/web/src/app/api/webhooks/stripe
git commit -m "$(cat <<'EOF'
feat(web): sync trainer plan from Stripe webhooks

Checkout and subscription lifecycle update Postgres entitlements.
EOF
)"
```

---

### Task 6: Billing settings page + nav

**Files:**
- Create: `apps/web/src/app/(trainer)/settings/billing/page.tsx`
- Create: `apps/web/src/components/billing-actions.tsx` (client: fetch POST checkout/portal then `window.location = url`)
- Modify: `apps/web/src/components/trainer-shell.tsx` — add `{ href: "/settings/billing", labelKey: "billing" }`
- Modify: `apps/web/messages/en.json`, `pt-BR.json` — `nav.billing`, `billing.*` namespace

**Interfaces:**
- Page uses `requireTrainerId` + prisma (RSC) or a small server helper; shows plan, status, usage `count / limit` or Unlimited
- Client buttons call `/api/billing/checkout` and `/api/billing/portal` with credentials (same pattern as other client fetches — use `fetch` with relative URL)

- [ ] **Step 1: i18n keys**

Add under `nav`: `"billing": "Billing"` / `"Cobrança"`.  
Add namespace `billing`: title, planFree, planPro, status labels, usage (`{count}/{limit}`), unlimited, upgrade, manage, successFlash, canceledFlash, limitHint, configureMissing (optional).

- [ ] **Step 2: Billing page + actions**

RSC page:

- Load trainer billing fields + `prisma.client.count`
- Show flashes from `searchParams.success` / `canceled`
- Render `<BillingActions hasCustomer={!!stripeCustomerId} isPro={...} />`

Client component posts to checkout/portal and redirects to returned `url`. Handle errors with `alert` or inline text (keep minimal).

- [ ] **Step 3: Shell nav link**

Add to `links` array; `isActive` already handles prefix for non-dashboard routes.

- [ ] **Step 4: Typecheck + commit**

```bash
cd apps/web && pnpm exec tsc --noEmit
git add apps/web/src/app/\(trainer\)/settings apps/web/src/components/billing-actions.tsx apps/web/src/components/trainer-shell.tsx apps/web/messages
git commit -m "$(cat <<'EOF'
feat(web): add trainer billing settings page

Upgrade/manage CTAs and nav link for Stripe Checkout/Portal.
EOF
)"
```

---

### Task 7: Clients UI + marketing pricing

**Files:**
- Modify: `apps/web/src/app/(trainer)/clients/page.tsx`
- Modify: `apps/web/src/app/(trainer)/clients/new/page.tsx` (and invite page) — show limit message / redirect link when at cap
- Modify: `apps/web/src/components/marketing/pricing-section.tsx`
- Modify: `apps/web/messages/en.json`, `pt-BR.json` (landing Free/Pro copy, faq5A; clients.limitReached)

**Interfaces:**
- Consumes: trainer plan via prisma in RSC (same as billing page) or pass from a tiny `getTrainerBillingSummary(trainerId)` helper colocated under `server/billing/`

- [ ] **Step 1: Helper (optional but preferred)**

`getBillingSummary(trainerId)` → `{ entitled, plan, planStatus, clientCount, limit }`. Use on clients list + billing page to avoid duplication.

- [ ] **Step 2: Clients list**

When `!entitled && clientCount >= limit`:
- Replace primary New/Invite links with disabled look + Link to `/settings/billing`
- Show `t("limitReached")` copy

- [ ] **Step 3: New + invite pages**

If at limit, show message + billing link instead of the form (server-side check). Still rely on API 403 as backstop.

- [ ] **Step 4: Marketing**

In `pricing-section.tsx`:
- Keep Free + Pro only (remove Enterprise column or change grid to `md:grid-cols-2`).
- Free: price `R$0` / copy “2 clients”; CTA `/sign-up`.
- Pro: BRL price string in i18n (placeholder e.g. `R$79` — operator edits); CTA `/sign-up` (signed-in users can use billing page from app).
- Update `pricingSubtitle` and `faq5A` to describe free cap + Pro upgrade (remove “billing not required for demo”).

- [ ] **Step 5: Typecheck + commit**

```bash
cd apps/web && pnpm exec tsc --noEmit
git add apps/web/src/app/\(trainer\)/clients apps/web/src/components/marketing/pricing-section.tsx apps/web/src/server/billing apps/web/messages
git commit -m "$(cat <<'EOF'
feat(web): surface client cap in UI and simplify pricing

Block CTAs at free limit; Free+Pro landing with BRL Pro copy.
EOF
)"
```

---

### Task 8: Deploy docs + QA gate

**Files:**
- Modify: `docs/deploy.md`
- Modify: root or `apps/web` `.env.example` if it exists (add Stripe vars as placeholders)

- [ ] **Step 1: Document env + operator steps**

Add a **Stripe** section to `docs/deploy.md`:

| Variable | Notes |
|----------|--------|
| `STRIPE_SECRET_KEY` | `sk_test_…` / `sk_live_…` |
| `STRIPE_WEBHOOK_SECRET` | `whsec_…` |
| `STRIPE_PRICE_ID_PRO` | BRL monthly Price id |
| `FREE_CLIENT_LIMIT` | Optional, default `2` |

Operator checklist: create Product+Price (BRL), enable Customer Portal, webhook → `https://<host>/api/webhooks/stripe` (events listed in spec), set env, redeploy, `pnpm db:migrate:deploy` for billing migration.

- [ ] **Step 2: Automated verification**

```bash
cd apps/web && pnpm test && pnpm exec tsc --noEmit
```

Expected: entitlements + sync-subscription tests pass; tsc exit 0.

- [ ] **Step 3: Manual smoke (document in report if no Stripe keys)**

If keys available: Stripe CLI `listen` → checkout → webhook → create 3rd client.  
If not: note deferred; unit tests + gate code still ship.

- [ ] **Step 4: Commit docs**

```bash
git add docs/deploy.md
# and .env.example if changed
git commit -m "$(cat <<'EOF'
docs: document Stripe billing env and webhook setup

Operator checklist for BRL Pro Price and client cap.
EOF
)"
```

---

## Spec coverage checklist

| Spec requirement | Task |
|------------------|------|
| Trainer billing fields + enums | 1 |
| Entitlement rules + FREE_CLIENT_LIMIT | 2 |
| Gate create client | 3 |
| Gate invite (creates client) | 3 |
| Checkout + portal | 4 |
| Webhooks + status mapping + past_due grace | 5 |
| `/settings/billing` + nav | 6 |
| Clients UI at limit | 7 |
| Marketing Free+Pro, FAQ | 7 |
| deploy.md / env | 8 |
| Price not hardcoded (Price id + i18n) | 4, 7, 8 |

---

## Out of scope

- Production Clerk / custom domain
- Annual plans / multi-currency
- Export paywalls
- Legal pages (link later from Stripe Portal settings)
