# Trainer App Surface Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Polish the authenticated trainer app (shell + list pages) so post-login UI feels continuous with the landing — clearer headers, status color, list hover/empty states, and light shell depth — without changing flows or features.

**Architecture:** Add two small shared primitives (`Badge` variants + `PageHeader`), then wire them through `TrainerShell` and the in-scope trainer pages. Keep existing layouts, tokens, and mobile wrap patterns.

**Tech Stack:** Next.js App Router, React Server Components, Tailwind, next-intl, existing `Card` / `buttonClassName`, Jest for pure UI unit tests.

**Spec:** `docs/superpowers/specs/2026-07-25-trainer-app-surface-polish-design.md`

## Global Constraints

- Shared tokens only (`--primary` teal, `background`, `card`, `muted`, `border`, `rounded-xl`, `shadow-card`) — no new palette.
- Preserve page layouts (title + actions → cards/lists).
- Respect mobile polish: headers `flex-wrap gap-3`; no title/action collisions.
- No Framer Motion; no marketing Atmosphere / reveal in app chrome.
- New copy in both `apps/web/messages/en.json` and `apps/web/messages/pt-BR.json`.
- Client portal out of scope.
- Workout spreadsheet / wizard interaction rewrite out of scope (header polish only where trivial).

## File map

| File | Responsibility |
|------|----------------|
| `apps/web/src/components/ui/badge.tsx` | Semantic `variant` prop |
| `apps/web/src/components/ui/badge.spec.ts` | Variant → class mapping tests |
| `apps/web/src/components/ui/page-header.tsx` | Shared title / subtitle / actions |
| `apps/web/src/lib/status-badge.ts` | Map domain status → Badge variant |
| `apps/web/src/lib/status-badge.spec.ts` | Status mapping tests |
| `apps/web/src/components/trainer-shell.tsx` | Active nav + main depth |
| `apps/web/src/app/(trainer)/dashboard/page.tsx` | PageHeader, stats, lists |
| `apps/web/src/app/(trainer)/clients/page.tsx` | PageHeader, toolbar, lists |
| `apps/web/src/app/(trainer)/clients/[clientId]/page.tsx` | Status Badge variants |
| `apps/web/src/app/(trainer)/templates/page.tsx` | PageHeader + list hover |
| `apps/web/src/app/(trainer)/exercises/page.tsx` | PageHeader + list hover |
| `apps/web/src/app/(trainer)/settings/billing/page.tsx` | PageHeader |
| `apps/web/messages/en.json` / `pt-BR.json` | Subtitles + empty-state CTAs |

---

### Task 1: Badge variants + status mapping

**Files:**
- Modify: `apps/web/src/components/ui/badge.tsx`
- Create: `apps/web/src/components/ui/badge.spec.ts`
- Create: `apps/web/src/lib/status-badge.ts`
- Create: `apps/web/src/lib/status-badge.spec.ts`

**Interfaces:**
- Produces: `BadgeVariant = "default" | "success" | "quiet"`
- Produces: `Badge({ variant?: BadgeVariant, className?, ...spanProps })`
- Produces: `statusBadgeVariant(status: string): BadgeVariant`
  - `ACTIVE` → `success`
  - `PENDING` → `default`
  - `DRAFT` | `ARCHIVED` | `INACTIVE` → `quiet`
  - anything else → `default`

- [ ] **Step 1: Write failing status-mapping tests**

```ts
// apps/web/src/lib/status-badge.spec.ts
import { statusBadgeVariant } from "./status-badge";

describe("statusBadgeVariant", () => {
  it("maps ACTIVE to success", () => {
    expect(statusBadgeVariant("ACTIVE")).toBe("success");
  });
  it("maps PENDING to default", () => {
    expect(statusBadgeVariant("PENDING")).toBe("default");
  });
  it("maps DRAFT/ARCHIVED/INACTIVE to quiet", () => {
    expect(statusBadgeVariant("DRAFT")).toBe("quiet");
    expect(statusBadgeVariant("ARCHIVED")).toBe("quiet");
    expect(statusBadgeVariant("INACTIVE")).toBe("quiet");
  });
  it("falls back to default", () => {
    expect(statusBadgeVariant("UNKNOWN")).toBe("default");
  });
});
```

