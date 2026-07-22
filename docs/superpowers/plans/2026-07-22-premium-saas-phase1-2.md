# Premium SaaS Phase 1+2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship design tokens + UI primitives and a conversion-focused marketing homepage for logged-out visitors, without changing auth, API, Prisma, or business logic.

**Architecture:** CSS variables + Tailwind theme extension; presentational primitives under `apps/web/src/components/ui`; marketing sections under `apps/web/src/components/marketing`; `page.tsx` keeps signed-in redirects then renders `MarketingPage`. Copy lives in `landing.*` next-intl messages (en + pt-BR). CTAs are plain Links to `/sign-up` and `/sign-in`.

**Tech Stack:** Next.js 14 App Router, Tailwind CSS, `next/font` + `geist`, `next-intl`, `next-themes` (existing), optional CSS-only motion (prefer no framer-motion in v1 unless a tiny island needs it).

## Global Constraints

- Do **not** modify business logic, authentication, Clerk integration, Supabase, Prisma, database schema, or API behavior.
- UI/UX only: styles, layout, copy, presentational components, fonts.
- Primary CTA → `/sign-up`; secondary → `/sign-in`.
- Locales: pt-BR + en for landing strings.
- Signed-in `/` redirects unchanged.
- Do not restyle entire authenticated app (zinc elsewhere OK until later phases).
- Prefer RSC; minimize `"use client"`.
- Avoid default AI aesthetics (no purple-glow theme; emerald/slate only).

---

## File map

| Path | Responsibility |
|------|----------------|
| `apps/web/package.json` | Add `geist` (and `clsx` if useful) |
| `apps/web/src/app/layout.tsx` | Apply font CSS variable on `<html>` / `<body>` |
| `apps/web/src/app/globals.css` | Token variables + body |
| `apps/web/tailwind.config.ts` | theme.extend colors/fonts/radius/shadow |
| `apps/web/src/lib/cn.ts` | `clsx`/`twMerge` helper (add `tailwind-merge` if used) |
| `apps/web/src/components/ui/button.tsx` | Button primitive |
| `apps/web/src/components/ui/card.tsx` | Card primitive |
| `apps/web/src/components/ui/badge.tsx` | Badge primitive |
| `apps/web/src/components/ui/input.tsx` | Input primitive |
| `apps/web/src/components/ui/container.tsx` | Max-width container |
| `apps/web/src/components/marketing/*` | Landing sections + shell |
| `apps/web/src/app/page.tsx` | Redirects + `<MarketingPage />` |
| `apps/web/messages/en.json` | `landing` namespace |
| `apps/web/messages/pt-BR.json` | `landing` namespace |

---

### Task 1: Fonts + design tokens

**Files:**
- Modify: `apps/web/package.json` (via pnpm add)
- Modify: `apps/web/src/app/layout.tsx`
- Modify: `apps/web/src/app/globals.css`
- Modify: `apps/web/tailwind.config.ts`
- Create: `apps/web/src/lib/cn.ts`

**Interfaces:**
- Produces: CSS vars `--background`, `--foreground`, `--muted`, `--muted-foreground`, `--border`, `--ring`, `--primary`, `--primary-foreground`, `--card`, `--card-foreground`, `--radius`, `--shadow-card`
- Produces: Tailwind colors `background`, `foreground`, `muted`, `primary`, etc. as `hsl(var(--…))` or raw hex via `rgb(var(--…) / <alpha-value>)`
- Produces: `cn(...inputs)` helper
- Produces: Geist on body via `--font-sans`

- [ ] **Step 1: Install dependencies**

```bash
cd apps/web && pnpm add geist clsx tailwind-merge
```

- [ ] **Step 2: Add `cn` helper**

Create `apps/web/src/lib/cn.ts`:

```ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

- [ ] **Step 3: Tokens in `globals.css`**

Replace the `body { … }` block and prepend tokens. Keep existing `@media print` rules. Example token block:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --background: 210 20% 98%;
  --foreground: 222 47% 11%;
  --muted: 210 16% 93%;
  --muted-foreground: 215 16% 40%;
  --border: 214 20% 88%;
  --ring: 160 84% 30%;
  --primary: 160 84% 30%;
  --primary-foreground: 0 0% 100%;
  --card: 0 0% 100%;
  --card-foreground: 222 47% 11%;
  --radius: 0.75rem;
  --shadow-card: 0 1px 2px rgb(15 23 42 / 0.06), 0 8px 24px rgb(15 23 42 / 0.06);
}

.dark {
  --background: 222 47% 7%;
  --foreground: 210 20% 96%;
  --muted: 217 25% 14%;
  --muted-foreground: 215 16% 65%;
  --border: 217 20% 18%;
  --ring: 160 70% 45%;
  --primary: 160 70% 40%;
  --primary-foreground: 0 0% 100%;
  --card: 222 47% 9%;
  --card-foreground: 210 20% 96%;
  --shadow-card: 0 1px 2px rgb(0 0 0 / 0.4), 0 8px 24px rgb(0 0 0 / 0.35);
}

body {
  @apply bg-background text-foreground antialiased;
  font-family: var(--font-sans), ui-sans-serif, system-ui, sans-serif;
}

/* keep existing @media print { … } unchanged */
```

