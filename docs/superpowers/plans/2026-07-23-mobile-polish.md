# Mobile Polish Implementation Plan

> **For agentic workers:** Implement tasks in order. Spec: `docs/superpowers/specs/2026-07-23-mobile-polish-design.md`

**Goal:** Phone-usable marketing + trainer/client chrome without rewriting the workout editor.

**Tech:** Next.js App Router, Tailwind, existing `Button` / `Container` / `BrandLogo` / `TrainerShell`.

---

### Task 1: Marketing density

**Files:** `container.tsx`, `marketing-nav.tsx`, `brand-logo.tsx` (optional `xs` already exists), `hero.tsx`, `product-mockup.tsx`, `appearance-controls.tsx`

- Container: `px-4 sm:px-6`
- Nav: smaller logo on mobile (`size="xs"` under `sm`, or CSS), hide Sign in text button under `sm` optional — prefer: Sign in `hidden sm:inline-flex`, keep primary CTA; tighter gaps
- AppearanceControls: `gap-1 sm:gap-2`
- Hero: stack CTAs `flex-col sm:flex-row` with `w-full sm:w-auto`; slightly less padding on mobile
- Mockup: wrap table in `overflow-x-auto`

**Verify:** ~375px marketing header doesn’t overflow.

### Task 2: Trainer shell + page headers

**Files:** `trainer-shell.tsx`, `dashboard/page.tsx`, `clients/page.tsx` (and invite/billing headers if same pattern)

- Mobile top bar: add compact BrandLogo or “TrainFlow” text between hamburger and controls
- Dashboard/clients: `flex-wrap gap-3` headers; clients search `flex-col sm:flex-row`

**Verify:** Dashboard + clients at 375px.

### Task 3: Workout toolbar

**Files:** `workout-spreadsheet.tsx` (toolbar area)

- Ensure toolbar wraps with gap; optional muted scroll hint above table

**Verify:** Workout editor opens; toolbar wraps; table scrolls.

### Task 4: Client portal

**Files:** `(client)/layout.tsx`, `portal/page.tsx`

- Replace `zinc-*` with theme tokens
- Compact logo / controls like marketing

**Verify:** Portal themed + tables scroll.

### Task 5: Deploy

- `vercel --prod` from monorepo root (or push if preferred)
