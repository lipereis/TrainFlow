# TrainFlow — Workout Spreadsheet MVP Design

## Context

Foundation is live: Turborepo, Next.js 14 + Clerk, NestJS API, Prisma/Postgres, roles `TRAINER` | `CLIENT`, invite-minimal `Client`. Login works. No workout code exists yet.

This document covers the **Workout Spreadsheet MVP**: trainer registers rich clients, builds workout programs via a wizard, edits a generated spreadsheet with autosave and automatic volume calculations, uses templates, and exports PDF/Excel.

Planned product order (Foundation design) listed Client Management before Workout Builder. This MVP **merges** full client profile CRUD with the workout spreadsheet workflow so Definition of Done is reachable in one cycle.

## Goals

- Trainer logs in (existing Clerk), manages full client profiles, creates multi-day workout programs with exercises and observations at four levels.
- System formats the program as an editable spreadsheet; trainer autosaves, reopens, and updates later.
- Automatic per-exercise / per-day / per-week calculations and sets-per-muscle-group summaries (no medical claims).
- Exercise library (≥40 seeded) + custom exercises; reusable workout templates (including 5 sample templates).
- Export professional Excel and PDF from NestJS with ownership checks.
- Preserve Foundation patterns: Nest owns domain + Prisma; web calls API with Clerk JWT; Zod in `@trainflow/shared-types`.

## Non-Goals

- Auth.js, `/login` password forms, SQLite fallback (Postgres + Clerk stay).
- Next.js Server Actions as business layer (thin JWT-forward helpers only, as today).
- Payments, messaging, AI, scheduling, progress charts (Recharts deferred).
- Native mobile app; multi-trainer orgs; Postgres RLS.
- Immutable generated “snapshot” history (single program document; versions later if needed).
- Client portal workout viewing (trainer-only for this MVP; portal stays placeholder).

## Decisions (approved)

| Topic | Choice |
|-------|--------|
| Stack adaptation | **A** — build on Foundation (Clerk + Nest + Postgres) |
| Client profile | **A** — expand Prisma `Client` + full CRUD/profile UI now |
| PDF/Excel | **A** — NestJS export endpoints |
| Program data model | **1** — single document; Generate = validate + `ACTIVE` + open editor (no clone) |

## Architecture

```
apps/web  →  Clerk JWT  →  apps/api (Nest)  →  packages/db (Prisma)  →  Postgres
                ↑                    ↑
         pages / wizard      modules + ExcelJS/PDF
         spreadsheet UI      ownership via trainerId
                ↑
         packages/shared-types (Zod DTOs)
         packages/workout-math (pure calc helpers)  OR  shared-types/math
```

- **Web:** App Router under `(trainer)/`, sidebar shell, RHF + Zod forms, TanStack Table (or structured editable table), debounced PATCH autosave.
- **API:** Expand `ClientsModule`; add `ExercisesModule`, `WorkoutsModule`, `TemplatesModule`, export handlers (ExcelJS + PDF library).
- **DB:** Migrate `packages/db` schema; seed exercises + sample templates + observation templates.
- **Calcs:** Pure functions unit-tested; used by API responses (optional summary payload) and/or computed on web from program DTO; exports use same helpers on API.

## Data Model

Keep `Trainer`, `InviteToken`, `ClientStatus`.

### Client (expanded)

Existing: `id`, `trainerId`, `clerkUserId?`, `name`, `email`, `status`, `createdAt`, invite relation.

Add:

- `phone` String?
- `birthDate` DateTime?
- `heightCm` Float?
- `weightKg` Float?
- `goal` String?
- `experienceLevel` String? (or enum: BEGINNER | INTERMEDIATE | ADVANCED)
- `weeklyAvailability` String?
- `injuries` String? (multiline)
- `restrictions` String? (multiline)
- `equipment` String? (multiline)
- `observations` String? (multiline)
- `updatedAt` DateTime @updatedAt
- Relations: `workoutPrograms WorkoutProgram[]`

Invite flow still creates PENDING clients with name/email; profile create/edit can set richer fields and optionally `ACTIVE` without invite (offline registration).

### Exercise

- Global library rows: `trainerId` null
- Custom: `trainerId` set
- Fields: `id`, `name`, `primaryMuscle`, `secondaryMuscles` (String[] or JSON), `category`, `equipment`, `defaultInstructions`, `videoUrl?`, `createdAt`, `updatedAt`
- Alternatives: `alternativeExerciseIds` String[] or explicit join table — prefer String[] of UUIDs for MVP simplicity

### WorkoutProgram

- `id`, `trainerId`, `clientId`
- `name`, `goal`, `startDate`, `endDate?`, `daysPerWeek`, `level`, `location?`, `equipment?`, `observations?`
- `status` enum: `DRAFT` | `ACTIVE` | `ARCHIVED`
- `createdAt`, `updatedAt`
- `days WorkoutDay[]`
- Indexes: `[trainerId]`, `[clientId]`

### WorkoutDay

