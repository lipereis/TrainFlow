# TrainFlow — Premium SaaS Redesign Phase 4 (Dashboard + clients)

**Date:** 2026-07-22  
**Status:** Approved design (pending implementation plan)  
**Scope:** Visual restyle of trainer dashboard and clients surfaces  
**App:** `apps/web`

## Goals

Restyle the trainer **dashboard** and **clients** flows with Phase 1 tokens and UI primitives so they match the marketing site and Phase 3 chrome — without changing data fetching, forms, or API behavior.

## Non-goals

- New dashboard metrics, charts, activity feeds, or revenue (real or fake).
- Shared `PageHeader` system as a separate abstraction layer (optional tiny local helpers OK).
- Wizard, spreadsheet, templates, exercises pages (Phase 5+).
- Client portal page body (Phase 6).
- Clerk / Prisma / schema / API / business-logic changes.

## Decisions

| Topic | Choice |
|-------|--------|
| Depth | **Visual restyle only** (option A) |
| Approach | In-place class + primitive swaps |
| Primitives | `Card`, `Badge`, `Input`, `buttonClassName` / `Button` |
| Data | Existing `apiFetch` calls and DTO shapes unchanged |
| Status display | `Badge` for client/program status labels |
| CTAs | Primary / secondary via `buttonClassName` |

## Hard constraints

- Do **not** modify business logic, authentication, Clerk, Supabase, Prisma, schema, or API routes/handlers.
- Keep search query param `q`, delete/invite/edit flows, and form submit behavior identical.
- i18n keys stay; only presentation classes (and primitive wrappers) change unless a missing key blocks UI (unlikely).

## Surfaces

### Dashboard — `apps/web/src/app/(trainer)/dashboard/page.tsx`

- Title + New client / New workout CTAs → token typography + `buttonClassName`
- Three stat tiles → `Card` (or card-equivalent classes)
- Recent programs list → bordered `Card` list; status as `Badge` where practical
- Clients preview list → same
- Empty / error copy unchanged; spacing/typography improved

### Clients list — `…/clients/page.tsx`

- Header CTAs (new / invite)
- Search form: `Input` + secondary button
- List rows in card; status `Badge`; delete control styling only if presentational

### Client detail — `…/clients/[clientId]/page.tsx`

- Profile fields in card layout; status badge; action links as buttons/links with token styles
- Related programs list restyled similarly

### Client create / edit / invite

- `clients/new/page.tsx`, `clients/[clientId]/edit/*`, `clients/invite/page.tsx`
- `client-form.tsx` / `edit-form.tsx`: inputs/labels/buttons → tokens + `Input` / `buttonClassName` where straightforward
- No field additions/removals or validation changes

### Related presentational

- `delete-client-button.tsx`: button classes only (danger can stay red utility for clarity)

## Acceptance

- [ ] Dashboard and clients pages look coherent with Phase 1–3 in light and dark.
- [ ] Search, open client, create/edit, invite, delete still work (same URLs/APIs).
- [ ] No new network calls or invented stats.
- [ ] Diff limited to UI under `apps/web` pages/components listed (no `api/` or `packages/db`).
- [ ] `pnpm --filter @trainflow/web exec tsc --noEmit` passes.

## Follow-on

Phase 5 — Wizard + spreadsheet polish · Phase 6 — Portal body + auth pages · Phase 7 — Motion  
