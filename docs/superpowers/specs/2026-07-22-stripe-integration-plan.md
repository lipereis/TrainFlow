# TrainFlow — Stripe integration plan (Billing + Invoicing + Tax)

**Date:** 2026-07-22  
**Business:** https://trainflow-chi.vercel.app  
**Description:** Software for personal trainers to manage clients and training plans.  
**Products requested:** Billing, Invoicing, Tax  

> Generated with Stripe best-practice skills (MCP `stripe_implementation_planner` was unavailable in this session — connect `https://mcp.stripe.com` and re-run for live Dashboard actions).

## Recommended stack (matches SaaS + existing code)

| Need | Stripe product | TrainFlow approach |
|------|----------------|--------------------|
| Recurring Pro plan (BRL) | **Billing** + Checkout `mode: subscription` | Already implemented |
| Self-serve cancel / payment method | **Customer Portal** | Already implemented |
| Receipts / subscription invoices | **Invoicing** (automatic with Billing) | Enabled by subscriptions; no custom Invoice UI required for v1 |
| Sales tax / VAT / GST | **Stripe Tax** | **Gap** — enable after tax registration |

Do **not** build a custom PaymentIntent renewal loop. Keep Checkout + Billing + Portal.

---

## Catalog model

- **One Product:** `TrainFlow Pro` (separate Product per plan tier — only one paid tier for v1).
- **One Price (v1):** recurring monthly, currency **BRL** → `STRIPE_PRICE_ID_PRO`.
- Optional later: second Price on same Product for annual BRL.
- Set Product **tax code** (SaaS/digital — pick from [Stripe tax codes](https://docs.stripe.com/tax/tax-codes.md); do not guess) and Price **`tax_behavior`** (`exclusive` or `inclusive`).

---

## What is already built in the repo

| Piece | Location | Status |
|-------|----------|--------|
| Trainer billing fields | `packages/db` (`plan`, `planStatus`, Stripe ids) | Done |
| Entitlements + free 2-client cap | `apps/web/src/server/billing/entitlements.ts` | Done |
| Checkout Session (subscription) | `POST /api/billing/checkout` | Done |
| Customer Portal | `POST /api/billing/portal` | Done |
| Webhooks | `POST /api/webhooks/stripe` | Done |
| Billing settings UI | `/settings/billing` | Done |
| Cap UX + landing Free/Pro | clients pages + marketing | Done |
| Env docs | `docs/deploy.md` § Stripe | Done |

**Good practices already followed:**

- Checkout omits `payment_method_types` (dynamic payment methods).
- Webhooks verify signatures; plan sync is server-side.
- `payment_failed` syncs via subscription status (does not invent Pro).
- Checkout rejects already-entitled trainers (`ALREADY_PRO`).

---

## Gaps vs Stripe best practices (priority)

### P0 — Operator setup (blocks real charges)

1. Create Product + BRL monthly Price in Stripe (Test mode first).
2. Set on Vercel (and local `.env.local`): `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID_PRO`. Prefer a **restricted key** (`rk_…`) with Billing/Checkout/Customers/Webhooks only when ready for production hygiene.
3. Webhook endpoint: `https://trainflow-chi.vercel.app/api/webhooks/stripe` with events listed in `docs/deploy.md`.
4. Enable **Customer Portal** (cancel + update payment method).
5. Confirm billing migration deployed (`pnpm db:migrate:deploy` — already applied on your current Supabase).

### P1 — Stripe Tax (requested; not in code yet)

**Do not enable blindly.** Stripe Tax collects **nothing** until you have an **active registration** in the customer’s jurisdiction (Dashboard → Tax → Registrations). Enabling `automatic_tax` without a registration looks “on” but charges R$0 tax.

After you have at least one Collecting registration:

1. Set Product tax code + Price `tax_behavior` in Dashboard.
2. Update Checkout:

```ts
await stripe.checkout.sessions.create({
  mode: "subscription",
  customer: customerId,
  line_items: [{ price: proPriceId(), quantity: 1 }],
  automatic_tax: { enabled: true },
  // Returning customers: refresh address used for tax
  customer_update: { address: "auto" },
  // Optional B2B
  // tax_id_collection: { enabled: true },
  success_url: `${origin}/settings/billing?success=1`,
  cancel_url: `${origin}/settings/billing?canceled=1`,
  client_reference_id: trainer.id,
  metadata: { trainerId: trainer.id },
  subscription_data: { metadata: { trainerId: trainer.id } },
});
```

3. Smoke a test Checkout and expand `line_items.data.taxes` if tax is R$0 — check `taxability_reason` / registrations.

### P2 — Invoicing

Subscription Billing **already creates invoices** for each cycle. For v1:

- Use Dashboard + Customer Portal + Stripe-hosted invoice PDFs/emails.
- No custom “create invoice” API in TrainFlow unless you sell one-off services later.

Optional polish: Portal config to show invoice history; email branding in Stripe.

### P3 — Hardening / polish

- `integration_identifier` on Checkout (API 2026-03-25+): e.g. `trainflow_pro_xxxxxxxx`.
- Prefer restricted API keys in production.
- Go-live: switch Test → Live keys, new live webhook secret, live Price id.
- Legal: Terms/Privacy URLs in Checkout/Portal settings.
- Tax advisor: BR SaaS obligations (ISS/etc.) — Stripe Tax coverage varies by jurisdiction; confirm with a professional.

---

## Security

- Never commit `sk_` / `rk_` / `whsec_` keys; never paste them into chat.
- Put secrets only in Vercel env + local gitignored `.env.local`.
- Webhook route must keep raw body + `constructEvent` (already does).

---

## Acceptance smoke

- [ ] Free trainer: 3rd client → `CLIENT_LIMIT_REACHED`
- [ ] `/settings/billing` → Checkout (test card) → webhook → Pro → 3rd client OK
- [ ] Portal cancel → webhook → free again; existing clients kept
- [ ] (Tax) With registration: Checkout shows tax line; without registration: documented as not collecting

---

## MCP next step

1. Reload Cursor / MCP tools after adding Stripe server (`~/.cursor/mcp.json` + `.cursor/mcp.json`).
2. Authenticate Stripe MCP when prompted (OAuth).
3. Confirm tool `stripe_implementation_planner` appears, then re-run planner for live Product/Price creation if desired.