- [ ] **Step 4: Extend Tailwind**

Replace `apps/web/tailwind.config.ts` with:

```ts
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background) / <alpha-value>)",
        foreground: "hsl(var(--foreground) / <alpha-value>)",
        muted: {
          DEFAULT: "hsl(var(--muted) / <alpha-value>)",
          foreground: "hsl(var(--muted-foreground) / <alpha-value>)",
        },
        border: "hsl(var(--border) / <alpha-value>)",
        ring: "hsl(var(--ring) / <alpha-value>)",
        primary: {
          DEFAULT: "hsl(var(--primary) / <alpha-value>)",
          foreground: "hsl(var(--primary-foreground) / <alpha-value>)",
        },
        card: {
          DEFAULT: "hsl(var(--card) / <alpha-value>)",
          foreground: "hsl(var(--card-foreground) / <alpha-value>)",
        },
      },
      borderRadius: {
        xl: "var(--radius)",
      },
      boxShadow: {
        card: "var(--shadow-card)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
```

- [ ] **Step 5: Wire Geist in root layout**

In `apps/web/src/app/layout.tsx`:

```tsx
import { GeistSans } from "geist/font/sans";
// …
<html lang={locale} className={GeistSans.variable} suppressHydrationWarning>
  <body className="font-sans">
```

(`GeistSans.variable` sets `--font-sans` per geist package docs.)

- [ ] **Step 6: Typecheck**

```bash
cd apps/web && pnpm lint
```

Expected: exit 0.

- [ ] **Step 7: Commit**

```bash
git add apps/web/package.json pnpm-lock.yaml apps/web/src/lib/cn.ts \
  apps/web/src/app/globals.css apps/web/tailwind.config.ts apps/web/src/app/layout.tsx
git commit -m "$(cat <<'EOF'
feat(web): add premium design tokens and Geist font

Emerald/slate CSS variables, Tailwind theme bridge, and cn() helper
for Phase 1 of the SaaS redesign.
EOF
)"
```

---

### Task 2: UI primitives

**Files:**
- Create: `apps/web/src/components/ui/button.tsx`
- Create: `apps/web/src/components/ui/card.tsx`
- Create: `apps/web/src/components/ui/badge.tsx`
- Create: `apps/web/src/components/ui/input.tsx`
- Create: `apps/web/src/components/ui/container.tsx`

**Interfaces:**
- Produces:
  - `Button` props: `variant?: "primary" | "secondary" | "ghost"`, `size?: "sm" | "md" | "lg"`, extends button HTML attrs; can render as child via optional `asChild` **only if** simple — otherwise use `className` on `Link` wrapping or export `buttonVariants` string helper
  - Prefer exporting `buttonClassName(variant, size)` + `<Button>` for simplicity without radix Slot

- [ ] **Step 1: Implement Button**

```tsx
// apps/web/src/components/ui/button.tsx
import { cn } from "@/lib/cn";
import type { ButtonHTMLAttributes } from "react";

const variants = {
  primary:
    "bg-primary text-primary-foreground shadow-sm hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
  secondary:
    "border border-border bg-card text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
  ghost:
    "text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
} as const;

const sizes = {
  sm: "h-9 px-3 text-sm",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-base",
} as const;

export function buttonClassName(
  variant: keyof typeof variants = "primary",
  size: keyof typeof sizes = "md",
  className?: string,
) {
  return cn(
    "inline-flex items-center justify-center rounded-xl font-medium transition-opacity disabled:pointer-events-none disabled:opacity-50",
    variants[variant],
    sizes[size],
    className,
  );
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
}) {
  return (
    <button className={buttonClassName(variant, size, className)} {...props} />
  );
}
```

- [ ] **Step 2: Implement Card, Badge, Input, Container**

```tsx
// card.tsx
import { cn } from "@/lib/cn";
import type { HTMLAttributes } from "react";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card text-card-foreground shadow-card",
        className,
      )}
      {...props}
    />
  );
}
```

