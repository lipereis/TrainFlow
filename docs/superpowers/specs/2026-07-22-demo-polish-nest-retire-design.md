# TrainFlow — Demo polish + full Nest retire

**Date:** 2026-07-22  
**Status:** Approved design (pending implementation plan)  
**Apps:** `apps/web` (prod), remove `apps/api` (legacy Nest)

## Goals

1. **Demo polish:** Walk a fixed production smoke checklist and fix clear bugs / rough demo UX found along the way.
2. **Full Nest retire:** Remove the legacy Nest API and Railway/Docker packaging so the repo matches Vercel-only production.

## Non-goals

- Custom domain or Clerk Production migration.
- Spreadsheet mobile redesign.
- Rewriting historical `docs/superpowers/*` plans/specs (leave as archive).
- New product features beyond fixes discovered in the smoke pass.
- Observability (Sentry) — separate follow-up.

## Decisions

| Topic | Choice |
|-------|--------|
| Order | Nest retire first, then prod smoke + fixes |
| Nest retirement | **Full delete** of `apps/api` and Nest deploy artifacts |
| Historical docs | Keep `docs/superpowers/*` unchanged |
| Demo polish scope | Checklist-driven; fix only clear issues |
| CI after retire | `workout-math` + `web` (tsc + jest); no `@trainflow/api` |

## Part A — Full Nest retire

### Delete

- `apps/api/` (entire package)
- Root Nest deploy artifacts: `Dockerfile`, `docker-entrypoint.api.sh`, `railway.toml`, `.dockerignore` (Nest image context)

### Update

- `.github/workflows/ci.yml` — remove `@trainflow/api` unit/e2e/build steps; keep db migrate/seed, shared-types, workout-math, web tsc + web test, lint
- `README.md` — monorepo = `apps/web` + `packages/*`; remove Nest/Railway/legacy API language; scripts point at web + workout-math
- `docs/deploy.md` — remove “legacy Nest remains until retired”; Vercel-only statement
- `.env.example` — ensure no Nest/Railway-only vars (already Next-oriented; scrub any leftover API_PORT / WEB_ORIGIN / NEXT_PUBLIC_API_URL if present)
- Any workspace references that assume `apps/api` (grep `pnpm-workspace` is fine with `apps/*` after delete)

### Verify

- `pnpm install` / `pnpm lint` / `pnpm --filter @trainflow/web test` / `pnpm --filter @trainflow/workout-math test` succeed without `@trainflow/api`
- No remaining required imports of `@trainflow/api` from `apps/web` or `packages/*`

## Part B — Demo polish

### Production smoke checklist

Against `https://trainflow-chi.vercel.app` (or local if prod session unavailable):

1. `GET /api/health` → ok / db true  
2. Trainer sign-in → dashboard  
3. Clients list; open or create client  
4. Open workout spreadsheet → export PDF and Excel  
5. Invite UI reachable (send only if safe/test client)  
6. Client `/portal` → Download PDF / Excel  
7. Narrow viewport: trainer menu drawer open/close (backdrop, Escape, link)

### Fix policy

- **In scope:** Broken flows, 500s, missing i18n on touched chrome, confusing demo-only copy that hurts a first demo, obvious mobile-nav regressions  
- **Out of scope:** Large redesigns, performance projects, “nice to have” refactors unrelated to checklist failures  

Document findings + fixes in the implementation PR/commit messages (or a short checklist note in the plan).

## Acceptance

- [ ] `apps/api` and Nest Docker/Railway files gone  
- [ ] CI green without Nest  
- [ ] README + deploy docs describe Vercel-only  
- [ ] Smoke checklist completed; clear issues fixed and deployed (or explicitly noted as deferred with reason)

## Follow-ups (explicitly later)

- Sentry / uptime  
- Custom domain + Clerk live keys  
- Deeper portal UX / spreadsheet mobile editing  
