# Mobile polish (Approach 1) — design

**Date:** 2026-07-23  
**Scope:** Marketing homepage + authenticated trainer/client shells (end-to-end usable on phone)  
**Approach:** Polish pass — fix crowding/overflow; no mobile card workout editor rewrite

## Goals

- Phone users can navigate marketing and sign up without a crushed header.
- Trainer pages (dashboard, clients, billing) don’t collide titles with actions.
- Workout spreadsheet remains desktop-oriented but toolbar + scroll are tolerable on phone.
- Client portal matches design tokens and scrolls tables safely.

## Non-goals

- Rebuilding the workout editor as mobile cards
- New features, pricing, or branding overhaul
- Desktop layout changes beyond incidental shared class tweaks

## Marketing

1. **Nav (`marketing-nav.tsx`)**
   - Mobile: logo (slightly smaller) + primary CTA; Sign in as ghost or compact secondary; tighter gaps.
   - AppearanceControls denser on small screens (reuse existing controls; reduce padding/gaps only).
   - No full hamburger rewrite required if CTAs fit after compaction.

2. **Hero / mockup**
   - Slightly reduced mobile type/padding; CTAs stack full-width under ~`sm`.
   - Product mockup: allow horizontal scroll on the sample table; avoid clipped exercise names.

3. **Container / sections**
   - `Container`: `px-4 sm:px-6` (or equivalent).
   - Keep section stacking; minor spacing tweaks only where cramped.

## Trainer app

1. **Shell (`trainer-shell.tsx`)**
   - Mobile top bar: hamburger + compact brand/title; Appearance + Clerk stay.
   - Keep existing `md` drawer behavior.

2. **Page headers**
   - Dashboard, clients (and similar): `flex-wrap`, gap, stacked actions on narrow widths.

3. **Clients search**
   - Full-width / wrapping search + buttons on mobile.

4. **Workout spreadsheet**
   - Keep `min-w` table + `overflow-x-auto`.
   - Toolbar: wrap cleanly; optional subtle scroll hint (copy or CSS fade).
   - No structural editor rewrite.

## Client portal

1. Replace hard-coded `zinc-*` with theme tokens (`background`, `border`, `foreground`, `muted`, etc.).
2. Keep `overflow-x-auto` on day/exercise tables.
3. Tighten top bar similarly to marketing (logo size + control density).

## Acceptance

- [ ] Marketing sticky nav usable at ~375px width (no overlapping controls).
- [ ] Hero CTAs readable and tappable; mockup not clipped awkwardly.
- [ ] Dashboard / clients headers wrap; search row doesn’t overflow.
- [ ] Spreadsheet opens on phone with scrollable table + usable toolbar.
- [ ] Portal looks consistent with theme; tables scroll horizontally if needed.
- [ ] Desktop (`md+`) looks unchanged aside from shared padding tweaks.

## Implementation order

1. Marketing nav + container + hero/mockup  
2. Trainer shell + page headers + clients search  
3. Workout toolbar polish  
4. Client portal tokens + bar  
5. Manual check at 375px / deploy  