- [ ] **Step 2: Run tests — expect FAIL (module missing)**

Run: `cd apps/web && pnpm exec jest src/lib/status-badge.spec.ts --no-cache`

Expected: FAIL — cannot find module `./status-badge`

- [ ] **Step 3: Implement `status-badge.ts`**

```ts
// apps/web/src/lib/status-badge.ts
export type BadgeVariant = "default" | "success" | "quiet";

export function statusBadgeVariant(status: string): BadgeVariant {
  if (status === "ACTIVE") return "success";
  if (status === "PENDING") return "default";
  if (status === "DRAFT" || status === "ARCHIVED" || status === "INACTIVE") {
    return "quiet";
  }
  return "default";
}
```

- [ ] **Step 4: Re-run status tests — expect PASS**

Run: `cd apps/web && pnpm exec jest src/lib/status-badge.spec.ts --no-cache`

Expected: PASS

- [ ] **Step 5: Write failing Badge variant tests**

```ts
// apps/web/src/components/ui/badge.spec.ts
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { Badge } from "./badge";

describe("Badge", () => {
  it("applies success classes", () => {
    const html = renderToStaticMarkup(
      createElement(Badge, { variant: "success" }, "Active"),
    );
    expect(html).toContain("bg-primary/10");
    expect(html).toContain("text-primary");
  });

  it("applies quiet classes", () => {
    const html = renderToStaticMarkup(
      createElement(Badge, { variant: "quiet" }, "Draft"),
    );
    expect(html).toContain("opacity-80");
  });

  it("keeps default muted look", () => {
    const html = renderToStaticMarkup(createElement(Badge, null, "Pending"));
    expect(html).toContain("bg-muted");
    expect(html).toContain("text-muted-foreground");
  });
});
```

- [ ] **Step 6: Run Badge tests — expect FAIL (no variant prop)**

Run: `cd apps/web && pnpm exec jest src/components/ui/badge.spec.ts --no-cache`

Expected: FAIL (TypeScript/runtime — `variant` unused / classes missing)

- [ ] **Step 7: Implement Badge variants**

Replace `apps/web/src/components/ui/badge.tsx` with:

```tsx
import { cn } from "@/lib/cn";
import type { HTMLAttributes } from "react";
import type { BadgeVariant } from "@/lib/status-badge";

const variantClass: Record<BadgeVariant, string> = {
  default:
    "border-border bg-muted text-muted-foreground",
  success:
    "border-primary/20 bg-primary/10 text-primary",
  quiet:
    "border-border bg-muted/60 text-muted-foreground opacity-80",
};

export function Badge({
  className,
  variant = "default",
  ...props
}: HTMLAttributes<HTMLSpanElement> & { variant?: BadgeVariant }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        variantClass[variant],
        className,
      )}
      {...props}
    />
  );
}
```

- [ ] **Step 8: Re-run Badge tests — expect PASS**

Run: `cd apps/web && pnpm exec jest src/components/ui/badge.spec.ts src/lib/status-badge.spec.ts --no-cache`

Expected: PASS

- [ ] **Step 9: Commit**

```bash
git add apps/web/src/components/ui/badge.tsx apps/web/src/components/ui/badge.spec.ts apps/web/src/lib/status-badge.ts apps/web/src/lib/status-badge.spec.ts
git commit -m "$(cat <<'EOF'
Add semantic Badge variants for trainer status polish.

EOF
)"
```

---

### Task 2: `PageHeader` primitive

**Files:**
- Create: `apps/web/src/components/ui/page-header.tsx`

**Interfaces:**
- Consumes: none from Task 1
- Produces:

```tsx
export function PageHeader({
  title,
  subtitle,
  actions,
  className,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  className?: string;
}): JSX.Element
```

Layout: `flex flex-wrap items-start justify-between gap-3`; title `text-2xl font-semibold tracking-tight text-foreground`; subtitle `mt-1 text-sm text-muted-foreground`; actions in a `flex flex-wrap gap-2` slot.

- [ ] **Step 1: Create `page-header.tsx`**