- `id`, `programId`, `name`, `focus?`, `estimatedDurationMin?`, `warmup?`, `cooldown?`, `observations?`, `sortOrder`
- `exercises WorkoutExercise[]`
- onDelete Cascade from program

### WorkoutExercise

- `id`, `dayId`
- `exerciseId` String? (library ref)
- `customName` String? (required if no exerciseId)
- Snapshot/display: `muscleGroup`, `category` (copied or denormalized for export stability)
- `sets` Int, `repsMin` Int, `repsMax` Int
- `weight` Float?, `weightUnit` enum KG | LB (default KG)
- `restSec` Int?, `tempo` String?, `rpe` Float?, `rir` Float?
- `method` String (enum-like: Standard, Superset, Bi-set, … Custom)
- `sortOrder` Int
- `observation` String?, `videoUrl` String?, `alternativeText` String?
- onDelete Cascade from day

### Templates

- `WorkoutTemplate`: `trainerId?` null for samples (`isSample` true), else trainer-owned; `name`, `goal?`, `daysPerWeek?`, `level?`, `observations?`, timestamps
- `TemplateDay` / `TemplateExercise`: mirror day/exercise fields without client binding
- Creating a program from a template **copies** rows into a new `WorkoutProgram` (DRAFT); editing the program never mutates the template

### Spec vs prompt naming

Prompt suggested `User` / `TrainerProfile`. Foundation already has Clerk + `Trainer`. **Do not** introduce Auth.js `User`. Map:

| Prompt | TrainFlow |
|--------|-----------|
| User / TrainerProfile | `Trainer` (Clerk-backed) |
| Client | `Client` (expanded) |
| WorkoutProgram / Day / Exercise | as above |
| Exercise library | `Exercise` |
| Templates | `WorkoutTemplate` + children |

## Routes (web)

Keep Clerk `/sign-in`, `/sign-up`, `/post-auth`. Prefer post-auth redirect to `/dashboard` for trainers.

| Route | Purpose |
|-------|---------|
| `/dashboard` | Totals, recent programs, CTAs, client snippet |
| `/clients` | Search, list, delete; links to profile / edit |
| `/clients/new` | Full create form |
| `/clients/[clientId]` | Profile, observations, programs, new workout |
| `/clients/[clientId]/edit` | Edit profile |
| `/clients/invite` | Keep existing invite flow |
| `/workouts/new` | 5-step wizard |
| `/workouts/[workoutId]` | Spreadsheet editor + calcs + export |
| `/templates` | Search/filter; use template → new draft program |
| `/exercises` | Optional library browse + create custom (wizard may use modal instead; page nice-to-have) |

Trainer layout: responsive sidebar + top nav; upgrade from minimal header.

### Wizard steps

1. Select or create client  
2. Program info  
3. Workout days (A/B/C…)  
4. Exercises per day (library search, custom, reorder, duplicate, move day) — drag-and-drop via `@dnd-kit` or similar  
5. Review → **Generate Workout Spreadsheet** → `PATCH status=ACTIVE` → `/workouts/[id]`

Draft may be persisted as user progresses (recommended: create program on step 2, patch thereafter).

### Spreadsheet editor

- Header: client, program, goal, dates, frequency, trainer name, program observations  
- Section per day: title, focus, warmup, table, day observations, cooldown, day totals  
- Columns: Order, Exercise, Muscle, Sets, Rep range, Weight, Rest, Tempo, RPE, RIR, Method, Observation, Alternative, Video  
- Formatting: `8–12`, `90 sec`, `20 kg`, empty → `—`  
- Inline edit, add/remove/reorder exercises, duplicate day, duplicate program, print CSS, PDF/Excel download  
- Autosave: debounce 500–800ms; UI states Saving / Saved / Error; avoid stale overwrites (updatedAt or revision if needed)

Mobile: horizontal scroll on tables and/or card layout per exercise.

## API (NestJS)

All trainer routes: `AuthGuard` + `@Roles('TRAINER')` + `trainerId` ownership.

### Clients (expand)

- `POST /clients` — create with full profile (status default ACTIVE or PENDING)  
- `GET /clients?q=` — list/search  
- `GET /clients/:id`  
- `PATCH /clients/:id`  
- `DELETE /clients/:id` (cascade policy: block if programs exist **or** cascade delete programs — prefer cascade with confirmation on UI)  
- Keep `POST /clients/invite`, `POST /clients/:id/resend-invite`

### Exercises

- `GET /exercises?q=&muscle=&category=` — global + trainer custom  
- `POST /exercises` — custom for current trainer  
- `PATCH /exercises/:id` / `DELETE` — only own custom rows  

### Workouts

