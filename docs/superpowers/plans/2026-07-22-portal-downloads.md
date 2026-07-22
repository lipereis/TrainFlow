# Client Portal Downloads Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let clients download ACTIVE workout programs as PDF and Excel from `/portal`, reusing existing export generators with ownership checks.

**Architecture:** Add a shared `authorizeWorkoutExport(programId)` helper used by both export route handlers. Trainers keep current ownership via `requireTrainerId` + `loadExportPayload`. Clients use `requireClientId` and may export only when `program.clientId` matches and `status === ACTIVE`. Portal cards get download controls that call the same authenticated download helper trainers already use.

**Tech Stack:** Next.js 14 App Router Route Handlers, Clerk `auth()`, Prisma `workoutProgram`, existing `pdfService` / `excelService` / `loadExportPayload`, `next-intl`, existing `downloadWorkoutExport`.

## Global Constraints

- Formats: PDF + Excel only.
- Client may export only programs where `clientId` matches session client and `status === ACTIVE`.
- Reuse `GET /api/workouts/[id]/export.pdf` and `GET /api/workouts/[id]/export.xlsx` (no new URL paths).
- Do not translate PDF/Excel document body strings.
- Do not add portal detail routes or client editing.
- Prefer existing zinc / `dark:` UI patterns; no new design system.
- Commit when each task’s verification passes (unless the user says otherwise mid-run).

---

## File map

| Path | Responsibility |
|------|----------------|
| `apps/web/src/server/export-access.ts` | Pure client-export eligibility + `authorizeWorkoutExport` |
| `apps/web/src/server/export-access.spec.ts` | Unit tests for pure eligibility rules |
| `apps/web/src/app/api/workouts/[id]/export.pdf/route.ts` | Use shared authorize helper |
| `apps/web/src/app/api/workouts/[id]/export.xlsx/route.ts` | Use shared authorize helper |
| `apps/web/src/components/portal-export-buttons.tsx` | Client download buttons (Clerk token + `downloadWorkoutExport`) |
| `apps/web/src/app/(client)/portal/page.tsx` | Render export buttons on each ACTIVE card |
| `apps/web/messages/en.json` | `portal.downloadPdf` / `portal.downloadExcel` |
| `apps/web/messages/pt-BR.json` | Same keys in Portuguese |
| `apps/web/package.json` | Add `test` script + jest (minimal, matching workout-math) |
| `apps/web/jest.config.js` | Jest/ts-jest config for `src/**/*.spec.ts` |

---

### Task 1: Pure client export eligibility + unit tests

**Files:**
- Create: `apps/web/src/server/export-access.ts`
- Create: `apps/web/src/server/export-access.spec.ts`
- Create: `apps/web/jest.config.js`
- Modify: `apps/web/package.json`

**Interfaces:**
- Produces:
  ```ts
  export type ExportProgramRow = {
    id: string;
    trainerId: string;
    clientId: string;
    status: "DRAFT" | "ACTIVE" | "ARCHIVED";
  };

  /** Throws ApiError notFound/forbidden; returns trainerId for loadExportPayload. */
  export function trainerIdForClientExport(
    program: ExportProgramRow | null,
    clientId: string,
  ): string;

  /** Session-aware authorize used by route handlers. */
  export async function authorizeWorkoutExport(
    programId: string,
  ): Promise<{ trainerId: string }>;
  ```
- Consumes: `requireTrainerId`, `requireClientId`, `prisma`, `ApiError` helpers, `workoutsService.get` (trainer path)

- [ ] **Step 1: Add jest to `@trainflow/web`**

```bash
cd apps/web && pnpm add -D jest@^29.7.0 ts-jest@^29.2.5 @types/jest@^29.5.14
```

Update `apps/web/package.json` scripts:

```json
"lint": "tsc --noEmit",
"test": "jest"
```

Create `apps/web/jest.config.js`:

```js
/** @type {import('jest').Config} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/src"],
  testMatch: ["**/*.spec.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
};
```

- [ ] **Step 2: Write failing tests for pure eligibility**

Create `apps/web/src/server/export-access.spec.ts`:

```ts
import { ApiError } from "./errors";
import { trainerIdForClientExport } from "./export-access";

const base = {
  id: "p1",
  trainerId: "t1",
  clientId: "c1",
  status: "ACTIVE" as const,
};

describe("trainerIdForClientExport", () => {
  it("returns trainerId for matching ACTIVE program", () => {
    expect(trainerIdForClientExport(base, "c1")).toBe("t1");
  });

  it("404 when program missing", () => {
    try {
      trainerIdForClientExport(null, "c1");
      fail("expected throw");
    } catch (e) {
      expect(e).toBeInstanceOf(ApiError);
      expect((e as ApiError).status).toBe(404);
      expect((e as ApiError).code).toBe("WORKOUT_NOT_FOUND");
    }
  });

  it("403 when client does not own program", () => {
    try {
      trainerIdForClientExport(base, "other");
      fail("expected throw");
    } catch (e) {
      expect(e).toBeInstanceOf(ApiError);
      expect((e as ApiError).status).toBe(403);
      expect((e as ApiError).code).toBe("FORBIDDEN");
    }
  });

  it("403 when program is DRAFT", () => {
    try {
      trainerIdForClientExport({ ...base, status: "DRAFT" }, "c1");
      fail("expected throw");
    } catch (e) {
      expect(e).toBeInstanceOf(ApiError);
      expect((e as ApiError).status).toBe(403);
      expect((e as ApiError).code).toBe("FORBIDDEN");
    }
  });

  it("403 when program is ARCHIVED", () => {
    try {
      trainerIdForClientExport({ ...base, status: "ARCHIVED" }, "c1");
      fail("expected throw");
    } catch (e) {
      expect(e).toBeInstanceOf(ApiError);
      expect((e as ApiError).status).toBe(403);
    }
  });
});
```

- [ ] **Step 3: Run tests — expect FAIL (module missing)**

```bash
cd apps/web && pnpm test -- export-access.spec.ts
```

Expected: FAIL — cannot find module `./export-access` or `trainerIdForClientExport` undefined.

- [ ] **Step 4: Implement pure helper + authorize stub file**

Create `apps/web/src/server/export-access.ts`:

```ts
import { auth } from "@clerk/nextjs/server";
import { requireClientId, requireTrainerId } from "@/server/auth";
import { forbidden, notFound, unauthorized } from "@/server/errors";
import { prisma } from "@/server/prisma";
import { workoutsService } from "@/server/workouts.service";

export type ExportProgramRow = {
  id: string;
  trainerId: string;
  clientId: string;
  status: "DRAFT" | "ACTIVE" | "ARCHIVED";
};

export function trainerIdForClientExport(
  program: ExportProgramRow | null,
  clientId: string,
): string {
  if (!program) {
    throw notFound("WORKOUT_NOT_FOUND", "Workout program not found");
  }
  if (program.clientId !== clientId || program.status !== "ACTIVE") {
    throw forbidden("FORBIDDEN", "Workout not available for export");
  }
  return program.trainerId;
}

/**
 * Authorize PDF/XLSX export for the current session.
 * Trainer: must own the program. Client: must own it and status ACTIVE.
 */
export async function authorizeWorkoutExport(
  programId: string,
): Promise<{ trainerId: string }> {
  const session = await auth();
  if (!session.userId) {
    throw unauthorized("UNAUTHORIZED", "Missing session");
  }

  const claims = session.sessionClaims as Record<string, unknown> | null;
  const meta = (claims?.metadata ?? claims?.publicMetadata) as
    | { role?: string }
    | null
    | undefined;
  const role = meta?.role;

  if (role === "CLIENT") {
    const { clientId } = await requireClientId();
    const program = await prisma.workoutProgram.findUnique({
      where: { id: programId },
      select: {
        id: true,
        trainerId: true,
        clientId: true,
        status: true,
      },
    });
    const trainerId = trainerIdForClientExport(
      program as ExportProgramRow | null,
      clientId,
    );
    return { trainerId };
  }

  // Default / TRAINER path (also covers trainers whose claim role is TRAINER)
  const { trainerId } = await requireTrainerId();
  await workoutsService.get(trainerId, programId);
  return { trainerId };
}
```

- [ ] **Step 5: Run tests — expect PASS**