```tsx
import { cn } from "@/lib/cn";
import type { ReactNode } from "react";

export function PageHeader({
  title,
  subtitle,
  actions,
  className,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-start justify-between gap-3",
        className,
      )}
    >
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex flex-wrap items-center gap-2 text-sm">{actions}</div>
      ) : null}
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `cd apps/web && pnpm exec tsc --noEmit -p tsconfig.json`

Expected: exit 0

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/ui/page-header.tsx
git commit -m "$(cat <<'EOF'
Add shared PageHeader for trainer list pages.

EOF
)"
```

---

### Task 3: Trainer shell polish

**Files:**
- Modify: `apps/web/src/components/trainer-shell.tsx`

**Interfaces:**
- Consumes: none
- Produces: active nav uses primary cue; `main` uses light muted depth

- [ ] **Step 1: Update active nav link classes**

In `NavLinks`, change the active branch from:

```tsx
? "bg-muted font-medium text-foreground"
```

to:

```tsx
? "border-l-2 border-primary bg-muted font-medium text-primary"
```

and add `border-l-2 border-transparent` to the inactive branch so width doesn’t jump:

```tsx
: "border-l-2 border-transparent text-muted-foreground hover:bg-muted/70 hover:text-foreground"
```

Keep `rounded-xl px-3 py-2 transition-colors` on both.

- [ ] **Step 2: Soften main background**

Change the `<main>` class from `bg-background` to `bg-muted/20` (keep `max-w-[90rem]`, padding, `flex-1`).

Do **not** import or render marketing `Atmosphere`.

- [ ] **Step 3: Manual check**

Run: `cd apps/web && pnpm dev` (if not already). Open `/dashboard` signed in. Confirm sidebar active item is teal-accented and main area is slightly off-white vs pure background; light + dark both readable.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/components/trainer-shell.tsx
git commit -m "$(cat <<'EOF'
Polish trainer shell active nav and main depth.

EOF
)"
```

---

### Task 4: Dashboard polish

**Files:**
- Modify: `apps/web/src/app/(trainer)/dashboard/page.tsx`
- Modify: `apps/web/messages/en.json` (`dashboard` keys)
- Modify: `apps/web/messages/pt-BR.json` (`dashboard` keys)

**Interfaces:**
- Consumes: `PageHeader`, `Badge` + `statusBadgeVariant`, `Card`, `buttonClassName`

- [ ] **Step 1: Add i18n keys**

In both locale files under `"dashboard"`, add:

EN:
```json
"subtitle": "Clients, programs, and what needs attention.",
"emptyProgramsCta": "Create a program",
"emptyClientsCta": "Add a client"
```

PT-BR:
```json
"subtitle": "Clientes, programas e o que precisa de atenção.",
"emptyProgramsCta": "Criar um programa",
"emptyClientsCta": "Adicionar cliente"
```

Keep existing `noPrograms` / `noClients` / `createOne` strings; empty UI can compose `noPrograms` + CTA link text from new keys (or reuse `createOne` for programs — prefer new CTA keys above for clarity).

- [ ] **Step 2: Wire PageHeader + stat cards + badges + hover + empty states**

Replace the title row with:

```tsx
<PageHeader
  title={t("title")}
  subtitle={t("subtitle")}
  actions={
    <>
      <Link href="/clients/new" className={buttonClassName("primary", "sm")}>
        {t("newClient")}
      </Link>
      <Link href="/workouts/new" className={buttonClassName("secondary", "sm")}>
        {t("newWorkout")}
      </Link>
    </>
  }
/>
```

Stat cards: keep three `Card className="p-5"`; add `border-l-2 border-l-primary/40` (or `border-t-2 border-t-primary/40`); numbers get `tabular-nums`.

Program / client list rows: add `hover:bg-muted/40` on each `<li>`.

Badges:

```tsx
<Badge variant={statusBadgeVariant(w.status ?? "")}>{statusLabel}</Badge>
```

```tsx
<Badge variant={statusBadgeVariant(c.status)}>{clientStatusLabel(...)}</Badge>
```

Empty programs cell — replace muted-only line with:

```tsx
<li className="px-4 py-8 text-center">
  <p className="text-muted-foreground">{t("noPrograms")}</p>
  <Link href="/workouts/new" className={buttonClassName("primary", "sm", "mt-3 inline-flex")}>
    {t("emptyProgramsCta")}
  </Link>
