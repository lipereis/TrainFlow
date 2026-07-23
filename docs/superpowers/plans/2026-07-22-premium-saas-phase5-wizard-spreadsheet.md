# Premium SaaS Phase 5 — Wizard + Spreadsheet Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Visually restyle the workout wizard, spreadsheet chrome, templates, and exercises pages with Phase 1 tokens — without changing autosave, DnD, exports, or APIs.

**Architecture:** Cascade first via shared class constants in `wizard/types.ts` (`inputClass`, `labelClass`, `btnPrimary`, `btnSecondary`), then replace leftover hard-coded `zinc-*` in wizard/spreadsheet/pages. Keep `min-w-[72rem]` + `overflow-x-auto` and all print/`no-print` hooks.

**Tech Stack:** Next.js App Router, existing `@/components/ui/*` (`buttonClassName`, `Card`, `Badge`, `Input`), `next-intl`, TanStack Table (exercise table — chrome only).

## Global Constraints

- Visual restyle only — no Clerk / Prisma / schema / API / business-logic changes.
- Keep autosave, patch payloads, drag-and-drop, export downloads, and wizard step flow identical.
- Prefer cascading via shared class constants to minimize drift.
- Preserve `@media print` in `apps/web/src/app/globals.css` and existing `no-print` / `workout-day` / `workout-table-scroll` class names.
- Do not remove horizontal scroll or change table column structure.
- Prefer token classes (`text-foreground`, `border-border`, `bg-card`, `bg-muted`, `text-muted-foreground`) over `zinc-*`.

---

## File map

| Path | Task |
|------|------|
| `apps/web/src/components/workouts/wizard/types.ts` | 1 |
| `apps/web/src/components/workouts/wizard/workout-wizard.tsx` | 2 |
| `apps/web/src/components/workouts/wizard/progress-indicator.tsx` | 2 |
| `apps/web/src/components/workouts/wizard/step-client.tsx` | 2 |
| `apps/web/src/components/workouts/wizard/step-program.tsx` | 2 |
| `apps/web/src/components/workouts/wizard/step-days.tsx` | 2 |
| `apps/web/src/components/workouts/wizard/step-exercises.tsx` | 2 |
| `apps/web/src/components/workouts/wizard/step-review.tsx` | 2 |
| `apps/web/src/components/workouts/wizard/exercise-picker-modal.tsx` | 2 |
| `apps/web/src/components/workouts/spreadsheet/workout-spreadsheet.tsx` | 3 |
| `apps/web/src/components/workouts/spreadsheet/program-header.tsx` | 3 |
| `apps/web/src/components/workouts/spreadsheet/day-section.tsx` | 3 |
| `apps/web/src/components/workouts/spreadsheet/summary-cards.tsx` | 3 |
| `apps/web/src/components/workouts/spreadsheet/exercise-table.tsx` | 4 |
| `apps/web/src/app/(trainer)/templates/page.tsx` | 5 |
| `apps/web/src/app/(trainer)/exercises/page.tsx` | 5 |
| `apps/web/src/components/exercises/create-exercise-form.tsx` | 5 |

`observation-field.tsx` and `autosave-badge.tsx` need no dedicated task: observation already uses shared `inputClass`/`labelClass`; autosave uses semantic red/amber/emerald (leave as-is). Workout page wrappers (`workouts/new`, `workouts/[workoutId]`) have no zinc chrome — skip unless a leftover appears during QA.

---

### Task 1: Tokenize shared wizard class constants

**Files:**
- Modify: `apps/web/src/components/workouts/wizard/types.ts`

**Interfaces:**
- Consumes: `buttonClassName` from `@/components/ui/button`
- Produces: updated `inputClass`, `labelClass`, `btnPrimary`, `btnSecondary` string values used across wizard + spreadsheet

- [ ] **Step 1: Replace the four exported class constants**

Near the bottom of `types.ts`, replace the current zinc-based exports with:

```ts
import { buttonClassName } from "@/components/ui/button";

export const inputClass =
  "w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50";
export const labelClass = "block space-y-1 text-sm text-foreground";
export const btnPrimary = buttonClassName("primary", "sm");
export const btnSecondary = buttonClassName("secondary", "sm");
```

Place the `import` with other imports at the top of the file (do not leave a mid-file import). Do not change DTO types, category helpers, or any other exports.

- [ ] **Step 2: Verify consumers still typecheck**

```bash
pnpm --filter @trainflow/web exec tsc --noEmit
```

Expected: exit 0 (no errors from `btnPrimary`/`btnSecondary` becoming longer class strings).

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/workouts/wizard/types.ts
git commit -m "$(cat <<'EOF'
feat(web): tokenize wizard shared button and input classes

