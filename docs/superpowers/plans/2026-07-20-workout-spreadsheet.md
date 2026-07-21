# Workout Spreadsheet MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend TrainFlow Foundation so a trainer can manage full client profiles, build multi-day workout programs via a wizard, edit an autosaving spreadsheet with volume calculations, use templates, and export Excel/PDF.

**Architecture:** Keep Clerk + NestJS + Prisma/Postgres. Expand `Client`; add Exercise / WorkoutProgram / WorkoutDay / WorkoutExercise / template models. Nest owns CRUD + exports; Next.js `(trainer)` UI calls API with Clerk JWT. Pure calc helpers in `packages/workout-math`. Generate = set program `status` to `ACTIVE` (single document, no clone).

**Tech Stack:** pnpm, Turborepo, Next.js 14, NestJS, Prisma, PostgreSQL, Clerk, Zod, React Hook Form, TanStack Table, `@dnd-kit`, ExcelJS, PDFKit, Jest

**Spec:** `docs/superpowers/specs/2026-07-20-workout-spreadsheet-design.md`

## Global Constraints

- Package manager: **pnpm**
- Node.js: **>= 20**
- TypeScript: **strict**
- Auth: **Clerk only** (no Auth.js, no `/login`)
- Roles: `TRAINER` | `CLIENT` in Clerk `publicMetadata.role`
- API errors: `{ code: string, message: string }`
- Data isolation: Nest services always filter by `trainerId` (no Postgres RLS)
- API base: Nest on `http://localhost:3001` (no `/api` prefix)
- Web: `apiFetch` in `apps/web/src/lib/api.ts` for JSON; binary exports via authenticated `fetch` + blob download
- Do not remove Foundation invite webhook flow
- No payments, AI, scheduling, messaging, SQLite
- Calculations: never treat missing weight as 0 volume — return unavailable
- No medical / “safe volume” claims in UI copy

## File Structure (target additions)

```
packages/
  db/prisma/schema.prisma          # expand + new models
  db/prisma/seed.ts                # exercises + templates
  db/prisma/data/exercises.json
  db/prisma/data/templates.json
  workout-math/                    # NEW package
    package.json
    src/index.ts
    src/volume.ts
    src/duration.ts
    src/weekly.ts
    src/format.ts
    src/*.spec.ts
  shared-types/src/
    clients.ts                     # expand schemas
    exercises.ts                   # NEW
    workouts.ts                    # NEW
    templates.ts                   # NEW
    observations.ts                # NEW templates list
apps/api/src/
  clients/                         # expand CRUD
  exercises/                       # NEW module
  workouts/                        # NEW module
  templates/                       # NEW module
  exports/                         # NEW excel + pdf
apps/web/src/
  app/(trainer)/
    layout.tsx                     # sidebar shell
    dashboard/page.tsx
    clients/                       # list, new, [id], [id]/edit, invite
    workouts/new/                  # wizard
    workouts/[workoutId]/page.tsx  # spreadsheet
    templates/page.tsx
    exercises/page.tsx             # optional library page
  components/
    trainer-sidebar.tsx
    clients/...
    workouts/...
  lib/api.ts                       # keep; add apiDownload helper
```

---

### Task 1: Workout math package + unit tests

**Files:**
- Create: `packages/workout-math/package.json`
- Create: `packages/workout-math/tsconfig.json`
- Create: `packages/workout-math/src/volume.ts`
- Create: `packages/workout-math/src/duration.ts`
- Create: `packages/workout-math/src/weekly.ts`
- Create: `packages/workout-math/src/format.ts`
- Create: `packages/workout-math/src/index.ts`
- Create: `packages/workout-math/src/volume.spec.ts`
- Create: `packages/workout-math/src/format.spec.ts`
- Create: `packages/workout-math/src/weekly.spec.ts`
- Modify: `pnpm-workspace.yaml` (already includes `packages/*`)
- Modify: root `package.json` if needed for filter scripts