- `POST /workouts` — create DRAFT (clientId + program fields; optional nested days)  
- `GET /workouts?clientId=`  
- `GET /workouts/:id` — full nested payload + optional `summary` calcs  
- `PATCH /workouts/:id` — program fields / status (generate)  
- `DELETE /workouts/:id`  
- Days: `POST/PATCH/DELETE /workouts/:id/days`, `PUT .../days/reorder`  
- Exercises: `POST/PATCH/DELETE /workouts/:id/days/:dayId/exercises`, reorder, `POST .../move`  
- `POST /workouts/:id/duplicate`  
- `POST /workouts/:id/days/:dayId/duplicate`  

### Templates

- `GET /templates?q=&goal=&daysPerWeek=`  
- `POST /templates/from-workout/:workoutId`  
- `POST /workouts/from-template/:templateId` — body may include `clientId`  
- `GET /templates/:id`  

### Exports

- `GET /workouts/:id/export.xlsx`  
- `GET /workouts/:id/export.pdf`  

Excel: Sheet 1 Program Summary (client, program, weekly totals, sets/muscle); one sheet per day (table + day meta + totals). Professional formatting (bold headers, widths, wrap, freeze, borders).

PDF: TrainFlow title, trainer/client/program, observations, day sections (page breaks preferred per day), tables, summaries, generation date. Avoid splitting rows awkwardly where library allows.

## Calculations

Shared pure helpers (unit-tested):

**Per exercise**

- Planned reps band: min/max totals = `sets * repsMin` / `sets * repsMax`  
- `minVolume = sets * repsMin * weight`  
- `maxVolume = sets * repsMax * weight`  
- If weight missing → volume unavailable (not zero)

**Per day**

- Exercise count, total sets, min/max reps, min/max volume (sum where available), estimated duration  

**Duration estimate**

- Avg reps = `(repsMin + repsMax) / 2`  
- Work time ≈ `sets * avgReps * secondsPerRep` (config constant, e.g. 3)  
- Rest ≈ `(sets - 1) * restSec` per exercise  
- Transition ≈ `(exerciseCount - 1) * transitionSec` (e.g. 30)  
- Label clearly as estimate  

**Per week / program**

- Sessions = days count (or `daysPerWeek` field — use days count for volume rollup; show both if they differ)  
- Weekly sets, min/max volume, estimated weekly time  
- Sets per primary muscle group (sum sets grouped by `muscleGroup`)  

No auto “safe/ideal volume” language.

## Observations

Four levels: Client · Program · Day · Exercise. Multiline, editable, in exports, separated in UI.

Predefined templates (static list in shared-types or seed table): insert into field then edit. Examples from product brief (controlled execution, stop if pain, load progression, eccentric focus, etc.).

## Exercise library & templates (seed)

- ≥40 exercises across Chest, Back, Shoulders, Biceps, Triceps, Quadriceps, Hamstrings, Glutes, Calves, Core, Full body, Cardio  
- Sample templates (`isSample: true`): Beginner Full Body 3d, Upper/Lower 4d, Push Pull Legs 3d, Strength Foundation 3d, Hypertrophy A/B/C 3d — labeled as examples, not prescriptions  
- `pnpm` seed script in `packages/db`

## Validation (Zod)

- Sets > 0; repsMin ≤ repsMax; weight ≥ 0; rest ≥ 0; RPE 1–10; RIR ≥ 0  
- endDate ≥ startDate; day name required; exercise name/customName required  
- Field-level errors in forms  

## Security

- Clerk JWT on API; role TRAINER for these routes  
- Every read/write filtered by `trainerId`  
- No secrets in client bundles  
- Export endpoints same ownership as `GET /workouts/:id`  

## Testing

- Unit: volume, weekly totals, rep formatting, duration estimate  
- API/integration: workout create nested, ownership 403/404, export returns file  
- Form validation schemas  
- Web e2e optional later; prioritize calc + ownership + export  

## Implementation phases

1. Schema migration + Client expand API/UI + dashboard shell  
2. Exercise seed + Exercises API + library picker  
3. Workouts CRUD + wizard (draft → generate)  
4. Spreadsheet editor + autosave + calculations + observations UX  
5. Templates + Excel + PDF exports  
6. Hardening: validation polish, security pass, tests, responsive, README / `.env.example` updates  

Definition of Done matches product brief (login → client → multi-day program → spreadsheet edit/save → calcs → Excel + PDF), on Foundation stack.

## Open points (resolved defaults)

| Point | Default |
|-------|---------|
| Delete client with programs | Cascade delete programs after UI confirm |
| Drag-and-drop | `@dnd-kit` |
| PDF library | `pdfkit` or `@react-pdf/renderer` on Nest — prefer `pdfkit` for server simplicity |
| Math package | `packages/workout-math` if shared-types grows too large; else `shared-types/src/workout-math.ts` |
| `/exercises` page | Include in phase 2 if time; wizard modal is required |

## Spec self-review

- No Auth.js/SQLite contradictions left unresolved — explicitly out of scope.  
- Aligns with Foundation Trainer/Client, not User/TrainerProfile.  
- Generate does not duplicate rows (approach 1).  
- Scope is large but one coherent MVP; phases keep shippable increments.  
- Placeholders avoided; open points have defaults.