Cascade Phase 1 tokens through wizard and spreadsheet chrome.
EOF
)"
```

---

### Task 2: Wizard shell, steps, and exercise picker

**Files:**
- Modify: `apps/web/src/components/workouts/wizard/workout-wizard.tsx`
- Modify: `apps/web/src/components/workouts/wizard/progress-indicator.tsx`
- Modify: `apps/web/src/components/workouts/wizard/step-client.tsx`
- Modify: `apps/web/src/components/workouts/wizard/step-program.tsx`
- Modify: `apps/web/src/components/workouts/wizard/step-days.tsx`
- Modify: `apps/web/src/components/workouts/wizard/step-exercises.tsx`
- Modify: `apps/web/src/components/workouts/wizard/step-review.tsx`
- Modify: `apps/web/src/components/workouts/wizard/exercise-picker-modal.tsx`

**Interfaces:**
- Consumes: `btnPrimary` / `btnSecondary` / `inputClass` / `labelClass` from Task 1 (already wired — do not re-export)
- Optional: `Card` from `@/components/ui/card` for clear surface wrappers
- Handlers, fetch, DnD sensors, step state **unchanged**

- [ ] **Step 1: Apply zinc → token mapping in all listed files**

Systematic replacements (keep layout/spacing utilities):

| From | To |
|------|----|
| `text-zinc-900 dark:text-zinc-100` | `text-foreground` |
| `text-zinc-700 dark:text-zinc-200` / `text-zinc-700 dark:text-zinc-300` | `text-foreground` |
| `text-zinc-600 dark:text-zinc-300` / `text-zinc-600 dark:text-zinc-400` | `text-muted-foreground` |
| `text-zinc-500 dark:text-zinc-400` | `text-muted-foreground` |
| `text-zinc-400 dark:text-zinc-500` | `text-muted-foreground` |
| `text-zinc-300 dark:text-zinc-600` (separator) | `text-muted-foreground` |
| `border-zinc-200 dark:border-zinc-800` / `border-zinc-200 dark:border-zinc-700` | `border-border` |
| `border-zinc-100 … dark:border-zinc-800` | `border-border` |
| `border-zinc-300 dark:border-zinc-700` | `border-border` |
| `divide-zinc-200 dark:divide-zinc-800` / `divide-zinc-100 …` | `divide-border` |
| `bg-white dark:bg-zinc-900` | `bg-card` |
| `bg-zinc-50 … dark:bg-zinc-900` | `bg-muted` |
| `hover:bg-zinc-50 dark:hover:bg-zinc-800` | `hover:bg-muted` |
| `bg-zinc-100 dark:bg-zinc-800` (selected row) | `bg-muted` |

**Progress indicator active/complete states** (replace zinc pill colors):

```tsx
// active step number
"bg-primary text-primary-foreground"
// completed
"bg-muted text-foreground"
// upcoming
"bg-muted text-muted-foreground"
```

Active step label: `font-medium text-foreground`; completed: `text-foreground`; upcoming: `text-muted-foreground`.

**Exercise picker modal panel:**

```tsx
className="flex max-h-[90vh] w-full max-w-lg flex-col rounded-xl border border-border bg-card shadow-lg"
```

Keep backdrop click-to-close and focus behavior identical. Keep `btnPrimary`/`btnSecondary`/`inputClass`/`labelClass` usages.

**Surfaces:** Where a block is clearly a card (`rounded border … bg-white p-6`), either swap classes to `rounded-xl border border-border bg-card p-6` or wrap with `<Card className="p-6">` — do not change children structure or form wiring.

- [ ] **Step 2: Confirm no zinc left in wizard folder**

```bash
rg "zinc-" apps/web/src/components/workouts/wizard --glob '*.tsx'
```

Expected: no matches (or only intentional non-UI comments — there should be zero).

- [ ] **Step 3: Typecheck + commit**

```bash
pnpm --filter @trainflow/web exec tsc --noEmit
git add apps/web/src/components/workouts/wizard
git commit -m "$(cat <<'EOF'
feat(web): restyle workout wizard with premium tokens

