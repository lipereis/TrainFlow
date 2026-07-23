# TrainFlow — Premium SaaS Redesign Phase 5 (Wizard + spreadsheet)

**Date:** 2026-07-22  
**Status:** Approved design (pending implementation plan)  
**Scope:** Visual restyle of workout wizard, spreadsheet chrome, templates & exercises pages  
**App:** `apps/web`

## Goals

Bring the trainer **workout creation/editing** surfaces (and templates/exercises lists) in line with Phase 1–4 tokens and primitives — without changing autosave, DnD, exports, or API behavior.

## Non-goals

- Rebuilding the exercise table layout or removing horizontal scroll.
- Mobile-first spreadsheet redesign.
- Client portal body or Clerk auth pages (Phase 6).
- Framer Motion / microinteraction pass (Phase 7).
- Clerk / Prisma / schema / API / business-logic changes.

## Decisions

| Topic | Choice |
|-------|--------|
| Depth | Option **A** — wizard + spreadsheet chrome + templates/exercises |
| Approach | Tokenize shared `wizard/types.ts` classes first, then remaining zinc |
| Shared classes | Update `btnPrimary`, `btnSecondary`, `inputClass`, `labelClass` to Phase 1 tokens |
| Table | Keep `min-w-*` + `overflow-x-auto`; restyle borders/inputs/headers only |
| Print | Preserve `@media print` rules in `globals.css` and `no-print` usage |

## Hard constraints

- Do **not** modify business logic, authentication, Clerk, Supabase, Prisma, schema, or API routes.
- Keep autosave, patch payloads, drag-and-drop, export downloads, and wizard step flow identical.
- Prefer cascading via shared class constants to minimize drift.

## Surfaces

### Shared (`apps/web/src/components/workouts/wizard/types.ts`)

- Replace zinc-based `inputClass`, `labelClass`, `btnPrimary`, `btnSecondary` with token equivalents (`border-border`, `bg-card`, `bg-primary`, `rounded-xl`, etc.), compatible with existing `disabled:` usage.

### Wizard

- `workout-wizard.tsx`, `progress-indicator.tsx`, `step-*.tsx`, `exercise-picker-modal.tsx`
- Remaining hard-coded zinc → tokens / `Card` where it is clearly a surface
- Modal: card surface, border-border, backdrop unchanged in behavior

### Spreadsheet

- `workout-spreadsheet.tsx` toolbar/CTAs (may still import `btnPrimary`/`btnSecondary`)
- `program-header.tsx`, `day-section.tsx`, `summary-cards.tsx`, `autosave-badge.tsx`, `observation-field.tsx`, `exercise-table.tsx`
- Cell inputs / borders → token borders and muted headers; keep interaction model

### Pages

- `(trainer)/workouts/new/page.tsx`, `(trainer)/workouts/[workoutId]/page.tsx` — light wrappers if needed
- `(trainer)/templates/page.tsx`, `(trainer)/exercises/page.tsx`, `create-exercise-form.tsx` — list/forms chrome like Phase 4 clients

## Acceptance

- [ ] Wizard steps and spreadsheet look coherent with Phase 1–4 in light/dark.
- [ ] Create workout → edit spreadsheet → autosave → export PDF/Excel still work.
- [ ] Templates and exercises pages match token language.
- [ ] Print stylesheet still hides chrome / formats table as before.
- [ ] No API/auth/schema changes; `pnpm --filter @trainflow/web exec tsc --noEmit` passes.

## Follow-on

Phase 6 — Portal body + auth pages · Phase 7 — Motion  