```tsx
// badge.tsx
import { cn } from "@/lib/cn";
import type { HTMLAttributes } from "react";

export function Badge({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-border bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}
```

```tsx
// input.tsx
import { cn } from "@/lib/cn";
import type { InputHTMLAttributes } from "react";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "flex h-10 w-full rounded-xl border border-border bg-card px-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
      {...props}
    />
  );
}
```

```tsx
// container.tsx
import { cn } from "@/lib/cn";
import type { HTMLAttributes } from "react";

export function Container({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("mx-auto w-full max-w-6xl px-6", className)}
      {...props}
    />
  );
}
```

- [ ] **Step 3: Typecheck + commit**

```bash
cd apps/web && pnpm lint
git add apps/web/src/components/ui
git commit -m "$(cat <<'EOF'
feat(web): add premium UI primitives

Button, Card, Badge, Input, and Container for landing and later shell.
EOF
)"
```

---

### Task 3: Landing i18n catalogs

**Files:**
- Modify: `apps/web/messages/en.json` — add top-level `"landing": { … }`
- Modify: `apps/web/messages/pt-BR.json` — same keys

**Interfaces:**
- Produces: `useTranslations("landing")` / `getTranslations("landing")` keys listed below (must exist in both files)

- [ ] **Step 1: Add English `landing` object**

Merge into `en.json` (do not remove other namespaces):

