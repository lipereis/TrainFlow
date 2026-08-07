# TrainFlow landing — premium SaaS refresh (v2)

**Date:** 2026-08-07
**Scope:** Public marketing page (`/` → `MarketingPage` and its section components), plus the shared design-token/UI-primitive files the color-system fix touches (`globals.css`, `tailwind.config.ts`, `button.tsx`, `card.tsx`, `badge.tsx`, and the four non-marketing files that read `--primary`). No Prisma/Supabase/Clerk/export-logic changes.

## Context

The public landing page already went through one cinematic redesign (`docs/superpowers/specs/2026-07-25-landing-cinematic-design.md`) that established the current section structure, i18n approach, and motion system. That structure is sound and this spec keeps it. Four commits on 2026-08-06 ("bold-athletic redesign") layered on top of it and, in doing so, drifted from the original plan in three ways:

1. `--primary` was hue-shifted from teal/emerald to orange, and `defaultTheme` was set to `"dark"`. Combined with `MarketingSection`'s tone system being theme-relative (it swaps between `bg-background`/`bg-muted`, both of which resolve to near-black under the dark theme), the alternating light/dark section rhythm the original spec called for stopped actually rendering — every band reads as dark. This is the direct cause of "the site is too dark and too orange."
2. `.mkt-heading` (uppercase, condensed Bebas Neue) was applied to the `<h2>` in every single section, removing the contrast between "athletic display statement" and "premium product typography" that both the original spec and this refresh call for.
3. Card accent stripes and uppercase mono badges were added app-wide as a generic treatment rather than a restrained, occasional one.

This refresh corrects those three drifts and tightens whitespace/CTA hierarchy, without rebuilding section structure, i18n, motion, auth, or pricing logic, all of which already work.

## Decisions made during brainstorming

- **Color scope: app-wide, not landing-scoped.** `--primary` reverts to teal for the whole app (dashboard, workout builder, client portal, buttons, cards), not just the marketing page. This matches the original 2026-07-25 spec's explicit statement that landing shares tokens with the dashboard, and the brief's requirement that teal visually connects landing → dashboard → builder → client management. Blast radius outside marketing is small: `src/app/(client)/portal/page.tsx`, `src/components/workouts/wizard/progress-indicator.tsx`, `src/components/ui/button.tsx`, `src/components/ui/card.tsx`.
- **Product mockups stay static, get tightened for realism.** `product-mocks.tsx` remains hand-built (not wired to real `src/components/workouts`/`exercises` components) — swapping to live components risks coupling the marketing bundle to app runtime/auth context for a payoff that's mostly visual. Mocks are refined to be pixel-accurate to the real UI's spacing, copy conventions, and status styling so they read as authentic rather than generic. Live-component wiring is out of scope for this pass; if wanted later it gets its own spec.

## Color system

Teal/emerald becomes `--primary` again (both `.dark` and `.light` blocks in `globals.css`, plus `:root`). Orange is demoted to a new **`accent`** treatment, used only for:
- Primary marketing CTAs ("Start for free" and equivalents in Hero, Beta, Final CTA)
- Eyebrow labels / small athletic highlights on dark cinematic bands (Hero, Builder Showcase, Final CTA)

Everywhere else (nav active states, feature details, pricing featured-plan price, FAQ chevrons, product-mock accents, status badges) uses `--primary` teal, consistent with the rest of the app.

Implementation: add an `accent` entry to `variants` in `button.tsx` (orange bg, matching hover/focus treatment to the existing `primary` entry) and repoint `MarketingCta`'s `accent`/`accentOnLight` variant map from `"primary"` to `"accent"` — today both map to `primary`, which is about to become teal, so without this change the orange CTA emphasis disappears entirely.

`statusActive`/`statusPending` tokens are untouched (already distinct lime/amber, not part of this rebalance).

## Section tone bands (the dark-rhythm fix)

`MarketingSection`'s `toneClass` map currently reads:
```
dark: "border-y border-border/60 bg-muted text-foreground"
light: "bg-background text-foreground"
lightMuted: "bg-muted/40 text-foreground"
```
These are theme-relative, so under `defaultTheme="dark"` all three look dark. Fix: force each tone to a **fixed** color-scheme by nesting the existing `.dark`/`.light` class scopes (already fully defined in `globals.css` with their own `--background`/`--card`/`--muted`/`--border`/`--primary`/`--shadow-card` values) directly on the section, independent of the html-level theme class next-themes sets:
```
dark: "dark border-y border-border/60 bg-muted text-foreground"
light: "light bg-background text-foreground"
lightMuted: "light bg-muted/40 text-foreground"
```
CSS custom properties cascade downward, so a `.light` div nested inside an html-level `.dark` tree correctly overrides back to light values for that subtree (and vice versa) — no new tokens needed, this reuses the existing `:root`/`.dark`/`.light` blocks. This is coherent with brief §34 ("the landing page may intentionally contain both dark and light storytelling sections regardless of the selected theme"): a visitor who prefers the app in light mode still gets a dark, cinematic Hero and Builder Showcase, and vice versa — the narrative rhythm is a landing-page property, not a theme property.