**Interfaces:**
- Produces:
  - `exerciseVolume(input: { sets: number; repsMin: number; repsMax: number; weight: number | null }): { minReps: number; maxReps: number; minVolume: number | null; maxVolume: number | null }`
  - `formatRepRange(min: number, max: number): string` → `"8–12"` (en-dash)
  - `formatRest(sec: number | null): string` → `"90 sec"` or `"—"`
  - `formatWeight(weight: number | null, unit: "KG" | "LB"): string`
  - `emptyDisplay(value: string | number | null | undefined): string` → value or `"—"`
  - `estimateDayDurationMin(exercises, opts?: { secondsPerRep?: number; transitionSec?: number }): number`
  - `dayTotals(exercises): DayTotals`
  - `weeklySummary(days: { exercises: ExerciseCalcInput[] }[]): WeeklySummary` including `setsByMuscle: Record<string, number>`

- [ ] **Step 1: Scaffold package**

`packages/workout-math/package.json`:
```json
{
  "name": "@trainflow/workout-math",
  "version": "0.0.1",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "test": "jest",
    "lint": "echo ok"
  },
  "devDependencies": {
    "@types/jest": "^29.5.14",
    "jest": "^29.7.0",
    "ts-jest": "^29.2.5",
    "typescript": "^5.7.3"
  }
}
```

- [ ] **Step 2: Write failing volume + format tests**

```ts
// packages/workout-math/src/volume.spec.ts
import { exerciseVolume } from "./volume";

describe("exerciseVolume", () => {
  it("computes min/max volume when weight present", () => {
    expect(
      exerciseVolume({ sets: 3, repsMin: 8, repsMax: 12, weight: 20 }),
    ).toEqual({
      minReps: 24,
      maxReps: 36,
      minVolume: 480,
      maxVolume: 720,
    });
  });

  it("returns null volumes when weight missing", () => {
    const r = exerciseVolume({
      sets: 3,
      repsMin: 8,
      repsMax: 12,
      weight: null,
    });
    expect(r.minVolume).toBeNull();
    expect(r.maxVolume).toBeNull();
  });
});
```

```ts
// packages/workout-math/src/format.spec.ts
import { formatRepRange, formatRest, formatWeight } from "./format";

describe("format", () => {
  it("formats rep range with en-dash", () => {
    expect(formatRepRange(8, 12)).toBe("8–12");
  });
  it("formats rest and weight", () => {
    expect(formatRest(90)).toBe("90 sec");
    expect(formatRest(null)).toBe("—");
    expect(formatWeight(20, "KG")).toBe("20 kg");
    expect(formatWeight(null, "KG")).toBe("—");
  });
});
```

- [ ] **Step 3: Run tests — expect FAIL**

Run: `pnpm --filter @trainflow/workout-math test`  
Expected: FAIL (module not found or functions undefined)

- [ ] **Step 4: Implement math helpers**

Implement formulas from spec:
- `minVolume = sets * repsMin * weight`
- `maxVolume = sets * repsMax * weight`
- Duration: avg reps, `secondsPerRep` default 3, rest between sets, `transitionSec` default 30; return minutes rounded
- Weekly: sum sets by `muscleGroup`; sum volumes only where not null

- [ ] **Step 5: Run tests — expect PASS**

Run: `pnpm --filter @trainflow/workout-math test`  
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add packages/workout-math
git commit -m "feat(workout-math): add volume, format, and weekly calculation helpers"
```

---

### Task 2: Prisma schema migration for clients + workouts

**Files:**
- Modify: `packages/db/prisma/schema.prisma`
- Create: migration via `pnpm --filter @trainflow/db exec prisma migrate dev`
- Modify: `packages/db/src/index.ts` — export new enums/types
- Modify: `packages/db/package.json` — add `seed` config if missing

**Interfaces:**
- Produces Prisma models/enums: `ExperienceLevel`, `ProgramStatus`, `WeightUnit`, expanded `Client`, `Exercise`, `WorkoutProgram`, `WorkoutDay`, `WorkoutExercise`, `WorkoutTemplate`, `TemplateDay`, `TemplateExercise`
- Trainer gains relations: `exercises`, `programs`, `templates`

- [ ] **Step 1: Update schema**

Add to `schema.prisma` (keep existing Trainer/InviteToken/ClientStatus):

```prisma
enum ExperienceLevel {
  BEGINNER
  INTERMEDIATE
  ADVANCED
}

enum ProgramStatus {
  DRAFT
  ACTIVE
  ARCHIVED
}

enum WeightUnit {
  KG
  LB
}

