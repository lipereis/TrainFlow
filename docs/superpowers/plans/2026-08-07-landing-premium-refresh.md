# Landing Premium Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Undo the Aug-6 "bold-athletic" color/typography drift on the TrainFlow marketing landing page — restore teal/emerald as the app-wide primary color (orange demoted to a selective `accent`), fix the section tone system so the intended light/dark narrative rhythm actually renders regardless of the visitor's app-theme choice, and restrict the uppercase condensed display typeface to the three cinematic sections.

**Architecture:** Token-level fix in `globals.css`/`tailwind.config.ts` (teal back to `--primary`, new `--accent` for orange) cascades automatically through every consumer via Tailwind's `bg-primary`/`text-primary`/etc. utility classes — no per-page edits needed outside the marketing directory. `MarketingSection`'s tone system gets a targeted fix (nest a nested `.dark`/`.light` class scope on each section, independent of the html-level `next-themes` class) so tone is a landing-page narrative property, not a reflection of the visitor's theme preference. Typography and whitespace changes are scoped, mechanical className edits to the 9 non-cinematic section components.

**Tech Stack:** Next.js 15 App Router, Tailwind CSS (`darkMode: "class"`), CSS custom properties (HSL triplets) in `globals.css`, `next-intl` for copy (unchanged by this plan), `next-themes` for the app-wide theme toggle.

## Global Constraints

