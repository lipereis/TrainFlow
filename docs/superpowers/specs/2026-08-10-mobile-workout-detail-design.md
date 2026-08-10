# Mobile workout detail — design spec

Date: 2026-08-10
Slice: Phase 1, slice 4 (workout viewing)

## Context

`apps/mobile` (Expo) has read-only slices for dashboard, clients, and exercise library. Workouts (workout programs) are the last major domain still missing a mobile screen. The web app (`apps/web`) has a full workout builder (wizard/spreadsheet, CRUD, days, exercises, reorder, duplicate, PDF/XLSX export) backed by `apps/web/src/server/workouts.service.ts` and `/api/workouts*` routes.

Mobile currently has only `useWorkouts()` (`apps/mobile/src/lib/queries/workouts.ts`), returning a hand-rolled `WorkoutSummary` type (`id`, `name`, `status`) that does not match the real list API response. No detail screen exists. The dashboard's "Recent programs" row is not tappable. The client detail screen has no per-client program list.

## Scope

Read-only viewing only: list a client's workout programs and view full program detail (days, exercises, computed totals). No create/edit/delete/duplicate/export on mobile — those remain web-only. This matches the read-only pattern established by the dashboard, clients, and exercise-library slices.

No standalone `/workouts` index screen. Two existing entry points cover navigation: the dashboard's global "Recent programs" list, and a new per-client program list on the client detail screen. A third, undifferentiated global list screen would be redundant.

## Shared types

`packages/shared-types/src/workouts.ts` currently only exports input schemas (`createWorkoutSchema`, `updateWorkoutSchema`, `workoutDaySchema`, `workoutExerciseSchema`, etc.). Add response DTO schemas mirroring the existing `clientDtoSchema` pattern in `clients.ts`, matching the shapes produced by `WorkoutsService.toProgramListDto` / `toProgramDto` / `toDayDto` / `toExerciseDto`:

- `workoutExerciseDtoSchema` — all exercise fields as stored/returned (id, dayId, exerciseId, customName, muscleGroup, category, sets, repsMin, repsMax, weight, weightUnit, restSec, tempo, rpe, rir, method, sortOrder, observation, videoUrl, alternativeText).
- `workoutDayDtoSchema` — day fields (id, programId, name, focus, estimatedDurationMin, warmup, cooldown, observations, sortOrder) + `exercises: workoutExerciseDtoSchema[]` + `totals` (shape matches `DayTotals` from `@trainflow/workout-math`: exerciseCount, totalSets, minReps, maxReps, minVolume, maxVolume, estimatedDurationMin).
- `workoutProgramListDtoSchema` — program scalar fields returned by list/get (id, trainerId, clientId, name, goal, startDate, endDate, daysPerWeek, level, location, equipment, observations, status, createdAt, updatedAt).
- `workoutProgramDtoSchema` — `workoutProgramListDtoSchema` + `days: workoutDayDtoSchema[]` + `summary` (shape matches `WeeklySummary`: sessions, totalSets, minVolume, maxVolume, estimatedDurationMin, setsByMuscle).

Export corresponding inferred types (`WorkoutExerciseDto`, `WorkoutDayDto`, `WorkoutProgramListDto`, `WorkoutProgramDto`). These are additive — no changes to existing input schemas or web-side code required, since the web service already produces these exact shapes; the schemas just document/validate what mobile consumes.

## Mobile hooks (`apps/mobile/src/lib/queries/workouts.ts`)

- `useWorkouts(clientId?: string)` — replaces the current no-arg hook. Query key `["workouts", clientId ?? "all"]`. Fetches `GET /api/workouts` when `clientId` is omitted, `GET /api/workouts?clientId=<id>` when provided (the web API already supports this filter). Returns `WorkoutProgramListDto[]`. Same `enabled: isLoaded && isSignedIn` gating as every other hook.
- `useWorkout(id: string)` — new. Query key `["workouts", "detail", id]`. Fetches `GET /api/workouts/:id`, returns `WorkoutProgramDto`. `enabled: isLoaded && isSignedIn && !!id`.

Callers of the old no-arg `useWorkouts()` (dashboard) keep working unchanged since `clientId` is optional.

## Screens

### `apps/mobile/src/app/(app)/workouts/[id].tsx` (new)

Registered directly as a top-level screen in `(app)/_layout.tsx` (no nested `workouts/_layout.tsx`) — per the exercise-library slice's fix, a nested single-screen `Stack` with `headerShown: true` has nothing to pop to and leaves no way back.

Content (`useWorkout(id)`, `ScrollView`):
- Loading: `ActivityIndicator` while `isPending`.
- Error / not found: error text, same pattern as client detail.
- Header: program name, status, goal, start/end dates, level, days/week, location, equipment, observations — same `Field` label/value layout already used in client detail (reuse or duplicate the small `Field` component).
- Weekly summary block: sessions, total sets, volume range (min–max, or "—" if null), estimated duration.
- Per day (in `sortOrder`): day name, focus, day totals (sets, rep range, volume range, estimated duration), then a flat list of its exercises — name (`customName` or looked-up exercise name fallback to "Exercise"), `sets × repsMin–repsMax`, weight + unit (or "—"), rest seconds (or "—"), method. No collapse/expand interaction — programs are small enough to render fully; keeps the screen stateless like the other detail screens.

### Dashboard (`apps/mobile/src/app/(app)/index.tsx`)

"Recent programs" `FlatList` row becomes a `Pressable` navigating to `/workouts/${item.id}`, matching how the "Clients" row already navigates to `/clients/${item.id}`.

### Client detail (`apps/mobile/src/app/(app)/clients/[id].tsx`)

New "Programs" section below the existing fields: `useWorkouts(id)`, rendered as a `FlatList` (name — status), each row `Pressable` → `/workouts/${item.id}`. Empty state "No programs yet." when loaded with zero results. Same loading/error handling convention as other lists (don't block the whole screen on this section's error — client fields above render regardless).

## Error handling

Same conventions as every prior slice: `isPending` gates spinners/stat placeholders (not `isLoading`, per the cold-start fix from the dashboard slice), errors render inline text without crashing the screen, empty states only show once loaded with no error.

## Out of scope / explicitly deferred

- Create/edit/delete/duplicate workout programs, days, or exercises.
- PDF/XLSX export.
- Exercise-library cross-linking from workout exercises (tapping an exercise row to view its library detail).
- Reordering days/exercises.
- Search/filter on program lists.