model Client {
  id                  String           @id @default(uuid())
  trainerId           String
  trainer             Trainer          @relation(fields: [trainerId], references: [id])
  clerkUserId         String?          @unique
  name                String
  email               String
  status              ClientStatus     @default(PENDING)
  phone               String?
  birthDate           DateTime?
  heightCm            Float?
  weightKg            Float?
  goal                String?
  experienceLevel     ExperienceLevel?
  weeklyAvailability  String?
  injuries            String?
  restrictions        String?
  equipment           String?
  observations        String?
  createdAt           DateTime         @default(now())
  updatedAt           DateTime         @updatedAt
  inviteToken         InviteToken?
  workoutPrograms     WorkoutProgram[]

  @@index([trainerId])
}

model Exercise {
  id                  String   @id @default(uuid())
  trainerId           String?
  trainer             Trainer? @relation(fields: [trainerId], references: [id])
  name                String
  primaryMuscle       String
  secondaryMuscles    String[] @default([])
  category            String
  equipment           String
  defaultInstructions String   @default("")
  videoUrl            String?
  alternativeIds      String[] @default([])
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  @@index([trainerId])
  @@index([primaryMuscle])
}

model WorkoutProgram {
  id          String        @id @default(uuid())
  trainerId   String
  trainer     Trainer       @relation(fields: [trainerId], references: [id])
  clientId    String
  client      Client        @relation(fields: [clientId], references: [id], onDelete: Cascade)
  name        String
  goal        String?
  startDate   DateTime
  endDate     DateTime?
  daysPerWeek Int
  level       ExperienceLevel?
  location    String?
  equipment   String?
  observations String?
  status      ProgramStatus @default(DRAFT)
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt
  days        WorkoutDay[]

  @@index([trainerId])
  @@index([clientId])
}

model WorkoutDay {
  id                    String            @id @default(uuid())
  programId             String
  program               WorkoutProgram    @relation(fields: [programId], references: [id], onDelete: Cascade)
  name                  String
  focus                 String?
  estimatedDurationMin  Int?
  warmup                String?
  cooldown              String?
  observations          String?
  sortOrder             Int               @default(0)
  exercises             WorkoutExercise[]

  @@index([programId])
}

model WorkoutExercise {
  id              String     @id @default(uuid())
  dayId           String
  day             WorkoutDay @relation(fields: [dayId], references: [id], onDelete: Cascade)
  exerciseId      String?
  customName      String?
  muscleGroup     String
  category        String
  sets            Int
  repsMin         Int
  repsMax         Int
  weight          Float?
  weightUnit      WeightUnit @default(KG)
  restSec         Int?
  tempo           String?
  rpe             Float?
  rir             Float?
  method          String     @default("Standard sets")
  sortOrder       Int        @default(0)
  observation     String?
  videoUrl        String?
  alternativeText String?

  @@index([dayId])
}

model WorkoutTemplate {
  id           String        @id @default(uuid())
  trainerId    String?
  trainer      Trainer?      @relation(fields: [trainerId], references: [id])
  name         String
  goal         String?
  daysPerWeek  Int?
  level        ExperienceLevel?
  observations String?
  isSample     Boolean       @default(false)
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt
  days         TemplateDay[]

  @@index([trainerId])
}

model TemplateDay {
  id           String             @id @default(uuid())
  templateId   String
  template     WorkoutTemplate    @relation(fields: [templateId], references: [id], onDelete: Cascade)
  name         String
  focus        String?
  warmup       String?
  cooldown     String?
  observations String?
  sortOrder    Int                @default(0)
  exercises    TemplateExercise[]

  @@index([templateId])
}

