# Mobile workout exercises — design spec

**Phase 1, slice 7.** Follows slice 6 (day-level create/edit/delete/reorder, shipped 2026-08-10). This slice adds exercise-level CRUD and reordering within a day. Exercises were previously read-only on mobile (rendered by `ExerciseRow` in `workouts/[id].tsx`).

## Scope

In scope:
- Add an exercise to a day, picked from the exercise library (mobile already has a read-only library list, `apps/mobile/src/app/(app)/exercises/index.tsx`, via `useExercises()`)
- Edit an exercise's core fields (sets, rep range, weight/unit, rest, execution method)
- Delete an exercise (with confirmation)
- Reorder exercises within a day (move up/down)

Out of scope (explicitly deferred):
- Creating a brand-new personal library exercise inline (web's picker "Custom" tab, which POSTs to `/api/exercises` to create a permanent library entry) — this pulls in exercise-library write access as a dependency and is a separable feature
- Moving an exercise from one day to another (web's `/exercises/:exId/move` endpoint)
- The rarer schema fields: `tempo`, `rpe`, `rir`, `observation`, `videoUrl`, `alternativeText` — not exposed in the mobile edit form in this slice
- Exercise-library search on the server — the add-exercise screen filters the already-fetched `useExercises()` list client-side; mobile's exercise library has no search API wiring yet either

## Data model

Uses `workoutExerciseSchema` from `@trainflow/shared-types` (`packages/shared-types/src/workouts.ts:75-97`) for the add payload, and the web's `updateExerciseSchema` shape (defined in `apps/web/src/app/api/_lib/workout-schemas.ts:8-27` — not exported from shared-types, so the mobile edit form validates its own equivalent inline, same approach `DayForm.tsx` used for `updateDaySchema`) for edits, restricted to the core fields this slice exposes:

```ts
// Add payload (built programmatically, not typed by the user — see "Add exercise flow" below)
{
  exerciseId: string;       // the picked library exercise's id
  customName: string;       // copied from the picked exercise's name
  muscleGroup: string;      // copied from the picked exercise's primaryMuscle
  category: string;         // copied from the picked exercise's category
  sets: number;              // default 3
  repsMin: number;           // default 8
  repsMax: number;           // default 12
  weight: null;
  weightUnit: "KG";
  restSec: number;           // default 90
  method: "Standard sets";
}

// Edit payload (user-editable subset)
{
  sets?: number;              // positive int
  repsMin?: number;           // positive int
  repsMax?: number;           // positive int, must be >= repsMin
  weight?: number | null;     // non-negative
  weightUnit?: "KG" | "LB";
  restSec?: number | null;    // non-negative int
  method?: "Standard sets" | "Superset" | "Bi-set" | "Tri-set" | "Giant set" | "Drop set" | "Rest-pause" | "Custom";
}
```

`WorkoutExerciseDto` (response shape, `packages/shared-types/src/workouts.ts:150-171`) is already fully consumed read-only by `ExerciseRow` — no shared-types changes needed for this slice.

## API endpoints (already exist on the web backend, unused by mobile until now)

- `POST /api/workouts/:id/days/:dayId/exercises` — add exercise. Body: `workoutExerciseSchema` (full add payload above). Returns the created `WorkoutExerciseDto`, 201.
- `PATCH /api/workouts/:id/days/:dayId/exercises/:exId` — update exercise. Body: partial, only the fields being changed. Returns the updated `WorkoutExerciseDto`. The service (`apps/web/src/server/workouts.service.ts:523-525`) re-validates `repsMin <= repsMax` after merging with existing values — the mobile edit form must send both `repsMin` and `repsMax` together whenever either changes, so the merge can't produce an invalid pair server-side without the client already knowing.
- `DELETE /api/workouts/:id/days/:dayId/exercises/:exId` — remove exercise. 204 No Content.
- `PUT /api/workouts/:id/days/:dayId/exercises/reorder` — reorder. Body: `{ ids: string[] }`, the exercise ids within that day in new full order. Returns the full `WorkoutProgramDto` (`apps/web/src/server/workouts.service.ts:605`, same shape as day-reorder).

## Hooks

New file `apps/mobile/src/lib/queries/exerciseMutations.ts`, same shape as `dayMutations.ts`:

- `useAddExercise(workoutId: string, dayId: string)` — POST, `mutationFn: (input: WorkoutExerciseInput) => Promise<WorkoutExerciseDto>`.
- `useUpdateExercise(workoutId: string, dayId: string, exerciseId: string)` — PATCH, `mutationFn: (input: Partial<WorkoutExerciseInput>) => Promise<WorkoutExerciseDto>`.
- `useDeleteExercise(workoutId: string, dayId: string, exerciseId: string)` — DELETE, `mutationFn: () => Promise<undefined>`.
- `useReorderExercises(workoutId: string, dayId: string)` — PUT, `mutationFn: (input: { ids: string[] }) => Promise<WorkoutProgramDto>`.

All four invalidate `queryKey: ["workouts"]` `onSuccess`. Following the fix applied to slice 6's `useReorderDays`, `useReorderExercises`'s `onSuccess` must use a concise-body arrow that **returns** the `invalidateQueries` promise (`onSuccess: () => queryClient.invalidateQueries({ queryKey: ["workouts"] })`), not a block body that discards it — the same rapid-repeat-tap bug applies here since this hook backs the same up/down reorder UI pattern.

## Screens and components

**New screen** `apps/mobile/src/app/(app)/workouts/[id]/days/[dayId]/exercises/add.tsx`:
- Reads `workoutId`/`dayId` route params, calls `useExercises()` (existing hook, already used by the read-only library screen), and a local text input filters the returned list client-side by name (case-insensitive substring match) — no new query params or server-side search.
- Renders the filtered list; tapping an exercise immediately builds the default payload (shown in "Data model" above, from that `ExerciseDto`) and calls `useAddExercise(workoutId, dayId).mutateAsync(payload)`, then `router.back()`. No intermediate form screen — this mirrors web wizard's `defaultExercisePayload` exactly (`apps/web/src/components/workouts/wizard/workout-wizard.tsx:23-37`), so a trainer can immediately fine-tune sets/reps/weight afterward via Edit rather than filling a form before adding.
- Loading/error state for `useExercises()` follows the existing read-only exercise-library screen's pattern.

**New component** `apps/mobile/src/components/workouts/ExerciseForm.tsx`:
- Edit-only (no `mode` prop, unlike `DayForm`/`ProgramForm` — there is no create form for exercises, since add happens via picker-and-default as above).
- Same `FieldState`/`buildPayload`/inline-error structure as `DayForm.tsx`.
- Fields: Sets (number-pad), Rep min (number-pad), Rep max (number-pad), Weight (number-pad, optional), Weight unit (KG/LB toggle), Rest seconds (number-pad, optional), Method (toggle row of the 8 `EXECUTION_METHODS` values, used directly as both value and label since they're already human-readable — e.g. "Standard sets", "Bi-set").
- The toggle-row style needs `flexWrap: "wrap"` added (a deliberate deviation from `ProgramForm`'s non-wrapping `toggleRow` style) since 8 method options won't fit one row on a phone width; the 2-option weight-unit toggle reuses the same wrapped style harmlessly.
- Client-side validates `repsMin <= repsMax` before submit (mirrors the service's post-merge check) and required-ness on sets/repsMin/repsMax; weight/restSec/weightUnit/method stay optional in the payload (only sent if changed from their loaded initial value, or always sent — simplest: always send the full core-field set on every edit submit, since this is a full-form edit not a per-field autosave, matching `ProgramForm`'s all-fields-every-submit approach).

**New screen** `apps/mobile/src/app/(app)/workouts/[id]/days/[dayId]/exercises/[exerciseId]/edit.tsx`:
- Sources initial values from the already-loaded `useWorkout(id)` data (find the day by `dayId`, then the exercise by `exerciseId` within it) — no separate fetch, mirrors the day-edit screen's pattern including its not-found handling (day or exercise missing → "Exercise not found.").
- On submit, calls `useUpdateExercise(workoutId, dayId, exerciseId).mutateAsync(payload)`, then `router.back()`.

**Modified** `apps/mobile/src/app/(app)/workouts/[id].tsx`:
- `ExerciseRow` gains an action row (Edit/Delete) and Up/Down reorder buttons, with its own local `actionError` state — same shape as `DaySection` gained in slice 6 (per-exercise `useDeleteExercise`/`useReorderExercises` hooks called locally within the row component, native `Alert.alert` confirm for delete, disabled Up on the first exercise in the day / Down on the last).
- `DaySection` gains an "Add exercise" link (routes to the new add screen with `workoutId`/`dayId`) near its exercise list, and computes `isFirst`/`isLast`/`onMove` for its child `ExerciseRow`s the same way `WorkoutDetailScreen` does for `DaySection`s (a `moveExercise(dayId, exerciseId, direction)` function, scoped to `DaySection` since exercises only reorder within their own day, computed from that day's own `exercises` array — not the top-level `moveDay`).

Route registration: the two new exercise screens register flat in `(app)/_layout.tsx`, following the same back-button lesson as every prior slice.

## Error handling

- Form-level: inline field errors + submit-error banner (`ExerciseForm`, same as `DayForm`).
- Detail-screen actions (delete, reorder): inline error text near the affected exercise, using the same per-row local error-state pattern as `DaySection`.

## Testing

- Typecheck: `pnpm --filter @trainflow/mobile exec tsc --noEmit`.
- No jest tests for the new hooks/screens/form component — matches the established convention for every prior slice's mutation hooks and forms.
- Manual verification checklist additions to `apps/mobile/README.md`:
  - "Add exercise" on a day opens the library picker; typing filters the list by name.
  - Tapping a library exercise adds it to the day with default values (3 sets, 8–12 reps, 90s rest, Standard sets) and returns to the program detail screen.
  - "Edit" on an exercise opens the form pre-filled with its current core-field values.
  - Submitting the edit form with repsMin greater than repsMax shows an inline error and does not submit.
  - Saving an edited exercise reflects the new values on the detail screen, not stale data.
  - "Delete" on an exercise shows a native confirm dialog; canceling leaves it untouched; confirming removes it from the day.
  - Up/Down reorder buttons change an exercise's position within its day and persist across a screen refresh; the first exercise's Up button and the last exercise's Down button are disabled/absent.
  - Rapidly tapping Up or Down multiple times moves the exercise the expected number of positions, not fewer (regression check for the invalidation-timing bug fixed in slice 6).
  - Killing network on add/edit/delete/reorder shows the inline error state, not a crash or a silently-lost action.