</li>
```

Empty clients similarly with `/clients/new` and `emptyClientsCta`.

Import `PageHeader` and `statusBadgeVariant`.

- [ ] **Step 3: Typecheck**

Run: `cd apps/web && pnpm exec tsc --noEmit -p tsconfig.json`

Expected: exit 0

- [ ] **Step 4: Manual check**

Open `/dashboard`: header has subtitle; stats accented; ACTIVE badges teal; empty states show CTA when lists empty.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/app/(trainer)/dashboard/page.tsx apps/web/messages/en.json apps/web/messages/pt-BR.json
git commit -m "$(cat <<'EOF'
Polish trainer dashboard headers, stats, and status badges.

EOF
)"
```

---

### Task 5: Clients list + client detail badges

**Files:**
- Modify: `apps/web/src/app/(trainer)/clients/page.tsx`
- Modify: `apps/web/src/app/(trainer)/clients/[clientId]/page.tsx`
- Modify: `apps/web/messages/en.json` (`clients` keys)
- Modify: `apps/web/messages/pt-BR.json` (`clients` keys)

**Interfaces:**
- Consumes: `PageHeader`, `Badge`, `statusBadgeVariant`

- [ ] **Step 1: Add i18n keys**

Under `"clients"` in both locales:

EN:
```json
"subtitle": "Roster, invites, and active status in one place.",
"emptyCta": "Add your first client"
```

PT-BR:
```json
"subtitle": "Lista, convites e status ativos em um só lugar.",
"emptyCta": "Adicionar o primeiro cliente"
```

- [ ] **Step 2: Update clients list page**

- Replace title/actions block with `PageHeader` (`title={t("title")}`, `subtitle={t("subtitle")}`, same atCap / New / Invite / Upgrade actions as today).
- Wrap the search `<form>` in:

```tsx
<div className="rounded-xl border border-border bg-muted/30 p-3 sm:p-4">
  <form ...>...</form>
</div>
```

- List rows: add `hover:bg-muted/40`.
- Badge: `<Badge variant={statusBadgeVariant(c.status)}>...</Badge>`
- Edit link: use `className={buttonClassName("ghost", "sm")}` (or keep text link but ensure row hover still works). Prefer ghost button for clearer affordance without changing DeleteClientButton API.
- Empty (no `q`): show `noClients` + primary CTA to `/clients/new` with `emptyCta` (disable/hide CTA when `atCap` — show upgrade link instead if at cap).
- Empty with `q`: keep `noMatch` text only (no create CTA).

- [ ] **Step 3: Update client detail badges**

In `clients/[clientId]/page.tsx`, wire client status and program status badges:

```tsx
<Badge variant={statusBadgeVariant(client.status)}>...</Badge>
<Badge variant={statusBadgeVariant(p.status)}>...</Badge>
```

Add `tracking-tight` to the page `h1` only (leave breadcrumb layout as-is; optional subtitle not required).

- [ ] **Step 4: Typecheck + manual check**

Run: `cd apps/web && pnpm exec tsc --noEmit -p tsconfig.json`

Open `/clients` and a client detail: search strip, teal ACTIVE badges, hover rows, empty CTA when no clients.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/app/(trainer)/clients/page.tsx "apps/web/src/app/(trainer)/clients/[clientId]/page.tsx" apps/web/messages/en.json apps/web/messages/pt-BR.json
git commit -m "$(cat <<'EOF'
Polish clients list chrome and status badges.

EOF
)"
```

---

### Task 6: Templates, exercises, billing headers

**Files:**
- Modify: `apps/web/src/app/(trainer)/templates/page.tsx`
- Modify: `apps/web/src/app/(trainer)/exercises/page.tsx`
- Modify: `apps/web/src/app/(trainer)/settings/billing/page.tsx`
- Modify: `apps/web/messages/en.json` / `pt-BR.json` (billing subtitle only if missing; templates already has `description`)

**Interfaces:**
- Consumes: `PageHeader`

- [ ] **Step 1: Templates**

Replace the current title block:

```tsx
<div>
  <h1>...</h1>
  <p className="mt-1 ...">{t("description")}</p>
