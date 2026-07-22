# TrainFlow — Premium SaaS Redesign Phase 1 + 2

**Date:** 2026-07-22  
**Status:** Approved design (pending implementation plan)  
**Scope:** Design tokens + UI primitives + marketing landing page  
**App:** `apps/web` only

## Goals

1. Establish a premium, Linear/Vercel-inspired **design system** (tokens, typography, base components).
2. Replace the logged-out homepage with a **conversion-focused marketing landing** (Stripe/Linear quality bar).
3. Preserve **all** existing business logic, auth, Clerk, Prisma/Supabase, schema, and API behavior.

## Non-goals

- App shell / sidebar / dashboard / spreadsheet / portal restyles (Phases 3–6).
- Framer Motion across the authenticated app (Phase 7).
- Billing, Stripe, real pricing, real testimonials, charts, revenue metrics.
- Changing Clerk routes, session claims, webhooks, or redirects for signed-in users.
- Building out `packages/ui` as the primary component home (deferred; primitives live in `apps/web` for speed).

## Decisions

| Topic | Choice |
|-------|--------|
| Phase order | **1 (tokens + primitives) then 2 (landing)** in one delivery cycle |
| Component home | `apps/web/src/components/ui/*` + `apps/web/src/components/marketing/*` |
| Primary CTA | “Start Free Trial” → `/sign-up` |
| Secondary CTA | “Sign In” → `/sign-in` |
| Locales | **pt-BR + en** via `next-intl` (landing namespace) |
| Signed-in `/` | Unchanged: redirect to `/post-auth` / `/portal` / `/dashboard` |
| Color | Emerald primary, slate/zinc neutrals, sparse accent use |
| Motion (landing) | Subtle only; prefer CSS + small client islands; optional `framer-motion` if needed |
| Product mockup | CSS/HTML UI mock of TrainFlow (not stock photo collage) |
| Clear session | Keep as discreet footer/utility link — not in hero |
| Dark mode | Support via existing `next-themes` + token pairs |

## Hard constraints

- Do **not** modify business logic, authentication, Clerk integration, Supabase, Prisma, database schema, or API behavior.
- UI/UX only: styles, layout, copy, presentational components, fonts.
- Existing i18n/theme toggles remain available on the landing chrome.

---

## Phase 1 — Design system

### Typography

- Load a modern distinctive sans (prefer **Geist** via `next/font` or equivalent non-default stack — avoid Inter/Roboto/Arial/system-only).
- Optional slightly tighter display weight for marketing H1 only.
- Scale: large marketing H1, clear H2 section titles, comfortable body (`max-w-prose` / ~65ch where appropriate), readable small labels.

### Color & tokens

CSS variables on `:root` and `.dark`, wired into Tailwind `theme.extend`:

- `--background`, `--foreground`
- `--muted`, `--muted-foreground`
- `--border`, `--ring`
- `--primary` (emerald), `--primary-foreground`
- `--card`, `--card-foreground`
- Radius scale (e.g. `--radius` → `rounded-xl` default for cards/buttons)
- Soft shadow tokens (one elevation for cards, one for overlays)

Use color sparingly; interface should feel premium, not colorful.

### Primitives (minimum set)

Under `apps/web/src/components/ui/`:

| Component | Role |
|-----------|------|
| `Button` | primary / secondary / ghost / sizes |
| `Input` | text fields (for future forms; optional on landing) |
| `Card` | bordered surface |
| `Badge` | small labels |
| `Container` / section wrapper | max-width + horizontal padding |

Landing may add thin marketing helpers (`SectionHeading`, etc.) without becoming a second design system.

### Globals

- Update `globals.css` body to use tokens.
- Extend `tailwind.config.ts` with colors/fonts/radius/shadows.
- Do **not** restyle the entire authenticated app in this phase (zinc classes elsewhere can remain until Phase 3+); landing + new primitives use the new system.

---

## Phase 2 — Marketing homepage

### Routing / auth

`apps/web/src/app/page.tsx` keeps the signed-in redirect block first. Logged-out users render the new marketing page (composed sections), not the old centered auth-only layout.

### Information architecture

1. **Top nav** — BrandLogo, locale + theme controls, Sign In, Start Free Trial  
2. **Hero** — Brand-forward name/mark presence, large headline, one supporting sentence, dual CTAs, product mockup, small trust line  
3. **What is TrainFlow** — intelligent platform for PTs: workouts, clients, library, notes, exports, progress (honest: progress as roadmap-ready where not built)  
4. **How it works** — numbered steps (account → clients → plans → track → export → save time)  
5. **Features** — Workout Builder, Clients, Library, Templates, AI-ready architecture, PDF/Excel export, Notes, fast workflow, responsive, cloud  
6. **Comparison** — Spreadsheets vs TrainFlow  
7. **Testimonials** — 3 placeholder quotes (clearly fictional / demo)  
8. **Pricing** — Starter / Professional / Enterprise placeholders (no checkout)  
9. **FAQ** — 4–6 professional Q&As  
10. **Footer** — product links, legal placeholders, locale/theme, discreet clear-session recovery  

### Copy

- Namespace e.g. `landing.*` in `messages/en.json` and `messages/pt-BR.json`.
- Tone: confident, professional, trainer-specific; no medical claims.
- Progress / AI / Enterprise: phrase as capability or “coming soon” where not shipped — do not lie about live features.

### Visual / UX

- Generous whitespace, strong hierarchy, soft shadows, consistent radius.
- Responsive: stacked hero on mobile; no essential horizontal scroll on landing.
- Accessibility: focus rings via `--ring`, semantic headings, button/link contrast, CTA labels clear.
- Performance: prefer RSC for static sections; limit client JS to toggles + light motion.

### Motion

- Subtle fade/slide on hero or section reveal only.
- No continuous decorative animation; no motion that hurts Lighthouse badly.

---

## Acceptance

- [ ] Logged-out `/` shows full marketing page (all sections).
- [ ] Logged-in `/` still redirects correctly.
- [ ] Start Free Trial → `/sign-up`; Sign In → `/sign-in`.
- [ ] pt-BR and en landing strings work with locale toggle.
- [ ] Light/dark tokens look coherent on landing.
- [ ] No API/auth/schema files changed (diff limited to web UI/i18n/tailwind/fonts).
- [ ] `pnpm --filter @trainflow/web exec tsc --noEmit` passes.

## Follow-on phases (not this spec)

3 Shell · 4 Dashboard/clients · 5 Wizard/spreadsheet polish · 6 Portal/auth pages · 7 App-wide motion  

---

## Master redesign roadmap (reference)

Full premium SaaS vision (shell, dashboard placeholders, spreadsheet polish, Framer Motion, etc.) remains the north star; **this document only authorizes Phase 1 + 2**.