- No Prisma/Supabase/Clerk/export-logic changes (spec scope).
- No new i18n strings, namespaces, or copy changes — all headline/body copy is already sentence-case in `messages/en.json` and `messages/pt-BR.json`; uppercase is applied purely by the `.mkt-heading` CSS class, so removing that class requires zero copy edits.
- No changes to `Reveal`/motion system, section order/count, or pricing data.
- `product-mocks.tsx` stays static (not wired to live app components) — out of scope for this plan per the spec's explicit decision. No pixel-accuracy tightening task is included here: the spec names this as a soft aspiration without concrete deltas, and inventing specific mock changes not in the spec would violate spec fidelity. If wanted later, it gets its own spec.
- Card accent-stripe / mono-badge "audit for overuse" (spec's Card section) is **not** a task in this plan: `Card` is not used anywhere under `src/components/marketing/` (confirmed via grep), so there is nothing to trim within landing-page scope. The 13 non-marketing pages that do use `Card` (dashboard, clients, templates, etc.) are outside "public marketing page" scope per the brief and are unaffected by the color-token swap (their existing `accent="primary"` stripes just render teal instead of orange automatically — no code change needed, no regression risk).
- Verification commands: `pnpm --filter @trainflow/web lint` (runs `tsc --noEmit`), `pnpm --filter @trainflow/web build` (`next build`), `pnpm --filter @trainflow/web test` (`jest` — no existing tests cover marketing components or color tokens, so this is a regression guard for the shared `button.tsx`/`card.tsx`/`badge.tsx` files, not new coverage).

---

## File Structure

| File | Responsibility |
|---|---|
| `apps/web/src/app/globals.css` | `--primary`/`--ring` revert to teal in `:root`/`.dark`/`.light`; new `--accent`/`--accent-foreground` tokens (orange) in all three blocks |
| `apps/web/tailwind.config.ts` | New `accent` color entry mapping to the CSS vars above |
| `apps/web/src/components/ui/button.tsx` | New `accent` button variant (orange bg) |
| `apps/web/src/components/marketing/marketing-cta.tsx` | `accent`/`accentOnLight` variant map repointed from `"primary"` to `"accent"` |
| `apps/web/src/components/marketing/marketing-section.tsx` | Tone-to-class map fixed to force a color-scheme scope independent of the html-level theme class |
| `apps/web/src/components/marketing/hero.tsx` | `tone="light"` → `tone="dark"` |
| `apps/web/src/components/marketing/product-reveal-section.tsx` | `tone="lightMuted"` → `tone="light"` |
| `apps/web/src/components/marketing/features-section.tsx` | Feature card 2 (workout builder) `tone: "dark"` → `tone: "light"` |
| `apps/web/src/components/marketing/{product-reveal,problem,how,features,compare,export-showcase,pricing,faq,beta}-section.tsx` | Drop `.mkt-heading` from `<h2>`, switch to sentence-case Inter treatment, one step smaller |
| `apps/web/src/components/marketing/problem-section.tsx`, `faq-section.tsx`, `beta-section.tsx` | Increased vertical padding |

No files are created; no files are deleted.

---

### Task 1: Color tokens — teal back to primary, orange demoted to accent

**Files:**
- Modify: `apps/web/src/app/globals.css:5-61` (`:root`, `.dark`, `.light` blocks)
- Modify: `apps/web/tailwind.config.ts:8-34` (`colors` object)

**Interfaces:**
- Produces: CSS custom properties `--accent` / `--accent-foreground` (HSL triplet strings, same format as `--primary`), and Tailwind utility classes `bg-accent`, `text-accent`, `text-accent-foreground`, `border-accent`, `ring-accent` etc. — consumed by Task 2.
- Produces: `--primary`/`--ring` now resolve to teal (`160 70% 40%` dark-scope / `160 84% 30%` light-scope) instead of orange — consumed automatically by every existing `bg-primary`/`text-primary`/`border-primary` usage app-wide (no other files need edits for this part).

- [ ] **Step 1: Edit `globals.css` `:root` block (lines 5-23)**

Change:
```css
  --ring: 12 100% 56%;
  --primary: 12 100% 56%;
  --primary-foreground: 150 8% 5%;
```
to:
```css
  --ring: 160 70% 45%;
  --primary: 160 70% 40%;
  --primary-foreground: 0 0% 100%;
  --accent: 12 100% 56%;
  --accent-foreground: 150 8% 5%;
```
(insert the two new `--accent*` lines immediately after `--primary-foreground`, keep every other line in the block unchanged)

- [ ] **Step 2: Edit `globals.css` `.dark` block (lines 25-42) — identical change**

Change:
```css
  --ring: 12 100% 56%;
  --primary: 12 100% 56%;
  --primary-foreground: 150 8% 5%;
```
to:
```css
  --ring: 160 70% 45%;
  --primary: 160 70% 40%;
  --primary-foreground: 0 0% 100%;
  --accent: 12 100% 56%;
  --accent-foreground: 150 8% 5%;
```

- [ ] **Step 3: Edit `globals.css` `.light` block (lines 44-61)**

Change:
```css
  --ring: 15 89% 48%;
  --primary: 15 89% 48%;
  --primary-foreground: 0 0% 100%;
```
to:
```css
  --ring: 160 84% 30%;
  --primary: 160 84% 30%;
  --primary-foreground: 0 0% 100%;
  --accent: 15 89% 48%;
  --accent-foreground: 0 0% 100%;
```

- [ ] **Step 4: Add `accent` color to `tailwind.config.ts`**

In the `colors` object (`apps/web/tailwind.config.ts`), immediately after the `primary` entry (after line 21 `},`), add:
```ts
        accent: {
          DEFAULT: "hsl(var(--accent) / <alpha-value>)",
          foreground: "hsl(var(--accent-foreground) / <alpha-value>)",
        },
```

- [ ] **Step 5: Verify no type errors**

Run: `pnpm --filter @trainflow/web lint`
Expected: passes (this step is CSS/config only, no TS surface changed yet — this run is a baseline sanity check before Task 2 touches `.tsx` files)

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/app/globals.css apps/web/tailwind.config.ts
git commit -m "fix: revert primary color to teal, add orange accent token"
```

---

### Task 2: Accent button variant + MarketingCta repoint

**Files:**
- Modify: `apps/web/src/components/ui/button.tsx:4-11`
- Modify: `apps/web/src/components/marketing/marketing-cta.tsx:13-20`

**Interfaces:**
- Consumes: `bg-accent`/`text-accent-foreground` Tailwind utilities from Task 1.
- Produces: `buttonClassName("accent", ...)` — a new valid `variant` value, same signature as existing variants (`(variant?, size?, className?) => string`). Consumed by Task 2's own `marketing-cta.tsx` edit; no other task depends on this.

- [ ] **Step 1: Add `accent` variant to `button.tsx`**

In `apps/web/src/components/ui/button.tsx`, change:
```ts
const variants = {
  primary:
    "bg-primary text-primary-foreground shadow-sm hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
  secondary:
    "border border-border bg-card text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
  ghost:
    "text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
} as const;
```
to:
```ts
const variants = {
  primary:
    "bg-primary text-primary-foreground shadow-sm hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
  accent:
    "bg-accent text-accent-foreground shadow-sm hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
  secondary:
    "border border-border bg-card text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
  ghost:
    "text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
} as const;
```

- [ ] **Step 2: Repoint `marketing-cta.tsx` variant map**

In `apps/web/src/components/marketing/marketing-cta.tsx`, change:
```ts
const variantMap = {
  accent: "primary",
  accentOnLight: "primary",
  ghostDark: "secondary",
  ghostLight: "secondary",
  linkDark: "ghost",
  linkLight: "ghost",
} as const;
```
to:
```ts
const variantMap = {
  accent: "accent",
  accentOnLight: "accent",
  ghostDark: "secondary",
  ghostLight: "secondary",
  linkDark: "ghost",
  linkLight: "ghost",
} as const;
```

- [ ] **Step 3: Verify types**

Run: `pnpm --filter @trainflow/web lint`
Expected: passes — `variantMap`'s values must be valid keys of `variants` from `button.tsx`; `"accent"` is now valid because of Task 2 Step 1.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/components/ui/button.tsx apps/web/src/components/marketing/marketing-cta.tsx
git commit -m "feat: add accent button variant, repoint marketing CTA to it"
```

---

### Task 3: Fix section tone scoping to render true light/dark rhythm

**Files:**
- Modify: `apps/web/src/components/marketing/marketing-section.tsx:8-12`

**Interfaces:**
- Consumes: existing `.dark`/`.light` CSS scopes already fully defined in `globals.css` (Task 1 did not touch their `--background`/`--card`/`--muted`/`--border`/`--shadow-card` values, only `--primary`/`--ring`/new `--accent`).
- Produces: no interface change — `MarketingSection`'s public props (`tone`, `children`, `contained`, `wide`, ...rest) are unchanged. Only the rendered class differs. Task 4 depends on this being correct before its `tone` prop changes have visible effect.

- [ ] **Step 1: Edit the `toneClass` map**

In `apps/web/src/components/marketing/marketing-section.tsx`, change:
```ts
const toneClass: Record<Tone, string> = {
  dark: "border-y border-border/60 bg-muted text-foreground",
  light: "bg-background text-foreground",
  lightMuted: "bg-muted/40 text-foreground",
};
```
to:
```ts
const toneClass: Record<Tone, string> = {
  dark: "dark border-y border-border/60 bg-muted text-foreground",
  light: "light bg-background text-foreground",
  lightMuted: "light bg-muted/40 text-foreground",
};
```

- [ ] **Step 2: Verify types**

Run: `pnpm --filter @trainflow/web lint`
Expected: passes (no TS surface touched, className string only)

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/marketing/marketing-section.tsx
git commit -m "fix: force section tone to a fixed color-scheme independent of app theme"
```

---

### Task 4: Apply target tone assignments (Hero dark, Product Reveal light, Features card 2 light)

**Files:**
- Modify: `apps/web/src/components/marketing/hero.tsx:11`
- Modify: `apps/web/src/components/marketing/product-reveal-section.tsx:12`
- Modify: `apps/web/src/components/marketing/features-section.tsx:27`

**Interfaces:**
- Consumes: `MarketingSection`'s `tone` prop (fixed by Task 3) and `FeaturesSection`'s internal `features` array shape (`{ title, body, detail, tone: "light" | "dark" | "lightMuted", mock }`) — unchanged shape, only the `tone` value of one array entry changes.

- [ ] **Step 1: Flip Hero to dark**

In `apps/web/src/components/marketing/hero.tsx`, change:
```tsx
<MarketingSection tone="light" wide className="pb-16 pt-10 sm:pb-24 sm:pt-16 lg:pb-28">
```
to:
```tsx
<MarketingSection tone="dark" wide className="pb-16 pt-10 sm:pb-24 sm:pt-16 lg:pb-28">
```

- [ ] **Step 2: Flip Product Reveal to light**

In `apps/web/src/components/marketing/product-reveal-section.tsx`, change:
```tsx
    <MarketingSection
      id="product"
      tone="lightMuted"
      wide
      className="py-20 sm:py-28 lg:py-32"
    >
```
to:
```tsx
    <MarketingSection
      id="product"
      tone="light"
      wide
      className="py-20 sm:py-28 lg:py-32"
    >
```

- [ ] **Step 3: Flip Features card 2 (workout builder) from dark to light**

In `apps/web/src/components/marketing/features-section.tsx`, change:
```ts
    {
      title: t("feat2Title"),
      body: t("feat2Body"),
      detail: t("feat2Detail"),
      tone: "dark" as const,
      mock: <WorkoutEditorMock animate />,
    },
```
to:
```ts
    {
      title: t("feat2Title"),
      body: t("feat2Body"),
      detail: t("feat2Detail"),
      tone: "light" as const,
      mock: <WorkoutEditorMock animate />,
    },
```

- [ ] **Step 4: Verify types**

Run: `pnpm --filter @trainflow/web lint`
Expected: passes

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/marketing/hero.tsx apps/web/src/components/marketing/product-reveal-section.tsx apps/web/src/components/marketing/features-section.tsx
git commit -m "fix: apply target section tone rhythm (dark hero, light product reveal/features)"
```

---

### Task 5: Restrict `.mkt-heading` to the three cinematic sections

**Files:**
- Modify: `apps/web/src/components/marketing/product-reveal-section.tsx:17`
- Modify: `apps/web/src/components/marketing/problem-section.tsx:13`
- Modify: `apps/web/src/components/marketing/how-section.tsx:37`
- Modify: `apps/web/src/components/marketing/features-section.tsx:57`
- Modify: `apps/web/src/components/marketing/compare-section.tsx:15`
- Modify: `apps/web/src/components/marketing/export-showcase-section.tsx:12`
- Modify: `apps/web/src/components/marketing/pricing-section.tsx:33`
- Modify: `apps/web/src/components/marketing/faq-section.tsx:13`
- Modify: `apps/web/src/components/marketing/beta-section.tsx:15`

No change to `hero.tsx:17`, `builder-showcase-section.tsx:18`, `final-cta-section.tsx:12` — these three keep `.mkt-heading`.

**Interfaces:**
- No prop/type changes — `className` string literals only. Copy (the `{t(...)}` calls) is untouched; all copy in `messages/en.json`/`messages/pt-BR.json` is already sentence-case, so dropping the CSS `text-transform: uppercase` from `.mkt-heading` is the only change needed to move these headings to sentence case.

- [ ] **Step 1: `product-reveal-section.tsx`**

Change:
```tsx
        <h2 className="mkt-heading text-3xl text-foreground sm:text-4xl lg:text-5xl">
```
to:
```tsx
        <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl lg:text-4xl">
```

- [ ] **Step 2: `problem-section.tsx`**

Change:
```tsx
        <h2 className="mkt-heading text-3xl text-foreground sm:text-4xl">
```
to:
```tsx
        <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
```

- [ ] **Step 3: `how-section.tsx`**

Change:
```tsx
        <h2 className="mkt-heading text-3xl text-foreground sm:text-4xl">
```
to:
```tsx
        <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
```

- [ ] **Step 4: `features-section.tsx`**

Change:
```tsx
              <h2 className="mkt-heading text-3xl text-foreground sm:text-4xl">
```
to:
```tsx
              <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
```

- [ ] **Step 5: `compare-section.tsx`**

Change:
```tsx
        <h2 className="mkt-heading text-3xl text-foreground sm:text-4xl">
```
to:
```tsx
        <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
```

- [ ] **Step 6: `export-showcase-section.tsx`**

Change:
```tsx
        <h2 className="mkt-heading text-3xl text-foreground sm:text-4xl lg:text-5xl">
```
to:
```tsx
        <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl lg:text-4xl">
```

- [ ] **Step 7: `pricing-section.tsx`**

Change:
```tsx
        <h2 className="mkt-heading text-3xl text-foreground sm:text-4xl">
```
to:
```tsx
        <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
```

- [ ] **Step 8: `faq-section.tsx`**

Change:
```tsx
        <h2 className="mkt-heading text-3xl text-foreground sm:text-4xl">
```
to:
```tsx
        <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
```

- [ ] **Step 9: `beta-section.tsx`**

Change:
```tsx
        <h2 className="mkt-heading mt-4 text-3xl text-foreground sm:text-4xl">
```
to:
```tsx
        <h2 className="mt-4 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
```

- [ ] **Step 10: Verify types**

Run: `pnpm --filter @trainflow/web lint`
Expected: passes

- [ ] **Step 11: Commit**

```bash
git add apps/web/src/components/marketing/product-reveal-section.tsx apps/web/src/components/marketing/problem-section.tsx apps/web/src/components/marketing/how-section.tsx apps/web/src/components/marketing/features-section.tsx apps/web/src/components/marketing/compare-section.tsx apps/web/src/components/marketing/export-showcase-section.tsx apps/web/src/components/marketing/pricing-section.tsx apps/web/src/components/marketing/faq-section.tsx apps/web/src/components/marketing/beta-section.tsx
git commit -m "fix: restrict uppercase display heading to hero/builder/final-cta sections"
```

---

### Task 6: Increase whitespace on Problem, FAQ, Beta

**Files:**
- Modify: `apps/web/src/components/marketing/problem-section.tsx:11`
- Modify: `apps/web/src/components/marketing/faq-section.tsx:11`
- Modify: `apps/web/src/components/marketing/beta-section.tsx:10`

**Interfaces:** None — `className` string literals only.

- [ ] **Step 1: `problem-section.tsx`**

Change:
```tsx
    <MarketingSection tone="light" className="py-20 sm:py-24">
```
to:
```tsx
    <MarketingSection tone="light" className="py-24 sm:py-32">
```

- [ ] **Step 2: `faq-section.tsx`**

Change:
```tsx
    <MarketingSection id="faq" tone="light" className="py-16 sm:py-20">
```
to:
```tsx
    <MarketingSection id="faq" tone="light" className="py-20 sm:py-28">
```

- [ ] **Step 3: `beta-section.tsx`**

Change:
```tsx
    <MarketingSection tone="lightMuted" className="py-20 sm:py-24">
```
to:
```tsx
    <MarketingSection tone="lightMuted" className="py-24 sm:py-32">
```

- [ ] **Step 4: Verify types**

Run: `pnpm --filter @trainflow/web lint`
Expected: passes

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/marketing/problem-section.tsx apps/web/src/components/marketing/faq-section.tsx apps/web/src/components/marketing/beta-section.tsx
git commit -m "fix: increase vertical rhythm on problem, faq, beta sections"
```

---

### Task 7: Full verification

**Files:** None (verification only).

- [ ] **Step 1: Run full lint**

Run: `pnpm --filter @trainflow/web lint`
Expected: PASS, no TypeScript errors

- [ ] **Step 2: Run existing test suite**

Run: `pnpm --filter @trainflow/web test`
Expected: PASS (existing suites: `badge.spec.ts`, `security-headers.spec.ts`, `status-badge.spec.ts`, `entitlements.spec.ts`, `sync-subscription.spec.ts`, `export-access.spec.ts` — none exercise marketing components, this is a regression guard on shared UI/billing logic untouched by this plan)

- [ ] **Step 3: Run production build**

Run: `pnpm --filter @trainflow/web build`
Expected: PASS, no build errors

- [ ] **Step 4: Manual QA — start dev server**

Run: `pnpm --filter @trainflow/web dev`
Then in a browser at `http://localhost:3000`, check:
- Hero renders dark/cinematic; Product Reveal, Problem, How, Features (all 4 cards), Compare, Pricing, FAQ, Beta render light/light-muted; Builder Showcase and Final CTA render dark — **in both** app theme = light and app theme = dark (toggle via the nav appearance control) and in app theme = system.
- Primary CTAs ("Start for free" / "Comece grátis") render orange (`accent`); nav "Get Started", pricing plan CTA, FAQ chevron, product-mock highlights render teal (`primary`).
- Headings: Hero, Builder Showcase, Final CTA are uppercase condensed; all other section headings are sentence-case Inter.
- No horizontal overflow at 375px, 768px, 1440px widths.
- pt-BR locale (`/pt-BR` or locale switcher) renders correctly with no missing-key fallback.
- Sign In / Start for free / Get Started CTAs route to `/sign-in` and `/sign-up` correctly.
- Mobile nav hamburger opens/closes, Escape key closes it.
- FAQ accordion expands/collapses.
- `prefers-reduced-motion: reduce` (OS or DevTools emulation) — reveal animations are instant, no motion.

- [ ] **Step 5: Report results**

Summarize pass/fail for each check above. If any check fails, stop and fix before considering the plan complete — do not mark this task done with unresolved failures.