Section tone assignments (target rhythm, matches brief §24 closely):

| Section | Tone | Note |
|---|---|---|
| Hero | **dark** | flips from current `light` — restores cinematic opening |
| Product reveal | light | |
| Problem | light | |
| How it works | lightMuted | unchanged |
| Features (4 cards) | light / light / light / lightMuted | drop the one `dark` card (today: card 2, workout builder) — keeps this whole zone as one continuous "Apple light" stretch so the Builder Showcase dark band right after Compare hits with more contrast instead of being the third dark note in a row |
| Compare (before/after) | light | unchanged |
| Builder Showcase | dark | unchanged — this is the "GYMERS energy" band, orange accent allowed here |
| Export Showcase | light | unchanged |
| Pricing | lightMuted | unchanged |
| FAQ | light | unchanged |
| Beta / early access | lightMuted | unchanged |
| Final CTA | dark | unchanged |

## Typography hierarchy

`.mkt-heading` (uppercase condensed Bebas Neue) stays reserved for the three athletic/cinematic bands: **Hero**, **Builder Showcase**, **Final CTA**. Every other section heading (`Product reveal`, `Problem`, `How it works`, `Features`, `Compare`, `Export Showcase`, `Pricing`, `FAQ`, `Beta`) drops `.mkt-heading` in favor of a sophisticated sans (Inter) treatment: sentence case (not uppercase), tight tracking, `font-semibold`, sized down slightly from the display treatment since Inter reads larger at the same rem value than condensed Bebas Neue. Mono (`JetBrains Mono`) stays as-is for eyebrows, numeric data (step numbers, table headers, prices) and small labels across all sections — that contrast already works and isn't part of the "too much uppercase" problem.

## Whitespace

Increase vertical rhythm on sections that currently feel tightest relative to their neighbors: Problem (`py-20 sm:py-24` → `py-24 sm:py-32`), FAQ (`py-16 sm:py-20` → `py-20 sm:py-28`), Beta (`py-20 sm:py-24` → `py-24 sm:py-32`), and the gap between Pricing/FAQ/Beta/FinalCTA generally. Hero/Builder Showcase/Export keep their current generous padding — already close to brief intent.

## Card accent stripe / mono badges

Keep both (added Aug 6) but audit usage: accent stripe should appear only where it signals something (featured pricing plan, active status) not decoratively on every card. No new usage added by this refresh; existing usage reviewed during implementation for overuse and trimmed if found.

## Nav

Structure/behavior (transparent→blurred-on-scroll, mobile hamburger, locale+theme toggle, Sign In / Get Started CTAs) already matches brief §8. No structural change — verify visually after the color swap that the "Get Started" button (now teal `primary`) still reads clearly against the blurred nav background in both themes.

## What does not change

- i18n structure/namespaces, `next-intl` usage, pt-BR and en copy content (only case/tone touch-ups on headings that lose `.mkt-heading`, no new strings/sections/namespaces).
- `Reveal` component and motion system (IntersectionObserver + CSS, `prefers-reduced-motion` handling) — already correct, no framer-motion needed.
- Clerk auth routing (`/sign-in`, `/sign-up`, `signInFallbackRedirectUrl`, etc.) — untouched.
- Pricing plan data/values and Free/Pro functionality — untouched, only restyled to the new color hierarchy.
- Section order and count — no sections added or removed.
- `product-mocks.tsx` data source (still static, not live components) — per brainstorming decision above.

## Testing / verification

- `pnpm lint`, `pnpm build` (turbo, `apps/web` scope) after implementation.
- Manual check: desktop + mobile viewport, pt-BR + en locale, light + dark + system app-theme (confirming Hero/Builder Showcase/Final CTA render dark and Problem/How/Features/Compare/Export/Pricing/FAQ/Beta render light **regardless** of the app-theme toggle), Sign In / Start for free CTA routing, Pricing card display, FAQ accordion, mobile nav menu, no horizontal overflow.