Shell, steps, progress, and exercise picker use Phase 1 surfaces.
EOF
)"
```

---

### Task 3: Spreadsheet chrome (toolbar, header, day, summary)

**Files:**
- Modify: `apps/web/src/components/workouts/spreadsheet/workout-spreadsheet.tsx`
- Modify: `apps/web/src/components/workouts/spreadsheet/program-header.tsx`
- Modify: `apps/web/src/components/workouts/spreadsheet/day-section.tsx`
- Modify: `apps/web/src/components/workouts/spreadsheet/summary-cards.tsx`

**Interfaces:**
- Consumes: `btnPrimary` / `btnSecondary` / `inputClass` / `labelClass` from Task 1
- Export/print/duplicate/add-day handlers **unchanged**
- Keep `no-print` on toolbar buttons that already have it
- Keep `workout-day` and `workout-spreadsheet` class names for print CSS

- [ ] **Step 1: Restyle chrome classes**

Same zinc → token mapping as Task 2.

Specific targets:

- `workout-spreadsheet.tsx`: loading text → `text-muted-foreground`; section headings → `text-muted-foreground`; keep `btnPrimary`/`btnSecondary` on export/actions.
- `program-header.tsx`: `border-b border-border`; titles `text-foreground`; status chip → `rounded-lg border border-border bg-muted px-2 py-1 text-xs uppercase tracking-wide text-muted-foreground` (or `<Badge>` if it fits without changing layout).
- `day-section.tsx`: section `border-b border-border`; keep `print:break-inside-avoid` and `no-print` on action buttons.
- `summary-cards.tsx`: outer/inner panels → `rounded-xl border border-border bg-card` / `bg-muted` as appropriate; labels `text-muted-foreground`; values `text-foreground`. Optional: wrap panels in `Card`.

Do **not** edit `exercise-table.tsx` in this task.

- [ ] **Step 2: Verify print hooks still present**

```bash
rg "no-print|workout-day|workout-spreadsheet" apps/web/src/components/workouts/spreadsheet
```

Expected: matches still present on the same interactive/print surfaces as before.

- [ ] **Step 3: Typecheck + commit**

```bash
pnpm --filter @trainflow/web exec tsc --noEmit
git add apps/web/src/components/workouts/spreadsheet/workout-spreadsheet.tsx \
  apps/web/src/components/workouts/spreadsheet/program-header.tsx \
  apps/web/src/components/workouts/spreadsheet/day-section.tsx \
  apps/web/src/components/workouts/spreadsheet/summary-cards.tsx
git commit -m "$(cat <<'EOF'
feat(web): restyle spreadsheet chrome with premium tokens

Toolbar, program header, day sections, and summary cards.
EOF
)"
```

---

### Task 4: Exercise table visual chrome

**Files:**
- Modify: `apps/web/src/components/workouts/spreadsheet/exercise-table.tsx`

**Interfaces:**
- Column defs, cell editors, reorder/move/patch callbacks **unchanged**
- Keep `workout-table-scroll`, `overflow-x-auto`, and `min-w-[72rem]`

- [ ] **Step 1: Tokenize cell input + table chrome**

Replace the local cell input constant (near top of file) with:

```ts
const cellInputClass =
  "w-full min-w-[3.5rem] rounded border border-transparent bg-transparent px-1 py-0.5 text-sm text-foreground hover:border-border focus:border-ring focus:outline-none";
```

Table wrapper / header / rows:

```tsx
<div className="workout-table-scroll overflow-x-auto rounded-xl border border-border">
  <table className="w-full min-w-[72rem] border-collapse text-left text-sm">
    <thead className="bg-muted">
      …
      <th className="whitespace-nowrap border-b border-border px-2 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
```

Row borders: `border-b border-border last:border-0`.  
Empty state: `border-dashed border-border text-muted-foreground`.  
Inline selects (e.g. category): `rounded border border-border bg-card … text-foreground`.  
Mute icons/order controls: `text-muted-foreground`.

Do not change TanStack column IDs, patch shapes, or DnD attributes.

- [ ] **Step 2: Confirm table width/scroll preserved**

```bash
rg "min-w-\[72rem\]|workout-table-scroll|overflow-x-auto" apps/web/src/components/workouts/spreadsheet/exercise-table.tsx
```

Expected: all three still present.

- [ ] **Step 3: Typecheck + commit**

```bash
pnpm --filter @trainflow/web exec tsc --noEmit
git add apps/web/src/components/workouts/spreadsheet/exercise-table.tsx
git commit -m "$(cat <<'EOF'
feat(web): restyle exercise spreadsheet table chrome