```json
"landing": {
  "navSignIn": "Sign in",
  "navTrial": "Start free trial",
  "heroEyebrow": "For personal trainers",
  "heroTitle": "Run your coaching business without the spreadsheet chaos",
  "heroSubtitle": "TrainFlow helps trainers manage clients, build workout programs, and export polished PDFs and Excel sheets — in one calm workspace.",
  "heroTrust": "Built for independent trainers and small studios. Works in the browser. No installs.",
  "whatTitle": "What is TrainFlow?",
  "whatBody": "TrainFlow is an intelligent workspace built specifically for personal trainers. Create programs, manage clients, reuse exercise libraries and templates, capture notes, and export professional documents — so you spend less time formatting and more time coaching.",
  "howTitle": "How TrainFlow works",
  "how1Title": "Create your trainer account",
  "how1Body": "Sign up in minutes and land in a workspace designed for coaching workflows.",
  "how2Title": "Add your clients",
  "how2Body": "Keep profiles, invites, and status organized in one place.",
  "how3Title": "Build personalized plans",
  "how3Body": "Use the workout builder and spreadsheet editor with volume math built in.",
  "how4Title": "Track the coaching journey",
  "how4Body": "Keep program context and notes together as clients progress (more tracking on the roadmap).",
  "how5Title": "Export PDF and Excel",
  "how5Body": "Hand clients professional documents they can open anywhere.",
  "how6Title": "Save hours every week",
  "how6Body": "Templates, libraries, and autosave replace copy-paste chaos.",
  "featuresTitle": "Everything you need to run programs",
  "featuresSubtitle": "A focused toolkit — not another bloated gym mega-app.",
  "featWorkout": "Workout builder",
  "featWorkoutBody": "Multi-day programs with an editable spreadsheet and autosave.",
  "featClients": "Client management",
  "featClientsBody": "Profiles, invites, and clear active/inactive status.",
  "featLibrary": "Exercise library",
  "featLibraryBody": "Seeded library plus your own custom exercises.",
  "featTemplates": "Templates",
  "featTemplatesBody": "Reuse proven structures instead of starting from zero.",
  "featAi": "AI-ready architecture",
  "featAiBody": "Clean data model ready for smarter assists later — no hype required today.",
  "featPdf": "PDF export",
  "featPdfBody": "Share polished programs clients can print or save.",
  "featExcel": "Excel export",
  "featExcelBody": "Spreadsheet-friendly exports for trainers who still live in Excel.",
  "featNotes": "Notes",
  "featNotesBody": "Program and day observations where they belong.",
  "featFast": "Fast workflow",
  "featFastBody": "Keyboard-friendly editing and fewer tab hops.",
  "featResponsive": "Works on the go",
  "featResponsiveBody": "Trainer nav adapts on phones; clients can open their portal anywhere.",
  "featCloud": "Cloud-based",
  "featCloudBody": "Secure sign-in and data hosted for real coaching businesses.",
  "compareTitle": "Why trainers switch from spreadsheets",
  "compareLeftTitle": "Spreadsheets",
  "compareLeft1": "Manual formatting every week",
  "compareLeft2": "Easy to break formulas and layouts",
  "compareLeft3": "Hard to share a professional client experience",
  "compareRightTitle": "TrainFlow",
  "compareRight1": "Structured programs with autosave",
  "compareRight2": "Professional PDF and Excel exports",
  "compareRight3": "Modern client portal for active plans",
  "testimonialsTitle": "Loved by trainers who value their time",
  "t1Quote": "I stopped rebuilding the same spreadsheet every Monday. My clients get cleaner plans and I get my evenings back.",
  "t1Name": "Marina Costa",
  "t1Role": "Independent PT · São Paulo",
  "t2Quote": "The export quality finally matches how I want my brand to feel — without hiring a designer for every program.",
  "t2Name": "James Okonkwo",
  "t2Role": "Studio coach · Lisbon",
  "t3Quote": "Inviting clients and keeping active programs in one place removed so much WhatsApp back-and-forth.",
  "t3Name": "Helena Duarte",
  "t3Role": "Online coach · Porto Alegre",
  "testimonialsNote": "Placeholder stories for product demos — not verified reviews.",
  "pricingTitle": "Simple plans for growing practices",
  "pricingSubtitle": "Pricing placeholders for the marketing site — checkout comes later.",
  "planStarter": "Starter",
  "planStarterPrice": "$0",
  "planStarterDesc": "For trainers evaluating the workflow.",
  "planStarterCta": "Start free trial",
  "planPro": "Professional",
  "planProPrice": "$29",
  "planProDesc": "For full-time coaches with an active client roster.",
  "planProCta": "Start free trial",
  "planEnt": "Enterprise",
  "planEntPrice": "Custom",
  "planEntDesc": "For studios that need tailored onboarding.",
  "planEntCta": "Talk to us",
  "planPeriod": "/month",
  "faqTitle": "FAQ",
  "faq1Q": "Is TrainFlow only for personal trainers?",
  "faq1A": "Yes — the product is designed around trainer workflows: clients, programs, libraries, and exports.",
  "faq2Q": "Can my clients see their workouts?",
  "faq2A": "Invited clients get a portal with their active programs and can download PDF or Excel.",
  "faq3Q": "Do I need to install an app?",
  "faq3A": "No. TrainFlow runs in the browser on desktop and mobile.",
  "faq4Q": "Can I export to PDF and Excel?",
  "faq4A": "Yes. Trainers export from the workout editor; clients can download from the portal.",
  "faq5Q": "Is there a free trial?",
  "faq5A": "You can create a trainer account and explore the product. Paid billing is not required for the current demo.",
  "faq6Q": "What about AI features?",
  "faq6A": "The architecture is ready for smarter assists later. Today you get a fast, structured coaching workspace.",
  "footerProduct": "Product",
  "footerCompany": "Company",
  "footerLegal": "Legal",
  "footerTagline": "The calm OS for personal trainers.",
  "footerPrivacy": "Privacy",
  "footerTerms": "Terms",
  "footerContact": "Contact",
  "footerFeatures": "Features",
  "footerPricing": "Pricing",
  "footerFaq": "FAQ",
  "footerClearSession": "Clear session",
  "footerRights": "© {year} TrainFlow. All rights reserved.",
  "mockActiveClients": "Active clients",
  "mockPrograms": "Programs",
  "mockExportReady": "Export ready"
}
```

- [ ] **Step 2: Add Portuguese `landing` object**

Same keys in `pt-BR.json` with natural pt-BR copy (not machine-literal). Example titles:

- `heroTitle`: `"Gerencie sua assessoria sem o caos das planilhas"`
- `heroSubtitle`: `"O TrainFlow ajuda personal trainers a gerenciar clientes, montar treinos e exportar PDFs e Excel profissionais — em um só lugar."`
- `navTrial`: `"Começar grátis"`
- `navSignIn`: `"Entrar"`
- Fill **every** key from the English object with proper Portuguese (implementer must complete all keys; no missing keys).

- [ ] **Step 3: Validate JSON**

```bash
node -e "JSON.parse(require('fs').readFileSync('apps/web/messages/en.json','utf8')); JSON.parse(require('fs').readFileSync('apps/web/messages/pt-BR.json','utf8')); console.log('ok')"
```

Expected: `ok`

- [ ] **Step 4: Commit**

```bash
git add apps/web/messages/en.json apps/web/messages/pt-BR.json
git commit -m "$(cat <<'EOF'
feat(web): add landing page i18n catalogs (en + pt-BR)

Marketing copy namespace for the premium homepage.
EOF
)"
```

---

### Task 4: Marketing page sections