</div>
```

with:

```tsx
<PageHeader title={t("title")} subtitle={t("description")} />
```

Wrap filter form in `rounded-xl border border-border bg-muted/30 p-3 sm:p-4`.

Add `hover:bg-muted/40` to template list rows.

Informational badges (sample/goal/level) stay `variant="default"` (no status mapping).

- [ ] **Step 2: Exercises**

If the page has an `h1` + description pattern, switch to `PageHeader`. If description key missing, add:

EN `"exercises.subtitle": "Library and custom moves for your programs."`  
PT-BR `"exercises.subtitle": "Biblioteca e exercícios personalizados para seus programas."`

Wrap filters in the same muted strip; row hover on list items. Custom/library badges stay default (optional: custom → `success` is **not** required — keep default).

- [ ] **Step 3: Billing**

Add:

EN `"billing.subtitle": "Plan, usage, and subscription."`  
PT-BR `"billing.subtitle": "Plano, uso e assinatura."`

```tsx
<PageHeader title={t("title")} subtitle={t("subtitle")} />
```

Optionally show plan status with `<Badge variant={summary.planStatus === "ACTIVE" ? "success" : "default"}>` next to the status `dd` — keep layout otherwise unchanged.

- [ ] **Step 4: Typecheck**

Run: `cd apps/web && pnpm exec tsc --noEmit -p tsconfig.json`

Expected: exit 0

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/app/(trainer)/templates/page.tsx apps/web/src/app/(trainer)/exercises/page.tsx apps/web/src/app/(trainer)/settings/billing/page.tsx apps/web/messages/en.json apps/web/messages/pt-BR.json
git commit -m "$(cat <<'EOF'
Apply PageHeader polish to templates, exercises, and billing.

EOF
)"
```

---

### Task 7: Workouts entry (light touch) + verify

**Files:**
- Modify only if a top-level title exists outside the wizard steps: check `apps/web/src/components/workouts/wizard/workout-wizard.tsx` for an `h1` / page title and add `tracking-tight` if present.
- Do **not** change spreadsheet interaction, steps, or autosave.

- [ ] **Step 1: Inspect wizard chrome**

If wizard renders a page-level heading, add `tracking-tight`. If titles live only inside steps, skip code changes and note “N/A” in the commit message body… Prefer: no commit if zero file changes; still run verification.

- [ ] **Step 2: Full verification**

Run:

```bash
cd apps/web && pnpm exec jest src/lib/status-badge.spec.ts src/components/ui/badge.spec.ts --no-cache
cd apps/web && pnpm exec tsc --noEmit -p tsconfig.json
```

Expected: all PASS / exit 0

Manual (signed-in trainer):

1. `/dashboard` — subtitle, accented stats, colored badges, hover, empty CTAs  
2. `/clients` — PageHeader, search strip, badges, hover  
3. `/templates`, `/exercises`, `/settings/billing` — PageHeader / filter strip  
4. Sidebar active = primary accent; main = `bg-muted/20`  
5. Toggle light/dark — still readable  
6. ~375px width — headers still wrap (no overflow)

- [ ] **Step 3: Commit only if wizard file changed**

```bash
git add apps/web/src/components/workouts/wizard/workout-wizard.tsx
git commit -m "$(cat <<'EOF'
Tighten workout wizard page title typography.

EOF
)"
```

---

## Spec coverage checklist

| Spec item | Task |
|-----------|------|
| Shared PageHeader | 2, 4–6 |
| Badge variants Active/Pending/quiet | 1, 4, 5 |
| List hover + empty CTAs | 4, 5, 6 |
| Dashboard stats tabular + accent | 4 |
| Shell active + main depth | 3 |
| Clients search strip | 5 |
| Templates / exercises / billing | 6 |
| Workouts entry light touch | 7 |
| No Atmosphere / portal / spreadsheet rewrite | Constraints + Task 7 |
| i18n both locales | 4–6 |

## Execution handoff

Plan complete and saved to `docs/superpowers/plans/2026-07-25-trainer-app-surface-polish.md`.

**Two execution options:**

1. **Subagent-Driven (recommended)** — fresh subagent per task, review between tasks  
2. **Inline Execution** — run tasks in this session with checkpoints  

Which approach?
