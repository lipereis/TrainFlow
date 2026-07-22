# TrainFlow — Premium SaaS Redesign Phase 3 (App chrome)

**Date:** 2026-07-22  
**Status:** Approved design (pending implementation plan)  
**Scope:** Signed-in trainer + client **shell chrome only**  
**App:** `apps/web`

## Goals

Apply Phase 1 design tokens to the authenticated app chrome so the product feels continuous with the marketing site: trainer sidebar/drawer/header and client portal header.

## Non-goals

- Dashboard cards, client list/detail bodies, wizard, spreadsheet, portal content (Phases 4–6).
- Shared `PageHeader` / empty-state system (deferred with B option; not chosen).
- Framer Motion / app-wide microinteractions (Phase 7).
- Nav icons pack, new routes, or information architecture changes.
- Any Clerk / Prisma / API / schema / business-logic changes.

## Decisions

| Topic | Choice |
|-------|--------|
| Depth | **Chrome only** (option A) |
| Approach | Restyle in place inside `TrainerShell` + client layout |
| Tokens | Reuse Phase 1 CSS vars / Tailwind (`background`, `border`, `muted`, `primary`, `card`) |
| Logo | `BrandLogo` size `nav` in trainer sidebar + both headers |
| Drawer behavior | Unchanged (backdrop, Escape, focus trap, scroll lock, aria-*) |
| Active nav | Subtle `bg-muted` + `font-medium`; optional thin primary accent (not loud) |
| Appearance controls | Light visual alignment only; no full redesign |

## Hard constraints

- Do **not** modify business logic, authentication, Clerk integration, Supabase, Prisma, database schema, or API behavior.
- Keep mobile drawer accessibility contract intact.
- Page bodies may remain on zinc utilities until later phases.

## Surfaces to update

### Trainer (`TrainerShell`)

1. **Desktop sidebar** — `bg-card` / `bg-background`, `border-border`, token text colors; logo `nav`.
2. **Nav links** — inactive muted; active muted surface + medium weight; rounded-xl to match primitives.
3. **Mobile drawer** — same panel styles; backdrop stays dimmed overlay.
4. **Top header** — token border/background; menu button uses border-border / hover muted (align with ghost button language).
5. **Main padding** — keep layout; background inherits app background token via body/shell.

### Client (`(client)/layout.tsx`)

1. **Header** — match trainer header tokens; logo `nav` (was `sm`, too large for bar).
2. **Content wrapper** — optional `bg-background` only; do not restyle portal page cards yet.

## Acceptance

- [ ] Trainer chrome (desktop + mobile drawer) uses Phase 1 tokens in light and dark.
- [ ] Client portal header matches the same language; logo fits the bar.
- [ ] Drawer still closes via backdrop, link, Escape; focus trap + scroll lock still work.
- [ ] No changes under `apps/web/src/app/api/**`, `packages/db/**`, or auth server helpers beyond pure presentational imports if any.
- [ ] `pnpm --filter @trainflow/web exec tsc --noEmit` passes.

## Follow-on

Phase 4 — Dashboard + clients surfaces · Phase 5 — Wizard/spreadsheet polish · Phase 6 — Portal body + auth pages · Phase 7 — Motion  