**Files:**
- Create: `apps/web/src/components/marketing/marketing-page.tsx`
- Create: `apps/web/src/components/marketing/marketing-nav.tsx`
- Create: `apps/web/src/components/marketing/hero.tsx`
- Create: `apps/web/src/components/marketing/product-mockup.tsx`
- Create: `apps/web/src/components/marketing/what-section.tsx`
- Create: `apps/web/src/components/marketing/how-section.tsx`
- Create: `apps/web/src/components/marketing/features-section.tsx`
- Create: `apps/web/src/components/marketing/compare-section.tsx`
- Create: `apps/web/src/components/marketing/testimonials-section.tsx`
- Create: `apps/web/src/components/marketing/pricing-section.tsx`
- Create: `apps/web/src/components/marketing/faq-section.tsx`
- Create: `apps/web/src/components/marketing/marketing-footer.tsx`
- Modify: `apps/web/src/app/page.tsx`

**Interfaces:**
- Produces: `export async function MarketingPage()` server component composing all sections
- CTAs: `<Link href="/sign-up">` and `<Link href="/sign-in">` styled with `buttonClassName`
- Nav includes `BrandLogo`, `AppearanceControls`, CTAs

- [ ] **Step 1: Product mockup (CSS UI)**

Create `product-mockup.tsx` — a non-interactive card that looks like a mini TrainFlow dashboard/spreadsheet chrome using `Card`, `Badge`, and token colors. No external images required. Use `getTranslations("landing")` for the three mock labels.

- [ ] **Step 2: Build sections as server components**

Each section: `Container` + heading + body. Use emerald sparingly (primary buttons, small accents). How section: vertical steps with numbers. Features: responsive grid `sm:grid-cols-2 lg:grid-cols-3`. Compare: two columns. Testimonials: three cards + note. Pricing: three cards; Starter/Pro CTAs → `/sign-up`; Enterprise can be `mailto:` or `/sign-up`. FAQ: definition list or stacked Q/A. Footer: columns + clear session link to `/dev/clear-clerk`.

Add subtle CSS: `motion-safe:animate-[fadeIn_0.6s_ease]` optional via `@keyframes fadeIn` in `globals.css` — keep light.

- [ ] **Step 3: Compose `MarketingPage` + wire `page.tsx`**

```tsx
// page.tsx — keep auth redirects exactly; replace logged-out JSX with:
return <MarketingPage />;
```

```tsx
// marketing-page.tsx
export async function MarketingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <MarketingNav />
      <main>
        <Hero />
        <WhatSection />
        <HowSection />
        <FeaturesSection />
        <CompareSection />
        <TestimonialsSection />
        <PricingSection />
        <FaqSection />
      </main>
      <MarketingFooter />
    </div>
  );
}
```

- [ ] **Step 4: Typecheck**

```bash
cd apps/web && pnpm lint
```

Expected: exit 0.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/marketing apps/web/src/app/page.tsx apps/web/src/app/globals.css
git commit -m "$(cat <<'EOF'
feat(web): ship premium marketing homepage

Logged-out visitors get a full SaaS landing; signed-in redirects unchanged.
EOF
)"
```

---

### Task 5: Manual QA + deploy

**Files:** none unless QA finds clear bugs

- [ ] **Step 1: Local or prod visual QA**

1. Logged-out `/` — all sections visible; CTAs hit `/sign-up` and `/sign-in`  
2. Locale toggle flips landing copy  
3. Theme toggle light/dark looks coherent  
4. Mobile width — no essential horizontal scroll; nav usable  
5. Signed-in `/` still redirects to dashboard/portal  

- [ ] **Step 2: Push + deploy**

```bash
git push origin HEAD
pnpm dlx vercel deploy --prod --non-interactive
```

Expected: READY on `https://trainflow-chi.vercel.app`.

---

## Spec coverage self-review

| Spec item | Task |
|-----------|------|
| Tokens + Geist + Tailwind | Task 1 |
| Primitives Button/Input/Card/Badge/Container | Task 2 |
| Landing i18n en + pt-BR | Task 3 |
| All landing sections + mockup | Task 4 |
| Signed-in redirects preserved | Task 4 |
| CTAs /sign-up /sign-in | Task 4 |
| No API/auth/schema changes | All tasks |
| Deploy + QA | Task 5 |

## Placeholder scan

No TBD steps; pt-BR requires full key parity with English (explicit in Task 3).

## Type consistency

- `buttonClassName` / `Button` used by nav + pricing CTAs  
- `MarketingPage` is the only page entry for logged-out home  
- `landing.*` keys shared across marketing components  