```bash
cd apps/web && pnpm test -- export-access.spec.ts
```

Expected: all 5 tests PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/web/package.json apps/web/pnpm-lock.yaml apps/web/jest.config.js \
  apps/web/src/server/export-access.ts apps/web/src/server/export-access.spec.ts
# if lockfile is at repo root:
git add pnpm-lock.yaml
git commit -m "$(cat <<'EOF'
feat(web): add client export eligibility helper

Pure ACTIVE-owner check with unit tests; authorizeWorkoutExport
ready for PDF/XLSX route handlers.
EOF
)"
```

---

### Task 2: Wire export route handlers

**Files:**
- Modify: `apps/web/src/app/api/workouts/[id]/export.pdf/route.ts`
- Modify: `apps/web/src/app/api/workouts/[id]/export.xlsx/route.ts`

**Interfaces:**
- Consumes: `authorizeWorkoutExport(programId): Promise<{ trainerId: string }>`
- Consumes: `loadExportPayload(trainerId, programId)`, `pdfService.build`, `excelService.build`

- [ ] **Step 1: Update PDF route**

Replace `apps/web/src/app/api/workouts/[id]/export.pdf/route.ts` with:

```ts
import { NextRequest, NextResponse } from "next/server";
import { authorizeWorkoutExport } from "@/server/export-access";
import { pdfService } from "@/server/pdf.service";
import { loadExportPayload } from "@/server/export-payload";
import { toErrorResponse } from "@/server/http";

export const runtime = "nodejs";

type Ctx = { params: { id: string } };

export async function GET(_req: NextRequest, ctx: Ctx) {
  try {
    const { trainerId } = await authorizeWorkoutExport(ctx.params.id);
    const payload = await loadExportPayload(trainerId, ctx.params.id);
    const buffer = await pdfService.build(payload);
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="workout-${ctx.params.id}.pdf"`,
      },
    });
  } catch (err) {
    return toErrorResponse(err);
  }
}
```

- [ ] **Step 2: Update XLSX route**

Replace `apps/web/src/app/api/workouts/[id]/export.xlsx/route.ts` with:

```ts
import { NextRequest, NextResponse } from "next/server";
import { authorizeWorkoutExport } from "@/server/export-access";
import { excelService } from "@/server/excel.service";
import { loadExportPayload } from "@/server/export-payload";
import { toErrorResponse } from "@/server/http";

export const runtime = "nodejs";

type Ctx = { params: { id: string } };

export async function GET(_req: NextRequest, ctx: Ctx) {
  try {
    const { trainerId } = await authorizeWorkoutExport(ctx.params.id);
    const payload = await loadExportPayload(trainerId, ctx.params.id);
    const buffer = await excelService.build(payload);
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="workout-${ctx.params.id}.xlsx"`,
      },
    });
  } catch (err) {
    return toErrorResponse(err);
  }
}
```

- [ ] **Step 3: Typecheck**

```bash
cd apps/web && pnpm lint
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/app/api/workouts/[id]/export.pdf/route.ts \
  apps/web/src/app/api/workouts/[id]/export.xlsx/route.ts
git commit -m "$(cat <<'EOF'
feat(web): allow clients to download ACTIVE program exports

Reuse PDF/XLSX handlers with authorizeWorkoutExport for trainer
or owning client sessions.
EOF
)"
```

---

### Task 3: Portal UI + i18n

**Files:**
- Create: `apps/web/src/components/portal-export-buttons.tsx`
- Modify: `apps/web/src/app/(client)/portal/page.tsx`
- Modify: `apps/web/messages/en.json`
- Modify: `apps/web/messages/pt-BR.json`

**Interfaces:**
- Consumes: `downloadWorkoutExport(workoutId, format, getToken)` from `@/lib/api-download`
- Consumes: `useAuth().getToken` from `@clerk/nextjs`
- Produces: `<PortalExportButtons workoutId={string} />`

- [ ] **Step 1: Add message keys**

In `apps/web/messages/en.json` under `portal`, add:

```json
"downloadPdf": "Download PDF",
"downloadExcel": "Download Excel"
```

In `apps/web/messages/pt-BR.json` under `portal`, add:

```json
"downloadPdf": "Baixar PDF",
"downloadExcel": "Baixar Excel"
```

- [ ] **Step 2: Create portal export buttons**

Create `apps/web/src/components/portal-export-buttons.tsx`:

```tsx
"use client";

