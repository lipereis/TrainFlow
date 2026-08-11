# Mobile workout days — design spec

**Phase 1, slice 6.** Follows slice 5 (workout program metadata create/edit/delete, shipped 2026-08-10). This slice adds day-level CRUD and reordering to a workout program on mobile. It does **not** touch exercises within a day — that stays read-only (as it is today) and is deferred to a later slice.

## Scope

In scope:
- Add a day to a program
- Edit a day's fields
- Delete a day (with confirmation)
- Reorder days (move up/down)

Out of scope (explicitly deferred):
- Adding, editing, deleting, or reordering exercises within a day
- The exercise picker (library vs. custom exercise selection)
- Moving an exercise between days

## Data model

Uses the existing `workoutDaySchema` from `@trainflow/shared-types` (`packages/shared-types/src/workouts.ts`):

```ts
{
  id?: string;                        // uuid, response only
  name: string;                       // required, 1-200 chars
  focus?: string | null;              // max 200 chars
  estimatedDurationMin?: number | null; // non-negative int
  warmup?: string | null;             // max 2000 chars
  cooldown?: string | null;           // max 2000 chars
  observations?: string | null;       // max 5000 chars
  sortOrder?: number;                 // non-negative int
  exercises?: WorkoutExerciseInput[]; // not used by this slice's forms
}
```

For create/edit payloads, the mobile form validates against `workoutDaySchema.omit({ id: true, exercises: true })`, mirroring how `ProgramForm.tsx` validates against `createWorkoutSchema`/`updateWorkoutSchema`.

## API endpoints (already exist on the web backend, unused by mobile until now)

- `POST /api/workouts/:id/days` — add day. Body: `workoutDaySchema` (name required; other fields optional).
- `PATCH /api/workouts/:id/days/:dayId` — update day. Body: `workoutDaySchema.omit({exercises:true,id:true}).partial()` (all fields optional).
- `DELETE /api/workouts/:id/days/:dayId` — remove day. 204 No Content (mobile's `apiFetch` already handles 204, added in slice 5).
- `PUT /api/workouts/:id/days/reorder` — reorder. Body: `{ ids: string[] }`, the day ids in the new full order.

## Hooks

New file `apps/mobile/src/lib/queries/dayMutations.ts`, same shape as `workoutMutations.ts`:

- `useAddDay(workoutId: string)` — POST, returns a mutation.
- `useUpdateDay(workoutId: string, dayId: string)` — PATCH.
- `useDeleteDay(workoutId: string, dayId: string)` — DELETE.
- `useReorderDays(workoutId: string)` — PUT, takes `{ ids: string[] }`.

All four invalidate the `useWorkout(workoutId)` query on success (no optimistic updates — matches the existing pattern for program create/update/delete; the day list is small and this keeps the mental model simple).

## Screens and components

**New component** `apps/mobile/src/components/workouts/DayForm.tsx`:
- Same structure as `ProgramForm.tsx`: `FieldState` mirroring the day fields as strings, `toFieldState`/`buildPayload` helpers, `safeParse` against the omitted/partial schema on submit, inline per-field errors plus a catch-all for unmapped errors (the pattern fixed in commits e108a6a and 7cd748b), a submit-error banner, and a disabled-while-submitting Save button.
- Fields: Name (required text input), Focus (text input), Estimated duration in minutes (number-pad input), Warmup (multiline), Cooldown (multiline), Observations (multiline). No status field — days don't have one.
- Props: `mode: "create" | "edit"`, `initialValues?`, `submitLabel`, `onSubmit`.

**New screen** `apps/mobile/src/app/(app)/workouts/[id]/days/new.tsx`:
- Renders `DayForm` in create mode.
- On submit, calls `useAddDay(workoutId).mutateAsync(payload)`, then `router.back()` to return to the workout detail screen (no separate day-detail screen exists — the day is shown inline on the program detail screen).

**New screen** `apps/mobile/src/app/(app)/workouts/[id]/days/[dayId]/edit.tsx`:
- Renders `DayForm` in edit mode, `initialValues` pulled from the already-loaded `useWorkout(id)` data (find the day by `dayId` in `w.days`) — no separate fetch needed, matching how the program edit screen sources its initial values.
- On submit, calls `useUpdateDay(workoutId, dayId).mutateAsync(payload)`, then `router.back()`.

**Modified** `apps/mobile/src/app/(app)/workouts/[id].tsx`:
- `DaySection` gains an action row: "Edit" (links to the new edit screen), "Delete" (native `Alert.alert` confirm, same copy pattern as program delete: "Delete day?" / "This cannot be undone."), and Up/Down reorder buttons.
- Up/Down buttons: disabled on the first day (no Up) and last day (no Down). On press, compute the full reordered `ids` array by swapping the pressed day with its neighbor in the current `w.days` order, then call `useReorderDays(workoutId).mutateAsync({ ids })`.
- An "Add day" link is added near the "Days" section heading, linking to `workouts/[id]/days/new`.
- Action errors (delete/reorder failure) render inline below the relevant day, using the same red error-text style as the existing `deleteError` on the program level. Each `DaySection` gets its own local error state for this (delete/reorder are per-day actions, unlike the program-level delete which is a single action per screen).

Route registration: `(app)/_layout.tsx` needs the two new day screens registered flat (not nested), following the exercise-library slice's back-button lesson (nested single-screen `Stack` with `headerShown:true` has nothing to pop to).

## Error handling

- Form-level: inline field errors + submit-error banner (existing `DayForm`/`ProgramForm` pattern).
- Detail-screen actions (delete, reorder): inline error text near the affected day, cleared on next attempt. A failed action leaves the UI in its prior state (no optimistic mutation to roll back, since none is used).

## Testing

- Typecheck: `pnpm --filter @trainflow/mobile exec tsc --noEmit`.
- Manual verification checklist additions to `apps/mobile/README.md` (mirrors the pattern used for every prior slice):
  - "Add day" opens the create form; submitting with a blank name shows an inline required error and does not submit.
  - A successfully created day appears in the program's Days list.
  - "Edit" on a day opens the form pre-filled with that day's current values.
  - Saving an edited day reflects the new values on the detail screen, not stale data.
  - "Delete" on a day shows a native confirm dialog; canceling leaves the day untouched; confirming removes it from the list.
  - Up/Down reorder buttons change the day's position and persist across a screen refresh; the first day's Up button and the last day's Down button are disabled/absent.
  - Killing network on add/edit/delete/reorder shows the inline error state, not a crash or silently-lost action.
