# Trainer app surface polish (Approach A) — design

**Date:** 2026-07-25  
**Scope:** Authenticated trainer app only (shell + list/detail entry pages).  
**Approach:** Surface polish — same structure and flows; denser hierarchy, clearer status, less “admin flat.”

## Goal

After sign-in, dashboard / clients / workouts / templates / exercises / billing feel like the same TrainFlow as the public landing — not a separate plain admin tool.

## Non-goals

- Client portal redesign (follow-up)
- Landing redesign or marketing atmosphere inside the app
- New product features, routes, or data model changes
- Workout spreadsheet / wizard interaction rewrite
- Icon nav pack or full visual system (Approach B)

## Constraints

- Keep shared theme tokens (`--primary` teal, `background`, `card`, `muted`, `border`, `rounded-xl`, `shadow-card`).
- Preserve existing page layouts (title + actions → content cards/lists).
- Respect mobile polish from `2026-07-23-mobile-polish-design.md` (no title/action collisions).
- No Framer Motion; no marketing reveal/parallax in app chrome.
- i18n: any new subtitles/empty-state copy in `en.json` + `pt-BR.json`.

## Surfaces in scope

| Area | Path (representative) |
|------|------------------------|
| Shell | `trainer-shell.tsx` |
| Dashboard | `(trainer)/dashboard/page.tsx` |
| Clients | `(trainer)/clients/page.tsx` (+ list chrome on related pages where header is shared) |
| Workouts entry | workouts list/new header surfaces only |
| Templates | `(trainer)/templates/...` |
| Exercises | `(trainer)/exercises/...` |
| Billing | `(trainer)/settings/billing/...` |

## Design

### 1. Shared `PageHeader`

Small reusable header used by in-scope pages:

- Title: `text-2xl font-semibold tracking-tight`
- Optional muted subtitle (one short line)
- Right-side action slot (existing primary/secondary CTAs)

No cards around the header. Actions keep current `buttonClassName` sizes (`sm` where already used).

### 2. Status `Badge` variants

Extend `Badge` with semantic variants (same `rounded-full` shape):

| Meaning | Treatment |
|---------|-----------|
| Active / success | Primary tint (`bg-primary/10 text-primary border-primary/20`) |
| Pending / invited | Default muted (current look) |
| Draft / archived / inactive | Quieter muted / lower contrast |

Wire dashboard program statuses and clients list statuses to these variants. Do not invent new status values.

### 3. Lists and empty states

- List rows: `hover:bg-muted/40` (or equivalent) on interactive rows.
- Keep existing primary actions (Open / Edit / Invite patterns); make affordance readable without underline-only reliance where easy.
- Empty states inside `Card`: short sentence + primary CTA link/button (not a single muted line alone).

### 4. Dashboard

Keep structure: title row → 3 stat cards → recent programs → clients slice.

- Stat numbers: `tabular-nums`; labels remain muted `text-sm`.
- Optional thin primary accent on stat cards (left border or top hairline) — subtle, not a new card type.
- Recent/client lists use Badge variants + row hover.

### 5. Shell

- Sidebar active link: stronger cue — `text-primary` and/or left accent bar; keep `bg-muted` if useful.
- Main content area: very light depth (`bg-muted/20` on main or equivalent) so pages are not flat `background` forever.
- Header unchanged in structure (`bg-card/80 backdrop-blur-md`) — already aligned with marketing nav.
- No marketing `Atmosphere` blurs in the shell.

### 6. Clients / other list pages

- Apply `PageHeader` + empty-state pattern.
- Optional: wrap search/filter strip in `bg-muted/30` or light bordered strip so the toolbar feels intentional (not a bare form).
- Same Badge / row hover treatment.

## Acceptance

- Signed-in trainer can tell dashboard and clients were visually updated (header, badges, row hover, empty states, shell active + main depth).
- Landing and app still share teal tokens; app does not copy cinematic dark bands or reveal motion.
- No regressions to mobile header crowding or list scroll behavior.
- Light and dark theme both remain readable.

## Out of scope follow-ups

- Client portal surface polish
- Approach B (atmosphere, section banding, icon nav)