import { useAuth } from "@clerk/nextjs";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { downloadWorkoutExport } from "@/lib/api-download";

const btnSecondary =
  "rounded border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-800 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800";

export function PortalExportButtons({ workoutId }: { workoutId: string }) {
  const t = useTranslations("portal");
  const { getToken } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onExport(format: "pdf" | "xlsx") {
    setBusy(true);
    setError(null);
    try {
      await downloadWorkoutExport(workoutId, format, getToken);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Export failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className={btnSecondary}
          disabled={busy}
          onClick={() => void onExport("pdf")}
        >
          {t("downloadPdf")}
        </button>
        <button
          type="button"
          className={btnSecondary}
          disabled={busy}
          onClick={() => void onExport("xlsx")}
        >
          {t("downloadExcel")}
        </button>
      </div>
      {error ? (
        <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
      ) : null}
    </div>
  );
}
```

- [ ] **Step 3: Mount on portal cards**

In `apps/web/src/app/(client)/portal/page.tsx`:

1. Add import: `import { PortalExportButtons } from "@/components/portal-export-buttons";`
2. Inside each program `<header>`, after the schedule/observations block (still inside `<header>`), add:

```tsx
<div className="pt-2">
  <PortalExportButtons workoutId={program.id} />
</div>
```

- [ ] **Step 4: Typecheck**

```bash
cd apps/web && pnpm lint
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/portal-export-buttons.tsx \
  apps/web/src/app/(client)/portal/page.tsx \
  apps/web/messages/en.json \
  apps/web/messages/pt-BR.json
git commit -m "$(cat <<'EOF'
feat(web): add portal PDF/Excel download buttons

Clients can download ACTIVE programs from /portal with i18n labels.
EOF
)"
```

---

### Task 4: Manual acceptance + deploy

**Files:** none (verification only)

- [ ] **Step 1: Local or production smoke checklist**

As **client** with ≥1 ACTIVE program on `/portal`:

1. Click **Download PDF** → file downloads / opens; content matches program.
2. Click **Download Excel** → `.xlsx` downloads; content matches program.

As **client** (optional if you have a second program id):

3. Hitting `/api/workouts/<other-client-program-id>/export.pdf` → 403 JSON.

As **trainer**:

4. Spreadsheet **Export PDF** / **Export Excel** still work.

Unauthenticated:

5. `curl -s -o /dev/null -w "%{http_code}" https://<host>/api/workouts/<id>/export.pdf` → `401` (or redirect/401 from Clerk depending on cookie absence; Route Handler should return 401 JSON via `toErrorResponse`).

- [ ] **Step 2: Deploy production**

```bash
git push origin HEAD
pnpm dlx vercel deploy --prod --non-interactive
```

Expected: deployment `READY`, aliased to `https://trainflow-chi.vercel.app`.

- [ ] **Step 3: Final commit only if checklist found fixes**

If smoke found bugs, fix in a follow-up commit before considering the plan done. Otherwise no extra commit.

---

## Spec coverage self-review

| Spec requirement | Task |
|------------------|------|
| PDF + Excel downloads on ACTIVE portal cards | Task 3 |
| Reuse existing export routes | Task 2 |
| Trainer path unchanged in behavior | Task 2 (`authorizeWorkoutExport` → `requireTrainerId` + `get`) |
| Client ownership + ACTIVE only | Task 1 (`trainerIdForClientExport`) |
| 401 / 403 / 404 via existing errors | Task 1–2 |
| i18n keys pt-BR + en | Task 3 |
| No detail page / no DRAFT export / no doc translation | Out of scope (not implemented) |
| Acceptance checklist | Task 4 |

## Placeholder scan

No TBD/TODO/“similar to Task N” left.

## Type consistency

- `authorizeWorkoutExport(programId: string): Promise<{ trainerId: string }>` used identically in PDF and XLSX routes.
- `trainerIdForClientExport(program, clientId): string` used inside authorize and unit-tested.
- `PortalExportButtons` takes `workoutId: string` = `program.id`.
