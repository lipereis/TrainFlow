# Premium SaaS Phase 3 — App Chrome Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle signed-in trainer and client chrome with Phase 1 design tokens so the app matches the marketing site, without changing drawer behavior or any business logic.

**Architecture:** In-place class updates on `TrainerShell` and `(client)/layout.tsx`. Light token alignment on locale/theme toggle chrome (shared with landing). Keep all a11y/drawer logic identical.

**Tech Stack:** Existing `TrainerShell`, Phase 1 Tailwind tokens (`background`, `foreground`, `border`, `muted`, `card`, `primary`), `BrandLogo` size `nav`.

## Global Constraints

- Chrome only — do not restyle dashboard/clients/wizard/spreadsheet/portal page bodies.
- Do not modify Clerk, Prisma, API, schema, or auth helpers.
- Preserve drawer: backdrop close, Escape, focus trap, scroll lock, `aria-expanded` / `aria-controls` / `aria-label`.
- Logo size `nav` in trainer sidebar and both headers.
- Active nav: `bg-muted` + `font-medium` (subtle); not loud emerald fills.

---

## File map

| Path | Responsibility |
|------|----------------|
| `apps/web/src/components/trainer-shell.tsx` | Sidebar, drawer panel, header, menu button tokens |
| `apps/web/src/app/(client)/layout.tsx` | Client header tokens + logo size |
| `apps/web/src/components/locale-toggle.tsx` | Light border/segment token classes |
| `apps/web/src/components/theme-toggle.tsx` | Same as locale toggle |

---

### Task 1: Restyle `TrainerShell`

**Files:**
- Modify: `apps/web/src/components/trainer-shell.tsx`

**Interfaces:**
- No new exports; behavior unchanged
- Consumes: existing token utilities from Tailwind theme

- [ ] **Step 1: Update nav link classes**

Replace the active/inactive class strings in `NavLinks` with:

```tsx
className={`rounded-xl px-3 py-2 transition-colors ${
  active
    ? "bg-muted font-medium text-foreground"
    : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
}`}
```

- [ ] **Step 2: Update `SidebarPanel` surfaces**

Replace zinc sidebar classes:

```tsx
className={`flex w-56 shrink-0 flex-col border-r border-border bg-card text-card-foreground ${className}`}
```

Logo header strip:

```tsx
<div className="border-b border-border px-3 py-4">
  <BrandLogo href="/dashboard" size="nav" />
</div>
```

Drawer panel may keep `shadow-xl` / `shadow-card` in `className` from caller — optional: change caller to `shadow-card`.

- [ ] **Step 3: Update shell header + menu button**

Outer shell:

```tsx
<div className="flex min-h-screen bg-background text-foreground">
```

Header:

```tsx
<header className="flex h-16 items-center justify-between gap-3 border-b border-border bg-card/80 px-4 backdrop-blur-md sm:px-6 md:h-auto md:py-3">
```

(Or keep `py-3` without fixed h-16 — either is fine if logo fits; prefer `py-3` + items-center.)

Menu button:

```tsx
className="inline-flex items-center justify-center rounded-xl border border-border p-2 text-foreground hover:bg-muted md:hidden"
```

Main: add `bg-background` if helpful:

```tsx
<main className="mx-auto w-full max-w-[90rem] flex-1 bg-background px-4 py-6 sm:px-6 sm:py-8">
```

Do **not** change focus-trap / Escape / pathname effects.

- [ ] **Step 4: Typecheck**

```bash
cd apps/web && pnpm lint
```

Expected: exit 0.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/trainer-shell.tsx
git commit -m "$(cat <<'EOF'
feat(web): restyle trainer shell with premium tokens

Sidebar, drawer panel, and header use Phase 1 design tokens; drawer
behavior unchanged.
EOF
)"
```

---

### Task 2: Client header + appearance toggle chrome

**Files:**
- Modify: `apps/web/src/app/(client)/layout.tsx`
- Modify: `apps/web/src/components/locale-toggle.tsx`
- Modify: `apps/web/src/components/theme-toggle.tsx`

**Interfaces:**
- No auth logic changes in client layout — only classNames and logo size

- [ ] **Step 1: Client layout header**

Replace the return chrome with:

```tsx
return (
  <div className="min-h-screen bg-background text-foreground">
    <header className="flex items-center justify-between border-b border-border bg-card/80 px-6 py-3 backdrop-blur-md">
      <BrandLogo href="/portal" size="nav" />
      <div className="flex items-center gap-3">
        <AppearanceControls />
        <UserButton />
      </div>
    </header>
    <div className="mx-auto max-w-3xl px-6 py-8">{children}</div>
  </div>
);
```

Keep the auth/role redirect block above unchanged.

- [ ] **Step 2: Tokenize locale + theme toggles**

In both `locale-toggle.tsx` and `theme-toggle.tsx`, replace segment class constants with:

```ts
const segmentBase =
  "px-2.5 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";
const segmentIdle =
  "text-muted-foreground hover:bg-muted hover:text-foreground";
const segmentActive =
  "bg-foreground text-background";
```

Group container:

```tsx
className="inline-flex overflow-hidden rounded-xl border border-border"
```

(Logic/handlers unchanged.)

- [ ] **Step 3: Typecheck**

```bash
cd apps/web && pnpm lint
```

Expected: exit 0.

- [ ] **Step 4: Commit**

```bash
git add "apps/web/src/app/(client)/layout.tsx" \
  apps/web/src/components/locale-toggle.tsx \
  apps/web/src/components/theme-toggle.tsx
git commit -m "$(cat <<'EOF'
feat(web): restyle client header and appearance toggles

Align portal chrome and locale/theme controls with Phase 1 tokens.
EOF
)"
```

---

### Task 3: Visual QA + deploy

**Files:** none unless QA finds clear chrome bugs

- [ ] **Step 1: Manual checklist**

1. Trainer desktop: sidebar tokens + `nav` logo; active link muted highlight  
2. Trainer mobile: open drawer; close via backdrop, Escape, nav link  
3. Client `/portal`: header tokens + logo fits bar  
4. Light/dark: chrome coherent on both  
5. Landing nav still OK (toggles share new styles)

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
| Trainer sidebar/drawer/header tokens | Task 1 |
| Logo `nav` in trainer chrome | Task 1 |
| Drawer a11y unchanged | Task 1 (no logic edits) |
| Client header tokens + logo `nav` | Task 2 |
| Appearance controls light alignment | Task 2 |
| No page body restyles | All tasks |
| Deploy | Task 3 |

## Placeholder scan

None.

## Type consistency

- `BrandLogo` size `"nav"` used in trainer sidebar + client header  
- Token class names match Phase 1 Tailwind theme keys  
