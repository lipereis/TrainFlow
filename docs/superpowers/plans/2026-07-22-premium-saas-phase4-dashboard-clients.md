# Premium SaaS Phase 4 — Dashboard + Clients Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Visually restyle the trainer dashboard and clients surfaces with Phase 1 tokens and UI primitives, without changing data fetching, forms logic, or APIs.

**Architecture:** In-place class swaps on existing RSC/client pages. Use `Card`, `Badge`, `Input`, `buttonClassName` / `Button`. Keep all `apiFetch` / form handlers identical.

**Tech Stack:** Next.js App Router pages under `(trainer)`, existing `@/components/ui/*`, `next-intl`.

## Global Constraints

- Visual restyle only — no new metrics, charts, or revenue.
- Do not modify Clerk, Prisma, schema, API routes, or business logic.
- Keep search `q`, delete/invite/edit submit behavior identical.
- Prefer token classes (`text-foreground`, `border-border`, `bg-card`) over `zinc-*`.
- Status labels → `Badge` where they are chip-like.

---

## File map

| Path | Task |
|------|------|
| `apps/web/src/app/(trainer)/dashboard/page.tsx` | 1 |
| `apps/web/src/app/(trainer)/clients/page.tsx` | 2 |
| `apps/web/src/app/(trainer)/clients/[clientId]/page.tsx` | 2 |
| `apps/web/src/components/client-form.tsx` | 3 |
| `apps/web/src/app/(trainer)/clients/new/page.tsx` | 3 |
| `apps/web/src/app/(trainer)/clients/[clientId]/edit/page.tsx` | 3 |
| `apps/web/src/app/(trainer)/clients/[clientId]/edit/edit-form.tsx` | 3 |
| `apps/web/src/app/(trainer)/clients/invite/page.tsx` | 3 |
| `apps/web/src/components/delete-client-button.tsx` | 3 |

---

### Task 1: Dashboard restyle

**Files:**
- Modify: `apps/web/src/app/(trainer)/dashboard/page.tsx`

**Interfaces:**
- Consumes: `Card`, `Badge`, `buttonClassName` from `@/components/ui/*`
- Data/fetch unchanged

- [ ] **Step 1: Add imports**

```tsx
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { buttonClassName } from "@/components/ui/button";
```

- [ ] **Step 2: Restyle header CTAs**

Replace zinc button Links with:

```tsx
<Link href="/clients/new" className={buttonClassName("primary", "sm")}>
  {t("newClient")}
</Link>
<Link href="/workouts/new" className={buttonClassName("secondary", "sm")}>
  {t("newWorkout")}
</Link>
```

Title: `text-2xl font-semibold text-foreground`

- [ ] **Step 3: Stat tiles → Card**

Each of the three stats:

```tsx
<Card className="p-5">
  <p className="text-sm text-muted-foreground">{t("clients")}</p>
  <p className="mt-1 text-3xl font-semibold text-foreground">
    {clientsError ? "—" : clients.length}
  </p>
  …
</Card>
```

Error text may stay `text-red-600 dark:text-red-400`.

- [ ] **Step 4: Lists → Card + Badge**

Wrap `ul` in `Card className="overflow-hidden divide-y divide-border"` (or `Card` + `divide-y divide-border` on `ul`).  
Row text: `text-foreground` / `text-muted-foreground`.  
Program/client status: wrap label in `<Badge>{statusLabel}</Badge>` instead of uppercase zinc paragraph where it was a chip.

Empty states: `text-muted-foreground`, keep same copy/links.

- [ ] **Step 5: Typecheck + commit**

```bash
cd apps/web && pnpm lint
git add apps/web/src/app/\(trainer\)/dashboard/page.tsx
git commit -m "$(cat <<'EOF'
feat(web): restyle trainer dashboard with premium tokens

Stat cards, lists, and CTAs use Phase 1 primitives; data unchanged.
EOF
)"
```

---

### Task 2: Clients list + detail restyle

**Files:**
- Modify: `apps/web/src/app/(trainer)/clients/page.tsx`
- Modify: `apps/web/src/app/(trainer)/clients/[clientId]/page.tsx`

**Interfaces:**
- Consumes: `Card`, `Badge`, `Input`, `buttonClassName`
- Search form still `method="get"` with `name="q"`

- [ ] **Step 1: Clients list page**

- Header title `text-foreground`
- CTAs: primary → `/clients/new`, secondary → `/clients/invite` via `buttonClassName`
- Search: `<Input name="q" … />` + `<button type="submit" className={buttonClassName("secondary", "sm")}>`
- Clear link: `text-muted-foreground hover:underline`
- List: `Card` + divide rows; status `<Badge>`; email `text-muted-foreground`
- Keep `DeleteClientButton` usage as-is (styled in Task 3)