model TemplateExercise {
  id              String      @id @default(uuid())
  dayId           String
  day             TemplateDay @relation(fields: [dayId], references: [id], onDelete: Cascade)
  exerciseId      String?
  customName      String?
  muscleGroup     String
  category        String
  sets            Int
  repsMin         Int
  repsMax         Int
  weight          Float?
  weightUnit      WeightUnit  @default(KG)
  restSec         Int?
  tempo           String?
  rpe             Float?
  rir             Float?
  method          String      @default("Standard sets")
  sortOrder       Int         @default(0)
  observation     String?
  videoUrl        String?
  alternativeText String?

  @@index([dayId])
}
```

Update `Trainer` relations: `exercises Exercise[]`, `programs WorkoutProgram[]`, `templates WorkoutTemplate[]`.

- [ ] **Step 2: Migrate**

Run:
```bash
cd packages/db && pnpm exec prisma migrate dev --name workout_spreadsheet_mvp
pnpm exec prisma generate
```
Expected: migration applied, client generated

- [ ] **Step 3: Export types from `packages/db/src/index.ts`**

Export new enums and model types used by API.

- [ ] **Step 4: Commit**

```bash
git add packages/db
git commit -m "feat(db): expand Client and add workout spreadsheet models"
```

---

### Task 3: Shared Zod DTOs (clients, exercises, workouts, templates)

**Files:**
- Modify: `packages/shared-types/src/clients.ts`
- Create: `packages/shared-types/src/exercises.ts`
- Create: `packages/shared-types/src/workouts.ts`
- Create: `packages/shared-types/src/templates.ts`
- Create: `packages/shared-types/src/observations.ts`
- Modify: `packages/shared-types/src/index.ts`
- Modify: `packages/shared-types/package.json` — depend on nothing from workout-math (DTOs only)

**Interfaces:**
- Produces Zod schemas + inferred types:
  - `createClientSchema`, `updateClientSchema`, `clientDtoSchema` (full profile)
  - `createExerciseSchema`, `exerciseDtoSchema`
  - `createWorkoutSchema`, `updateWorkoutSchema`, `workoutDaySchema`, `workoutExerciseSchema`, `reorderSchema`
  - `executionMethodEnum` values matching UI list
  - `OBSERVATION_TEMPLATES: string[]`
  - `createTemplateFromWorkoutSchema`, `createWorkoutFromTemplateSchema`

- [ ] **Step 1: Expand client schemas** with all profile fields; keep `inviteClientSchema` as `{ name, email }`

- [ ] **Step 2: Add workout schemas** with validation rules from spec (sets > 0, repsMin ≤ repsMax, weight ≥ 0, rpe 1–10, endDate ≥ startDate)

- [ ] **Step 3: Export from index**

- [ ] **Step 4: Commit**

```bash
git add packages/shared-types
git commit -m "feat(shared-types): add client profile and workout Zod DTOs"
```

---

### Task 4: Clients API CRUD expand + ownership tests

**Files:**
- Modify: `apps/api/src/clients/clients.service.ts`
- Modify: `apps/api/src/clients/clients.controller.ts`
- Modify: `apps/api/src/clients/clients.service.spec.ts`
- Optionally extract `trainerIdFor` to `apps/api/src/common/trainer-context.service.ts` for reuse

**Interfaces:**
- Consumes: `createClientSchema`, `updateClientSchema` from shared-types; existing `TrainersService`
- Produces:
  - `create(trainerId, data)`, `update(trainerId, id, data)`, `remove(trainerId, id)` (cascade programs via Prisma)
  - `list(trainerId, q?: string)`, `get(trainerId, id)`
  - Controller: `POST /clients`, `PATCH /clients/:id`, `DELETE /clients/:id`, `GET /clients?q=`

- [ ] **Step 1: Write failing service tests** for create/update/list search/forbidden cross-tenant get

- [ ] **Step 2: Implement service + controller** (parse with Zod; BadRequestException on fail)

- [ ] **Step 3: Run** `pnpm --filter @trainflow/api test` — clients specs PASS

- [ ] **Step 4: Commit**

```bash
git commit -m "feat(api): full client profile CRUD with trainer ownership"
```

---

### Task 5: Trainer shell + dashboard + client UI CRUD

**Files:**
- Modify: `apps/web/src/app/(trainer)/layout.tsx` — sidebar + nav links
- Create: `apps/web/src/components/trainer-sidebar.tsx`
- Create: `apps/web/src/app/(trainer)/dashboard/page.tsx`
- Modify: `apps/web/src/app/(trainer)/clients/page.tsx` — search, edit/delete links
- Create: `apps/web/src/app/(trainer)/clients/new/page.tsx`
- Create: `apps/web/src/app/(trainer)/clients/[clientId]/page.tsx`
- Create: `apps/web/src/app/(trainer)/clients/[clientId]/edit/page.tsx`
- Modify: `apps/web/src/app/post-auth/page.tsx` — redirect TRAINER → `/dashboard`
- Modify: `apps/web/src/middleware.ts` — ensure new routes protected (default protect is fine)
- Create: `apps/web/src/lib/api-download.ts` later in exports task; skip now

**Interfaces:**
- Consumes: `apiFetch` + client DTO types
- Dashboard queries: `GET /clients`, `GET /workouts` (workouts endpoint may stub empty until Task 7 — if missing, show clients only and “0 programs” until Task 7 lands; prefer implement Task 7 list endpoint first or soft-fail)

**Order note:** If `GET /workouts` not ready, dashboard shows client count only and empty recent programs.

- [ ] **Step 1: Sidebar layout** with links: Dashboard, Clients, Workouts (new), Templates, Exercises

- [ ] **Step 2: Client new/edit/profile forms** with RHF + Zod (`createClientSchema` / `updateClientSchema`)

- [ ] **Step 3: Clients list** with search query param to API

- [ ] **Step 4: Post-auth → `/dashboard`**

- [ ] **Step 5: Manual smoke** — create client with phone/goal, edit, view profile

- [ ] **Step 6: Commit**

```bash
git commit -m "feat(web): trainer shell, dashboard, and full client CRUD UI"
```

---

### Task 6: Exercise seed (≥40) + Exercises API

**Files:**
- Create: `packages/db/prisma/data/exercises.json` (≥40 entries)
- Create: `packages/db/prisma/seed.ts`
- Modify: `packages/db/package.json`:
```json
"prisma": { "seed": "tsx prisma/seed.ts" }
```
- Add deps: `tsx` in db package
- Create: `apps/api/src/exercises/*` module (controller, service, module, spec)
- Modify: `apps/api/src/app.module.ts`

**Interfaces:**
- `GET /exercises?q=&muscle=&category=`
- `POST /exercises` (sets `trainerId`)
- `PATCH /exercises/:id`, `DELETE /exercises/:id` (custom only)
- Seed inserts global exercises (`trainerId: null`)

- [ ] **Step 1: Author exercises.json** covering all muscle groups in spec

- [ ] **Step 2: Seed script** upserts by name+primaryMuscle

- [ ] **Step 3: Run** `pnpm --filter @trainflow/db exec prisma db seed`

- [ ] **Step 4: Exercises Nest module + tests**

- [ ] **Step 5: Commit**

```bash
git commit -m "feat: seed exercise library and add Exercises API"
```

---

### Task 7: Workouts Nest API (programs, days, exercises, duplicate, generate)

**Files:**
- Create: `apps/api/src/workouts/workouts.module.ts`
- Create: `apps/api/src/workouts/workouts.controller.ts`
- Create: `apps/api/src/workouts/workouts.service.ts`
- Create: `apps/api/src/workouts/workouts.service.spec.ts`
- Modify: `apps/api/src/app.module.ts`
- Optional: attach `summary` from `@trainflow/workout-math` on `GET :id`

**Interfaces:**
- `POST /workouts` → DRAFT
- `GET /workouts?clientId=`
- `GET /workouts/:id` → nested days.exercises + `summary`
- `PATCH /workouts/:id` → fields + `status` (`ACTIVE` = generate)
- `DELETE /workouts/:id`
- `POST /workouts/:id/days`, `PATCH /workouts/:id/days/:dayId`, `DELETE ...`
- `PUT /workouts/:id/days/reorder` body `{ orderedIds: string[] }`
- `POST /workouts/:id/days/:dayId/exercises`, `PATCH .../exercises/:exId`, `DELETE ...`
- `PUT /workouts/:id/days/:dayId/exercises/reorder`
- `POST /workouts/:id/days/:dayId/exercises/:exId/move` body `{ targetDayId: string; sortOrder: number }`
- `POST /workouts/:id/duplicate`
- `POST /workouts/:id/days/:dayId/duplicate`

All methods take `trainerId` and verify program ownership before nested ops.

- [ ] **Step 1: Failing ownership + create nested tests**

- [ ] **Step 2: Implement service/controller**

- [ ] **Step 3: Add `@trainflow/workout-math` dependency to `apps/api`**

- [ ] **Step 4: Tests PASS**

- [ ] **Step 5: Commit**

```bash
git commit -m "feat(api): workout programs, days, exercises, duplicate, and generate status"
```

---

### Task 8: Workout creation wizard UI

**Files:**
- Create: `apps/web/src/app/(trainer)/workouts/new/page.tsx`
- Create: `apps/web/src/components/workouts/wizard/*` (steps 1–5, progress indicator)
- Create: exercise picker modal with search against `GET /exercises`
- Add deps to `apps/web`: `react-hook-form`, `@hookform/resolvers`, `zod` (if not present), `@dnd-kit/core`, `@dnd-kit/sortable`

**Interfaces:**
- Step 2 `POST /workouts` then subsequent PATCHes
- Step 3/4 nested day/exercise endpoints
- Step 5: `PATCH /workouts/:id` `{ status: "ACTIVE" }` then `router.push(/workouts/${id})`

- [ ] **Step 1: Multi-step shell with progress**

- [ ] **Step 2: Client select/create**

- [ ] **Step 3: Program fields**

- [ ] **Step 4: Days editor**

- [ ] **Step 5: Exercises per day** — add/remove/duplicate/reorder (dnd), move between days, library search, custom exercise (`POST /exercises` then attach)

- [ ] **Step 6: Review + Generate button**

- [ ] **Step 7: Smoke path** create A/B/C program → land on spreadsheet route (Task 9 may stub page)

- [ ] **Step 8: Commit**

```bash
git commit -m "feat(web): multi-step workout creation wizard"
```

---

### Task 9: Spreadsheet editor + autosave + calculations UI

**Files:**
- Create: `apps/web/src/app/(trainer)/workouts/[workoutId]/page.tsx`
- Create: `apps/web/src/components/workouts/spreadsheet/*` (header, day section, editable table, summary cards, autosave hook)
- Create: `apps/web/src/hooks/use-autosave.ts`
- Add: `@tanstack/react-table` if using TanStack Table
- Modify: `apps/web/package.json` deps
- Depend web on `@trainflow/workout-math` for client-side summary cards (or use `summary` from API)

**Interfaces:**
- `useAutosave({ save: (payload) => apiFetch(...), delayMs: 600 })` → `{ status: "idle"|"saving"|"saved"|"error" }`
- Inline PATCH exercise/day/program fields
- Observation template insert from `OBSERVATION_TEMPLATES`
- Actions: add/remove exercise, reorder, duplicate day, duplicate program, print (`window.print` + print CSS)

- [ ] **Step 1: Load program; render formatted tables**

- [ ] **Step 2: Inline edit + autosave hook**

- [ ] **Step 3: Summary cards** — day totals, weekly, sets by muscle (from workout-math)

- [ ] **Step 4: Observation levels** visible and editable

- [ ] **Step 5: Mobile** horizontal scroll on tables

- [ ] **Step 6: Commit**

```bash
git commit -m "feat(web): editable workout spreadsheet with autosave and calculations"
```

---

### Task 10: Templates API + seed samples + Templates UI

**Files:**
- Create: `packages/db/prisma/data/templates.json` (5 samples)
- Extend: `packages/db/prisma/seed.ts` to seed templates (`isSample: true`, `trainerId: null`)
- Create: `apps/api/src/templates/*`
- Create: `apps/web/src/app/(trainer)/templates/page.tsx`

**Interfaces:**
- `GET /templates?q=&goal=&daysPerWeek=`
- `GET /templates/:id`
- `POST /templates/from-workout/:workoutId`
- `POST /workouts/from-template/:templateId` body `{ clientId: string, name?: string }` → new DRAFT copy

- [ ] **Step 1: Seed 5 sample templates** named per spec

- [ ] **Step 2: Templates module** with copy-from-workout and create-program-from-template

- [ ] **Step 3: UI** search/filter + “Use template” → pick client → redirect wizard or `/workouts/[newId]`

- [ ] **Step 4: Commit**

```bash
git commit -m "feat: workout templates seed, API, and trainer UI"
```

---

### Task 11: Excel + PDF export (Nest)

**Files:**
- Create: `apps/api/src/exports/exports.module.ts`
- Create: `apps/api/src/exports/exports.controller.ts`
- Create: `apps/api/src/exports/excel.service.ts`
- Create: `apps/api/src/exports/pdf.service.ts`
- Create: `apps/api/src/exports/excel.service.spec.ts` (smoke: buffer length > 0, sheet names)
- Modify: `apps/api/package.json` — add `exceljs`, `pdfkit`, `@types/pdfkit`
- Create: `apps/web/src/lib/api-download.ts`
- Wire download buttons on spreadsheet page

**Interfaces:**
- `GET /workouts/:id/export.xlsx` → `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- `GET /workouts/:id/export.pdf` → `application/pdf`
- Ownership same as get workout
- Excel: Summary sheet + one sheet per day; freeze header; wrap observations
- PDF: title, trainer/client/program, days, tables, summaries, generation date

```ts
// apps/web/src/lib/api-download.ts
"use server";
// OR client-side: getToken from useAuth and fetch blob
export async function downloadWorkoutExport(
  workoutId: string,
  format: "xlsx" | "pdf",
): Promise<void> {
  // fetch with Bearer, blob, trigger <a download>
}
```

Prefer **client component** with `useAuth().getToken()` for blob download (server actions returning binary are awkward).

- [ ] **Step 1: Excel service** using ExcelJS + workout-math summaries

- [ ] **Step 2: PDF service** using PDFKit

- [ ] **Step 3: Controller routes + ownership test**

- [ ] **Step 4: Spreadsheet UI Export Excel / Export PDF buttons**

- [ ] **Step 5: Commit**

```bash
git commit -m "feat(api): Excel and PDF workout exports with web download buttons"
```

---

### Task 12: Exercises page (optional polish) + observation templates UX

**Files:**
- Create: `apps/web/src/app/(trainer)/exercises/page.tsx` — list/search + create custom
- Ensure wizard + spreadsheet observation fields have “Insert template” dropdown from `OBSERVATION_TEMPLATES`

- [ ] **Step 1: Exercises page**

- [ ] **Step 2: Observation template insert control** reusable component

- [ ] **Step 3: Commit**

```bash
git commit -m "feat(web): exercise library page and observation templates"
```

---

### Task 13: Hardening — docs, env example, CI, final verification

**Files:**
- Modify: `README.md` — install, migrate, seed, dev, test, export notes
- Modify: `.env.example` — document existing vars only (no fake secrets)
- Ensure `apps/api` and `packages/workout-math` tests in turbo `test` pipeline
- Fix lint/typecheck across packages

- [ ] **Step 1: README section “Workout Spreadsheet MVP”**

- [ ] **Step 2: Run** `pnpm lint` / `pnpm --filter @trainflow/api test` / `pnpm --filter @trainflow/workout-math test` / `pnpm --filter @trainflow/web build` (or `tsc`)

- [ ] **Step 3: Manual DoD checklist**

1. Log in (Clerk)  
2. Register client (full profile)  
3. Create multi-day workout via wizard  
4. Generate spreadsheet  
5. Edit + autosave  
6. See volume / weekly / muscle sets  
7. Export Excel  
8. Export PDF  
9. Reopen workout URL later  

- [ ] **Step 4: Commit**

```bash
git commit -m "docs: workout MVP setup, seed, and verification notes"
```

---

## Spec coverage checklist

| Spec area | Task(s) |
|-----------|---------|
| Workout math | 1 |
| Prisma models | 2 |
| Zod DTOs | 3 |
| Client CRUD API/UI | 4, 5 |
| Dashboard / shell | 5 |
| Exercise library seed + API | 6, 12 |
| Workouts API | 7 |
| Wizard | 8 |
| Spreadsheet + autosave + calcs UI | 9 |
| Observations templates | 3, 9, 12 |
| Templates | 10 |
| Excel/PDF | 11 |
| Security/ownership | 4, 6, 7, 10, 11 |
| Docs / DoD | 13 |
| Keep Clerk (no Auth.js) | Global + all tasks |
| Single-document generate | 7, 8 |

## Placeholder scan

No TBD steps. Open defaults from spec baked in (cascade delete client, `@dnd-kit`, PDFKit, `packages/workout-math`).

---

## Execution handoff

Plan complete and saved to `docs/superpowers/plans/2026-07-20-workout-spreadsheet.md`.

**Two execution options:**

1. **Subagent-Driven (recommended)** — fresh subagent per task, review between tasks  
2. **Inline Execution** — execute tasks in this session with checkpoints  

Which approach?
