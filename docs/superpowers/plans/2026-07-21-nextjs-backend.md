# Next.js-only backend (drop Railway) — Implementation Plan

> **For agentic workers:** Implement task-by-task. Keep `apps/api` until Next routes pass smoke.

**Goal:** Run TrainFlow entirely on Vercel (Next.js App Router) + Supabase Postgres + Clerk; no Railway/Nest for production.

**Architecture:** Port Nest services into `apps/web/src/server/*`; expose same paths under `/api/*`; point web clients at same-origin `/api`; webhooks at `/api/webhooks/clerk/trainer` and `/api/webhooks/clerk/invite`.

**Tech Stack:** Next.js 14 Route Handlers, Prisma (`@trainflow/db`), Clerk (`auth()` + `@clerk/backend` + svix), ExcelJS, PDFKit.

## Global Constraints

- PostgreSQL/Supabase only — no SQLite.
- No secrets in git.
- Preserve all trainer MVP features.
- Do not delete `apps/api` until verified.

---

### Task 1: Web Prisma + server auth helpers
### Task 2: Port domain services (clients, trainers, invites, exercises, templates, workouts, exports)
### Task 3: Route Handlers for all 36 endpoints (incl. webhooks under new paths)
### Task 4: Retarget apiFetch / browserApiFetch / api-download to `/api`
### Task 5: Docs + env examples; remove Railway from deploy docs
### Task 6: Lint, tsc, tests, migrate validate, local smoke