- [ ] **Step 2: Client detail page**

- Page chrome: titles/links with tokens
- Profile field grid inside `Card className="p-6"` (or keep `dl` with card wrapper)
- `Field` helper: label `text-muted-foreground`, value `text-foreground`
- Status → `Badge`
- Action links (edit, new workout, etc.) → `buttonClassName("primary"|"secondary"|"ghost", "sm")` as Links
- Programs list: `Card` + `Badge` for program status
- Do not change `apiFetch` / `notFound` logic

- [ ] **Step 3: Typecheck + commit**

```bash
cd apps/web && pnpm lint
git add apps/web/src/app/\(trainer\)/clients/page.tsx \
  apps/web/src/app/\(trainer\)/clients/\[clientId\]/page.tsx
git commit -m "$(cat <<'EOF'
feat(web): restyle clients list and detail pages

Token surfaces, badges, and CTAs; search and profile data unchanged.
EOF
)"
```

---

### Task 3: Client forms, invite, delete button

**Files:**
- Modify: `apps/web/src/components/client-form.tsx`
- Modify: `apps/web/src/app/(trainer)/clients/new/page.tsx`
- Modify: `apps/web/src/app/(trainer)/clients/[clientId]/edit/page.tsx`
- Modify: `apps/web/src/app/(trainer)/clients/[clientId]/edit/edit-form.tsx` (if presentational classes exist)
- Modify: `apps/web/src/app/(trainer)/clients/invite/page.tsx`
- Modify: `apps/web/src/components/delete-client-button.tsx`

**Interfaces:**
- Form schemas, `onSubmit`, invite fetch, delete fetch **unchanged**

- [ ] **Step 1: `client-form.tsx` classes**

Replace `inputClass` / `labelClass` with token equivalents, preferably wrapping `Input`:

```tsx
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

const labelClass = "block space-y-1 text-sm text-foreground";
```

Use `<Input className={cn(errors.x && "border-red-500")} … {...register(...)} />` for text inputs.  
For `<select>` / `<textarea>`, use:

```tsx
className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground …"
```

Submit: `<Button type="submit" disabled={isSubmitting}>…</Button>`

Do not change zod/resolver/payload mapping.

- [ ] **Step 2: new / edit page wrappers**

Replace zinc section titles and card wrappers with `text-foreground` and `Card className="p-6"` (or equivalent). Keep form wiring.

- [ ] **Step 3: Invite page**

- Title tokens
- Form in `Card className="space-y-4 p-6"`
- Fields: `Input` + labels
- Submit: `Button`
- Handlers/fetch unchanged

- [ ] **Step 4: Delete button presentational**

For `variant === "button"`, use danger-styled classes compatible with tokens, e.g.:

```tsx
className="inline-flex items-center justify-center rounded-xl border border-red-300 bg-card px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950/40"
```

Link variant: keep underline style with `text-red-600`. Logic unchanged.

- [ ] **Step 5: Typecheck + commit**

```bash
cd apps/web && pnpm lint
git add apps/web/src/components/client-form.tsx \
  apps/web/src/components/delete-client-button.tsx \
  apps/web/src/app/\(trainer\)/clients/new/page.tsx \
  apps/web/src/app/\(trainer\)/clients/invite/page.tsx \
  apps/web/src/app/\(trainer\)/clients/\[clientId\]/edit/
git commit -m "$(cat <<'EOF'
feat(web): restyle client forms and invite UI

Inputs, cards, and actions use premium primitives; submit logic unchanged.
EOF
)"
```

---

### Task 4: QA + deploy

**Files:** none unless clear visual bugs

- [ ] **Step 1: Manual checklist**

1. Dashboard loads; stats + lists render; CTAs navigate  
2. Clients search `?q=` still filters  
3. Open client → edit → save still works  
4. Invite form still posts  
5. Delete still confirms and removes  
6. Light/dark look coherent  

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
| Dashboard restyle | Task 1 |
| Clients list + detail | Task 2 |
| new/edit/invite/forms | Task 3 |
| No new APIs/metrics | All |
| Deploy | Task 4 |

## Placeholder scan

None.

## Type consistency

- `buttonClassName("primary"|"secondary"|"ghost", "sm"|"md")` for Links/buttons  
- `Badge` for status chips  
- `Input` / `Button` / `Card` from `@/components/ui/*`  
