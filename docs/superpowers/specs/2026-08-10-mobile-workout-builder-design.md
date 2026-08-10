# Mobile workout builder (program shell) — design spec

Date: 2026-08-10
Slice: Phase 1, slice 5 (workout builder, sub-project 1 of N: program create/edit/delete)

## Context

`apps/mobile` (Expo) currently has read-only workout viewing (Phase 1, slice 4): `useWorkout(id)`/`useWorkouts(clientId?)` hooks, a `/workouts/[id]` detail screen, tap-through from the dashboard and from client detail. There is no way to create, edit, or delete a workout program from mobile — all mutation still happens on `apps/web`'s wizard/spreadsheet editor.

The web workout domain is large: program CRUD, days, exercises, reorder, duplicate, from-template, PDF/XLSX export. Building all of that for mobile in one slice isn't realistic. This spec covers only the first, smallest independently-useful sub-project: **program-shell CRUD** — creating a program's top-level metadata, editing that same metadata (including status), and deleting a program. Day and exercise management are explicitly a separate future sub-project.

## Scope

In scope: create a program (name, goal, dates, days/week, level, location, equipment, observations — status is always `DRAFT` on create, matching `WorkoutsService.create`, which ignores any `status` in the input). Edit those same fields plus status (DRAFT/ACTIVE/ARCHIVED) on an existing program. Delete a program (hard delete, matching `WorkoutsService.remove` — the web API has no soft-delete or archive-then-delete flow, so mobile doesn't invent one).

Out of scope: adding/editing/reordering days or exercises within a program (next sub-project), a client picker in the create flow (the client is always implied by the screen the trainer launched from), a native date-picker component (no such package exists in this app yet — plain text date inputs are the MVP), duplicate/from-template creation, PDF/XLSX export.

## Entry points

- **Create:** a "New program" button on the client detail screen (`apps/mobile/src/app/(app)/clients/[id].tsx`), navigating to `/workouts/new?clientId=<that client's id>`. The client is fixed by the screen the trainer came from — there is no client-selection UI in the create form itself.
- **Edit:** an "Edit" button on the workout detail screen (`apps/mobile/src/app/(app)/workouts/[id].tsx`), navigating to `/workouts/[id]/edit`.
- **Delete:** a "Delete" button on the same workout detail screen, gated behind a native `Alert.alert` confirmation (no custom confirm UI — matches this app's zero-dependency-beyond-Expo-core convention so far).

## Screens

### Shared form component: `apps/mobile/src/components/workouts/ProgramForm.tsx` (new)

This is a new `components/` directory for `apps/mobile` — the first shared (non-screen) UI component in this app. That's a deliberate departure from the small-presentational-duplication convention used elsewhere (e.g. the `Field` label/value component is duplicated per-screen): a 9-field validated form is a large enough logic block that duplicating it verbatim across a create screen and an edit screen would itself be a defect, not idiomatic simplicity. `ProgramForm` takes:
- `initialValues` (partial program fields — empty for create, current values for edit)
- `mode: "create" | "edit"` (controls whether the status toggle renders)
- `submitLabel: string`
- `onSubmit: (values) => Promise<void>` (the screen owns the actual mutation call and navigation; the form owns field state, validation, and rendering)

Fields, in order: name (required text), goal (text), start date (text, `YYYY-MM-DD` placeholder), end date (text, `YYYY-MM-DD` placeholder, optional), days per week (numeric text, 1–7), level (3-way Pressable toggle row: Beginner / Intermediate / Advanced, plus an implicit "none" when nothing is selected), location (text), equipment (text), observations (text, multiline). In edit mode only, a status toggle row (Draft / Active / Archived) renders after the other fields.

Validation runs on submit: build a plain object from form state, coerce empty strings to `null`/`undefined` per field the same way the schemas expect (e.g. `daysPerWeek` parsed to a number), and parse through `createWorkoutSchema` (create mode, with `clientId` merged in from the route param) or `updateWorkoutSchema` (edit mode) from `@trainflow/shared-types`. On a Zod validation failure, map `error.issues` to a `Record<string, string>` keyed by `issue.path[0]` and render each message under its field — reusing the exact schemas the web app validates against keeps the two surfaces from drifting. If parsing succeeds, call `onSubmit` with the parsed, typed value. Any error `onSubmit` throws (a failed `apiFetch` call) renders as a single inline banner above the submit button — matching the existing inline-error-text convention used on every other screen in this app (no toast library).

### `apps/mobile/src/app/(app)/workouts/new.tsx` (new)

Reads `clientId` from `useLocalSearchParams<{ clientId: string }>()`. Renders `ProgramForm` in `mode="create"` with empty `initialValues`. `onSubmit` calls the new `useCreateWorkout()` mutation with `{ ...values, clientId }`, and on success calls `router.replace(\`/workouts/${result.id}\`)` so the create form isn't left in the back stack.

### `apps/mobile/src/app/(app)/workouts/[id]/edit.tsx` (new)

Reads `id` from `useLocalSearchParams<{ id: string }>()`, calls `useWorkout(id)` for current values (same hook the detail screen already uses — same loading/error handling convention: `isPending` gates a spinner, `error` renders inline text, and the form doesn't render until data exists). Renders `ProgramForm` in `mode="edit"` with `initialValues` mapped from the fetched `WorkoutProgramDto`. `onSubmit` calls `useUpdateWorkout(id)`, and on success calls `router.back()` (returns to the detail screen, whose `useWorkout(id)` query was invalidated by the mutation and will refetch fresh data).

### Workout detail screen (`apps/mobile/src/app/(app)/workouts/[id].tsx`, modified)

Adds an "Edit" `Pressable` (→ `/workouts/${id}/edit`) and a "Delete" `Pressable` near the top of the screen (below the status line, above the `Field` rows). Delete's `onPress` calls `Alert.alert("Delete program?", "This cannot be undone.", [{ text: "Cancel", style: "cancel" }, { text: "Delete", style: "destructive", onPress: confirmDelete }])`. `confirmDelete` calls `useDeleteWorkout(id).mutateAsync()`, and on success calls `router.replace(\`/clients/${w.clientId}\`)` (the program's own `clientId` field, already present on `WorkoutProgramDto` from the prior slice — no extra fetch needed). On mutation failure, render the same inline error-banner convention as the form.

### Client detail screen (`apps/mobile/src/app/(app)/clients/[id].tsx`, modified)

Adds a "New program" `Pressable` link (plain text, matching the dashboard's existing "Exercise library" link style) above or below the Programs section, navigating to `/workouts/new?clientId=${id}`.

## Mutation hooks: `apps/mobile/src/lib/queries/workoutMutations.ts` (new)

Three `useMutation` wrappers, each importing `useQueryClient` to invalidate on success:

- `useCreateWorkout()` — `mutationFn: (input: CreateWorkoutInput) => apiFetch<WorkoutProgramDto>("/api/workouts", token, { method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify(input) })`. `onSuccess: () => queryClient.invalidateQueries({ queryKey: ["workouts"] })`.
- `useUpdateWorkout(id: string)` — same pattern, `PATCH /api/workouts/${id}` with `UpdateWorkoutInput`.
- `useDeleteWorkout(id: string)` — same pattern, `DELETE /api/workouts/${id}`, expects no response body (see the `apiFetch` fix below).

All three follow this app's existing hook convention: `useAuth()` from `@clerk/expo` for `getToken`, pass the token to `apiFetch`.

## Required infrastructure fix: `apps/mobile/src/lib/api.ts`

`apiFetch<T>` currently calls `await res.json()` unconditionally after checking `res.ok`. `DELETE /api/workouts/:id` returns `204 No Content` with an empty body (confirmed via `apps/web/src/server/http.ts`'s `jsonNoContent()`), and `res.json()` throws a `SyntaxError` on an empty body. Every mobile caller so far has been a GET returning a JSON body, so this slice is the first to hit this. Fix: after the `res.ok` check, if `res.status === 204` or the response has no content (empty body), return `undefined as T` instead of calling `res.json()`. This is a small, backward-compatible change — every existing caller keeps working identically since none of them receive 204s today.

## Error handling

Same conventions as every prior slice: `isPending` gates loading spinners (not `isLoading`), inline text for errors (form-level Zod field errors, and a top-level banner for thrown mutation errors), no crash on network failure. Delete requires an explicit native confirm dialog before the mutation fires — the only destructive action introduced in this slice.

## Out of scope / explicitly deferred

- Day and exercise management (add/edit/delete/reorder) — separate future sub-project.
- Client picker in the create flow.
- A real date-picker component/package.
- Duplicate, from-template, PDF/XLSX export.
- Optimistic updates (mutations wait for the server response before navigating).