Token borders and headers; keep wide table and horizontal scroll.
EOF
)"
```

---

### Task 5: Templates + exercises pages

**Files:**
- Modify: `apps/web/src/app/(trainer)/templates/page.tsx`
- Modify: `apps/web/src/app/(trainer)/exercises/page.tsx`
- Modify: `apps/web/src/components/exercises/create-exercise-form.tsx`

**Interfaces:**
- Consumes: `Card`, `Badge`, `Input`, `Button` / `buttonClassName` from `@/components/ui/*`
- Search/filter query params and create-exercise submit **unchanged**

- [ ] **Step 1: Templates page chrome**

Match Phase 4 clients list patterns:

- Title: `text-2xl font-semibold text-foreground`; subtitle `text-muted-foreground`
- Filter inputs: `<Input … />` or `rounded-xl border border-border bg-card … text-foreground`
- Submit/filter button: `buttonClassName("secondary", "sm")`; clear link `text-muted-foreground hover:underline`
- List: `Card` + `divide-y divide-border`; goal/level chips → `<Badge>`
- Empty state: `text-muted-foreground`

Do not change `apiFetch` or searchParam keys.

- [ ] **Step 2: Exercises page chrome**

Same mapping as templates. Muscle/equipment chips → `Badge`. Keep external video links; style as `text-foreground underline` (or muted). Keep `CreateExerciseForm` mount point.

- [ ] **Step 3: `create-exercise-form.tsx`**

Replace local zinc `inputClass` / `labelClass` / primary buttons:

```tsx
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

const labelClass = "block space-y-1 text-sm text-foreground";
```

- Toggle open button → `<Button type="button" size="sm">…</Button>`
- Form panel → `<Card className="space-y-3 p-4">…</Card>`
- Text fields → `<Input … />`; selects/textareas → `rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground`
- Submit → `<Button type="submit" size="sm" disabled={…}>`
- Close control → `text-muted-foreground hover:text-foreground`

Do not change form field names, POST payload, or success refresh behavior.

- [ ] **Step 4: Zinc sweep + typecheck + commit**

```bash
rg "zinc-" apps/web/src/app/\(trainer\)/templates apps/web/src/app/\(trainer\)/exercises apps/web/src/components/exercises
pnpm --filter @trainflow/web exec tsc --noEmit
git add apps/web/src/app/\(trainer\)/templates/page.tsx \
  apps/web/src/app/\(trainer\)/exercises/page.tsx \
  apps/web/src/components/exercises/create-exercise-form.tsx
git commit -m "$(cat <<'EOF'
feat(web): restyle templates and exercises with premium tokens

List filters, chips, and create-exercise form match Phase 4 chrome.
EOF
)"
```

Expected: `rg` finds no `zinc-` in those paths; `tsc` exits 0.

---

### Task 6: QA gate

**Files:**
- Verify only (no product code unless a leftover zinc class is found)

- [ ] **Step 1: Repo zinc sweep on Phase 5 surfaces**

```bash
rg "zinc-" apps/web/src/components/workouts apps/web/src/app/\(trainer\)/templates apps/web/src/app/\(trainer\)/exercises apps/web/src/components/exercises
```

Expected: zero matches. If any remain, fix in-place (class swap only) and amend into a new commit (`fix(web): clear leftover zinc in phase 5 surfaces`).

- [ ] **Step 2: Print CSS still intact**

```bash
rg "@media print|no-print|workout-day|workout-table-scroll" apps/web/src/app/globals.css apps/web/src/components/workouts/spreadsheet
```

Expected: print block in `globals.css` unchanged in behavior; spreadsheet still uses the hook class names.

- [ ] **Step 3: Final typecheck**

```bash
pnpm --filter @trainflow/web exec tsc --noEmit
```

Expected: exit 0.

- [ ] **Step 4: Manual smoke (implementer or user)**

1. `/workouts/new` — walk all wizard steps; create program.
2. Open spreadsheet — edit a cell; confirm autosave badge still works.
3. Export PDF + Excel from spreadsheet toolbar.
4. `/templates` and `/exercises` — filter + open create-exercise form.
5. Toggle light/dark — surfaces readable.
6. Optional: browser print preview on a workout — chrome hidden, table readable.

- [ ] **Step 5: Commit any QA fixes** (skip if clean)

Only if Step 1–2 required code changes. Otherwise no commit.

---

## Spec coverage checklist

| Spec requirement | Task |
|------------------|------|
| Tokenize `types.ts` shared classes | 1 |
| Wizard steps + progress + modal | 2 |
| Spreadsheet chrome (toolbar/header/day/summary) | 3 |
| Exercise table borders/inputs/headers; keep scroll | 4 |
| Templates + exercises + create form | 5 |
| Preserve print CSS / `no-print` | 3, 4, 6 |
| No API/auth/schema; tsc passes | all + 6 |
| Light/dark coherent | 2–5 + 6 smoke |

---

## Out of scope (do not implement)

- Client portal body / Clerk auth pages (Phase 6)
- Framer Motion (Phase 7)
- Mobile-first spreadsheet rebuild
- Changing export route logic or autosave hook internals
