# Mobile Workout Detail (Phase 1, slice 4) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add read-only workout program viewing to `apps/mobile` — a program detail screen (days, exercises, computed totals), tap-through from the dashboard's "Recent programs" row, and a new per-client "Programs" section on the client detail screen.

**Architecture:** Add response DTO Zod schemas to `@trainflow/shared-types` (`workouts.ts`) mirroring the existing `clientDtoSchema` pattern, matching the exact shapes `apps/web/src/server/workouts.service.ts` already returns. Extend the mobile `useWorkouts` hook with an optional `clientId` filter and add a new `useWorkout(id)` detail hook. Add a new `(app)/workouts/[id]` screen registered flat in `(app)/_layout.tsx` (not a nested `_layout.tsx` — a nested single-screen `Stack` with `headerShown: true` has no back target, per the exercise-library slice's fix). Reuse `@trainflow/workout-math`'s `format*`/`emptyDisplay` helpers (already used by web) for consistent display of weights, rep ranges, and rest.

**Tech Stack:** Expo SDK 57, Expo Router 57 (file-based, `typedRoutes` experiment on), React Native 0.86, TanStack Query 5, Clerk (`@clerk/expo`), `@trainflow/shared-types` (Zod), `@trainflow/workout-math` (pure formatting/calc helpers, zero runtime deps).

## Global Constraints

- Read-only: no create/edit/delete/duplicate/export actions.
- No standalone `/workouts` index screen — entry points are the dashboard's recent-programs row and the client detail screen's Programs section only.
- No per-day collapse/expand — render all days/exercises fully, matching the client detail screen's fully-rendered, stateless style.
- No exercise-library cross-linking from workout exercises.
- Bare `View`/`Text`/`StyleSheet` styling only, matching existing screens — no design system.
- `isPending` (not `isLoading`) gates spinners/placeholders — TanStack Query v5's `isLoading = isPending && isFetching`, and with `enabled` gating on Clerk auth state, `isFetching` is false pre-auth-load, so `isLoading` under-reports during cold start.
- Read spec at `docs/superpowers/specs/2026-08-10-mobile-workout-detail-design.md` for full rationale before starting.

---

### Task 1: Workout response DTO schemas in `@trainflow/shared-types`

**Files:**
- Modify: `packages/shared-types/src/workouts.ts`
- Test: none new — matches the existing pattern where the input schemas in this same file (`createWorkoutSchema`, `workoutDaySchema`, etc.) have no dedicated unit tests anywhere in the repo. Verified instead via the package's existing `pnpm test` smoke test (`node -e "require('./dist/index.js')"`) after rebuilding, and via mobile's typecheck in Task 3.

**Interfaces:**
- Consumes: `programStatusSchema`, `weightUnitSchema`, `executionMethodEnum`, `experienceLevelSchema` (all already defined earlier in this same file / imported from `./clients`).
- Produces: `workoutExerciseDtoSchema` / `WorkoutExerciseDto`, `workoutDayDtoSchema` / `WorkoutDayDto`, `workoutProgramListDtoSchema` / `WorkoutProgramListDto`, `workoutProgramDtoSchema` / `WorkoutProgramDto` — exported types consumed by Task 3's hooks. Field shapes match `apps/web/src/server/workouts.service.ts`'s `toExerciseDto`/`toDayDto`/`toProgramListDto`/`toProgramDto` exactly (verified by reading that file directly).

- [ ] **Step 1: Append the DTO schemas**

Add this block at the end of `packages/shared-types/src/workouts.ts` (after the existing `reorderSchema`/`ReorderInput` export, which stays unchanged):

```typescript
export const workoutExerciseDtoSchema = z.object({
  id: z.string().uuid(),
  dayId: z.string().uuid(),
  exerciseId: z.string().uuid().nullable(),
  customName: z.string().nullable(),
  muscleGroup: z.string(),
  category: z.string(),
  sets: z.number(),
  repsMin: z.number(),
  repsMax: z.number(),
  weight: z.number().nullable(),
  weightUnit: weightUnitSchema,
  restSec: z.number().nullable(),
  tempo: z.string().nullable(),
  rpe: z.number().nullable(),
  rir: z.number().nullable(),
  method: executionMethodEnum,
  sortOrder: z.number(),
  observation: z.string().nullable(),
  videoUrl: z.string().nullable(),
  alternativeText: z.string().nullable(),
});

export type WorkoutExerciseDto = z.infer<typeof workoutExerciseDtoSchema>;

const dayTotalsDtoSchema = z.object({
  exerciseCount: z.number(),
  totalSets: z.number(),
  minReps: z.number(),
  maxReps: z.number(),
  minVolume: z.number().nullable(),
  maxVolume: z.number().nullable(),
  estimatedDurationMin: z.number(),
});

export const workoutDayDtoSchema = z.object({
  id: z.string().uuid(),
  programId: z.string().uuid(),
  name: z.string(),
  focus: z.string().nullable(),
  estimatedDurationMin: z.number().nullable(),
  warmup: z.string().nullable(),
  cooldown: z.string().nullable(),
  observations: z.string().nullable(),
  sortOrder: z.number(),
  exercises: z.array(workoutExerciseDtoSchema),
  totals: dayTotalsDtoSchema,
});

export type WorkoutDayDto = z.infer<typeof workoutDayDtoSchema>;

export const workoutProgramListDtoSchema = z.object({
  id: z.string().uuid(),
  trainerId: z.string().uuid(),
  clientId: z.string().uuid(),
  name: z.string(),
  goal: z.string().nullable(),
  startDate: z.string(),
  endDate: z.string().nullable(),
  daysPerWeek: z.number(),
  level: experienceLevelSchema.nullable(),
  location: z.string().nullable(),
  equipment: z.string().nullable(),
  observations: z.string().nullable(),
  status: programStatusSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type WorkoutProgramListDto = z.infer<typeof workoutProgramListDtoSchema>;

export const workoutProgramDtoSchema = workoutProgramListDtoSchema.extend({
  days: z.array(workoutDayDtoSchema),
  summary: z.object({
    sessions: z.number(),
    totalSets: z.number(),
    minVolume: z.number().nullable(),
    maxVolume: z.number().nullable(),
    estimatedDurationMin: z.number(),
    setsByMuscle: z.record(z.string(), z.number()),
  }),
});

export type WorkoutProgramDto = z.infer<typeof workoutProgramDtoSchema>;
```

- [ ] **Step 2: Rebuild the package**

Run: `pnpm --filter @trainflow/shared-types build`
Expected: exits 0, and `packages/shared-types/dist/workouts.js` / `dist/workouts.d.ts` are regenerated (check their mtimes changed, or `grep workoutProgramDtoSchema packages/shared-types/dist/workouts.js`).

- [ ] **Step 3: Run the package's smoke test**

Run: `pnpm --filter @trainflow/shared-types test`
Expected: exits 0 (loads `dist/index.js` without throwing — confirms the new exports don't break module resolution).

- [ ] **Step 4: Commit**

```bash
git add packages/shared-types/src/workouts.ts
git commit -m "feat(shared-types): add workout program response DTO schemas"
```

---

### Task 2: `useWorkouts(clientId?)` and `useWorkout(id)` hooks

**Files:**
- Modify: `apps/mobile/src/lib/queries/workouts.ts` (full rewrite — the file currently exports a hand-rolled `WorkoutSummary` type and a no-arg `useWorkouts()`; `WorkoutSummary` has no other usages in the repo, confirmed via grep)
- Test: none — matches the untested `useClients`/`useExercises` hooks.

**Interfaces:**
- Consumes: `apiFetch<T>(path: string, token: string | null): Promise<T>` from `apps/mobile/src/lib/api.ts`; `useAuth` from `@clerk/expo`; `WorkoutProgramListDto`, `WorkoutProgramDto` from `@trainflow/shared-types` (Task 1).
- Produces: `useWorkouts(clientId?: string)` — query key `["workouts", clientId ?? "all"]`, returns `{ data: WorkoutProgramListDto[] | undefined, isPending: boolean, error: unknown }`. `useWorkout(id: string)` — query key `["workouts", "detail", id]`, returns `{ data: WorkoutProgramDto | undefined, isPending: boolean, error: unknown }`. Both consumed by Task 3 (detail screen), Task 4 (dashboard), and Task 5 (client detail).

- [ ] **Step 1: Rewrite the hooks file**

Full contents of `apps/mobile/src/lib/queries/workouts.ts`:

```typescript
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/expo";
import type { WorkoutProgramDto, WorkoutProgramListDto } from "@trainflow/shared-types";
import { apiFetch } from "@/lib/api";

export function useWorkouts(clientId?: string) {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  return useQuery({
    queryKey: ["workouts", clientId ?? "all"],
    queryFn: async () => {
      const token = await getToken();
      const path = clientId
        ? `/api/workouts?clientId=${encodeURIComponent(clientId)}`
        : "/api/workouts";
      return apiFetch<WorkoutProgramListDto[]>(path, token);
    },
    enabled: isLoaded && isSignedIn,
  });
}

export function useWorkout(id: string) {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  return useQuery({
    queryKey: ["workouts", "detail", id],
    queryFn: async () => {
      const token = await getToken();
      return apiFetch<WorkoutProgramDto>(`/api/workouts/${id}`, token);
    },
    enabled: isLoaded && isSignedIn && !!id,
  });
}
```

- [ ] **Step 2: Typecheck**

Run: `pnpm --filter @trainflow/mobile exec tsc --noEmit`
Expected: errors in `(app)/index.tsx` only (it still calls `useWorkouts()` with the old shape's usage pattern, which still compiles — `WorkoutProgramListDto` has `name`/`status`/`id` fields too — so actually expect NO errors here; if any appear, they're pre-existing call sites using the removed `WorkoutSummary` type name directly, which grep in Task 2 setup confirmed doesn't happen).

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/src/lib/queries/workouts.ts
git commit -m "feat(mobile): add useWorkout detail hook, client-scoped useWorkouts"
```

---

### Task 3: Workout detail screen

**Files:**
- Create: `apps/mobile/src/app/(app)/workouts/[id].tsx`
- Modify: `apps/mobile/src/app/(app)/_layout.tsx` (register the new route flat, alongside `clients/*` and `exercises/index`)
- Modify: `apps/mobile/package.json` (add `@trainflow/workout-math` dependency)

**Interfaces:**
- Consumes: `useWorkout(id)` from Task 2 (returns `{ data: WorkoutProgramDto | undefined, isPending: boolean, error: unknown }`); `formatRepRange`, `formatRest`, `formatWeight`, `emptyDisplay` from `@trainflow/workout-math`.
- Produces: default-exported `WorkoutDetailScreen` at route `/workouts/[id]`.

- [ ] **Step 1: Add the `@trainflow/workout-math` dependency**

In `apps/mobile/package.json`, add this line to `dependencies` (alphabetically, right after `"@trainflow/shared-types": "workspace:*",`):

```json
    "@trainflow/workout-math": "workspace:*",
```

Run: `pnpm install`
Expected: exits 0, links the workspace package (already built — `packages/workout-math/dist/` exists from prior work and is untouched by this plan).

- [ ] **Step 2: Write the detail screen**

Full contents of `apps/mobile/src/app/(app)/workouts/[id].tsx`:

```tsx
import { View, Text, ScrollView, ActivityIndicator, StyleSheet } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useWorkout } from "@/lib/queries/workouts";
import { formatRepRange, formatRest, formatWeight, emptyDisplay } from "@trainflow/workout-math";
import type { WorkoutDayDto, WorkoutExerciseDto } from "@trainflow/shared-types";

function Field({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.fieldValue}>{emptyDisplay(value)}</Text>
    </View>
  );
}

function ExerciseRow({ exercise }: { exercise: WorkoutExerciseDto }) {
  return (
    <View style={styles.exerciseRow}>
      <Text style={styles.exerciseName}>{exercise.customName ?? "Exercise"}</Text>
      <Text style={styles.exerciseMeta}>
        {exercise.sets} × {formatRepRange(exercise.repsMin, exercise.repsMax)}
        {" · "}
        {formatWeight(exercise.weight, exercise.weightUnit)}
        {" · rest "}
        {formatRest(exercise.restSec)}
        {" · "}
        {exercise.method}
      </Text>
    </View>
  );
}

function DaySection({ day }: { day: WorkoutDayDto }) {
  return (
    <View style={styles.daySection}>
      <Text style={styles.dayName}>{day.name}</Text>
      {day.focus ? <Text style={styles.dayFocus}>{day.focus}</Text> : null}
      <Text style={styles.dayTotals}>
        {day.totals.totalSets} sets · {formatRepRange(day.totals.minReps, day.totals.maxReps)} reps ·{" "}
        {day.totals.estimatedDurationMin} min
      </Text>
      {day.exercises.map((exercise) => (
        <ExerciseRow key={exercise.id} exercise={exercise} />
      ))}
    </View>
  );
}

export default function WorkoutDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const workout = useWorkout(id);

  if (workout.isPending) {
    return (
      <View style={styles.screen}>
        <ActivityIndicator />
      </View>
    );
  }

  if (workout.error || !workout.data) {
    return (
      <View style={styles.screen}>
        <Text style={styles.errorText}>
          {workout.error ? (workout.error as Error).message : "Workout not found."}
        </Text>
      </View>
    );
  }

  const w = workout.data;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.name}>{w.name}</Text>
      <Text style={styles.status}>{w.status}</Text>

      <Field label="Goal" value={w.goal} />
      <Field label="Start date" value={w.startDate.slice(0, 10)} />
      <Field label="End date" value={w.endDate ? w.endDate.slice(0, 10) : null} />
      <Field label="Days per week" value={w.daysPerWeek} />
      <Field label="Level" value={w.level} />
      <Field label="Location" value={w.location} />
      <Field label="Equipment" value={w.equipment} />
      <Field label="Observations" value={w.observations} />

      <Text style={styles.sectionTitle}>Weekly summary</Text>
      <Text style={styles.summary}>
        {w.summary.sessions} sessions · {w.summary.totalSets} sets ·{" "}
        {w.summary.minVolume === null || w.summary.maxVolume === null
          ? "—"
          : `${w.summary.minVolume}–${w.summary.maxVolume}`}{" "}
        volume · {w.summary.estimatedDurationMin} min/week
      </Text>

      <Text style={styles.sectionTitle}>Days</Text>
      {w.days.length === 0 ? <Text>No days yet.</Text> : null}
      {w.days.map((day) => (
        <DaySection key={day.id} day={day} />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 24 },
  content: { gap: 12, paddingBottom: 24 },
  name: { fontSize: 22, fontWeight: "700" },
  status: { fontSize: 13, color: "#666", marginBottom: 8 },
  field: { gap: 2 },
  fieldLabel: { fontSize: 12, textTransform: "uppercase", color: "#888" },
  fieldValue: { fontSize: 15, color: "#111" },
  sectionTitle: { fontSize: 16, fontWeight: "600", marginTop: 12 },
  summary: { fontSize: 13, color: "#444" },
  daySection: {
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#ccc",
    gap: 4,
  },
  dayName: { fontSize: 16, fontWeight: "600" },
  dayFocus: { fontSize: 13, color: "#666" },
  dayTotals: { fontSize: 12, color: "#888" },
  exerciseRow: {
    paddingVertical: 6,
    paddingLeft: 8,
    gap: 2,
  },
  exerciseName: { fontSize: 14, fontWeight: "500" },
  exerciseMeta: { fontSize: 12, color: "#666" },
  errorText: { fontSize: 13, color: "red" },
});
```

- [ ] **Step 3: Register the route**

In `apps/mobile/src/app/(app)/_layout.tsx`, add one line inside the existing `<Stack>`, after the `exercises/index` screen:

```tsx
      <Stack.Screen name="workouts/[id]" options={{ headerShown: true, title: "Program" }} />
```

Full resulting file:

```tsx
import { Stack } from "expo-router";

export default function AppLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="clients/index" options={{ headerShown: true, title: "Clients" }} />
      <Stack.Screen name="clients/[id]" options={{ headerShown: true, title: "Client" }} />
      <Stack.Screen name="exercises/index" options={{ headerShown: true, title: "Exercises" }} />
      <Stack.Screen name="workouts/[id]" options={{ headerShown: true, title: "Program" }} />
    </Stack>
  );
}
```

- [ ] **Step 4: Typecheck**

Run: `pnpm --filter @trainflow/mobile exec tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add "apps/mobile/src/app/(app)/workouts/[id].tsx" "apps/mobile/src/app/(app)/_layout.tsx" apps/mobile/package.json pnpm-lock.yaml
git commit -m "feat(mobile): add workout detail screen"
```

---

### Task 4: Dashboard tap-through to workout detail

**Files:**
- Modify: `apps/mobile/src/app/(app)/index.tsx`

**Interfaces:**
- Consumes: existing `router` (`useRouter()` from `expo-router`, already declared in this file).
- Produces: no new exports — the "Recent programs" `FlatList` row becomes a `Pressable` navigation trigger.

- [ ] **Step 1: Make the recent-programs row tappable**

In `apps/mobile/src/app/(app)/index.tsx`, replace this block (the "Recent programs" `FlatList`'s `renderItem`):

```tsx
        renderItem={({ item }) => (
          <Text>
            {item.name} — {item.status}
          </Text>
        )}
```

with:

```tsx
        renderItem={({ item }) => (
          <Pressable onPress={() => router.push(`/workouts/${item.id}`)}>
            <Text>
              {item.name} — {item.status}
            </Text>
          </Pressable>
        )}
```

`Pressable` and `router` are already imported/declared in this file (used by the clients rows and stat block) — no new imports needed.

- [ ] **Step 2: Typecheck**

Run: `pnpm --filter @trainflow/mobile exec tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Run the existing unit test suite (regression check)**

Run: `pnpm --filter @trainflow/mobile exec jest`
Expected: all existing tests still pass (`api.test.ts`, `sharedTypes.test.ts`) — this task doesn't touch either file.

- [ ] **Step 4: Commit**

```bash
git add "apps/mobile/src/app/(app)/index.tsx"
git commit -m "feat(mobile): wire dashboard recent-programs tap-through to workout detail"
```

---

### Task 5: Client detail "Programs" section

**Files:**
- Modify: `apps/mobile/src/app/(app)/clients/[id].tsx`

**Interfaces:**
- Consumes: `useWorkouts(clientId)` from Task 2 (returns `{ data: WorkoutProgramListDto[] | undefined, isPending: boolean, error: unknown }`).
- Produces: no new exports — `ClientDetailScreen` gains a "Programs" section rendered below the existing `Field` rows.

- [ ] **Step 1: Add the Programs section**

In `apps/mobile/src/app/(app)/clients/[id].tsx`, update the imports at the top of the file from:

```tsx
import { View, Text, ScrollView, ActivityIndicator, StyleSheet } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useClient } from "@/lib/queries/clients";
```

to:

```tsx
import { View, Text, ScrollView, ActivityIndicator, Pressable, StyleSheet } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useClient } from "@/lib/queries/clients";
import { useWorkouts } from "@/lib/queries/workouts";
```

Inside `ClientDetailScreen`, add `const router = useRouter();` and `const workouts = useWorkouts(id);` right after the existing `const client = useClient(id);` line.

Then, immediately before the closing `</ScrollView>` (after the last `<Field label="Observations" value={c.observations} />` line), add:

```tsx
      <Text style={styles.sectionTitle}>Programs</Text>
      {workouts.isPending ? <ActivityIndicator /> : null}
      {workouts.error ? (
        <Text style={styles.errorText}>{(workouts.error as Error).message}</Text>
      ) : null}
      {!workouts.isPending && !workouts.error && (workouts.data ?? []).length === 0 ? (
        <Text>No programs yet.</Text>
      ) : null}
      {(workouts.data ?? []).map((program) => (
        <Pressable key={program.id} onPress={() => router.push(`/workouts/${program.id}`)}>
          <Text style={styles.programRow}>
            {program.name} — {program.status}
          </Text>
        </Pressable>
      ))}
```

Add one new style entry to the existing `StyleSheet.create` call in the same file, alongside `sectionTitle`... — note this file currently has no `sectionTitle` style (that's only in the dashboard file), so add both:

```tsx
  sectionTitle: { fontSize: 16, fontWeight: "600", marginTop: 12 },
  programRow: { fontSize: 14, paddingVertical: 6 },
```

- [ ] **Step 2: Typecheck**

Run: `pnpm --filter @trainflow/mobile exec tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add "apps/mobile/src/app/(app)/clients/[id].tsx"
git commit -m "feat(mobile): add client detail programs section"
```

---

### Task 6: README manual verification checklist

**Files:**
- Modify: `apps/mobile/README.md`

**Interfaces:** none (documentation only).

- [ ] **Step 1: Update the status paragraph**

Replace the current status paragraph (line 5):

```markdown
**Status: Phase 1 in progress.** Sign-in, a read-only trainer dashboard, read-only clients screens (list + detail), and a read-only exercise library list are wired up. No invite/create/edit/delete actions, search, or filtering yet — those, plus the workout builder, are follow-up slices. Until this app reaches parity with the trainer-priority screens, `apps/mobile-capacitor` (the Capacitor WebView shell) remains the App Store / Play Store submission path — do not delete it.
```

with:

```markdown
**Status: Phase 1 in progress.** Sign-in, a read-only trainer dashboard, read-only clients screens (list + detail), a read-only exercise library list, and a read-only workout program detail screen (with tap-through from the dashboard and from client detail) are wired up. No invite/create/edit/delete actions, search, or filtering yet. Until this app reaches parity with the trainer-priority screens, `apps/mobile-capacitor` (the Capacitor WebView shell) remains the App Store / Play Store submission path — do not delete it.
```

- [ ] **Step 2: Append checklist items**

Append these items to the end of the "Manual verification checklist" section (keep all existing items above them):

```markdown
- [ ] Tapping a recent-program row on the dashboard opens that program's detail screen
- [ ] Program detail shows the same name, status, goal, dates, level, and days/week as web's workout detail
- [ ] Program detail's weekly summary (sessions, sets, volume, duration) matches web's computed values for the same program
- [ ] Each day's exercises show sets, rep range, weight, rest, and method matching web
- [ ] A program with no days renders "No days yet." instead of a blank section
- [ ] Client detail's Programs section lists that client's programs and matches web's client-scoped workout list
- [ ] Tapping a program row in client detail opens that program's detail screen
- [ ] A client with no programs shows "No programs yet." instead of blank space
- [ ] Back from program detail returns to wherever it was opened from (dashboard or client detail)
- [ ] Killing network / forcing a 401 on program detail or the client's Programs section shows the inline error state, not a crash
```

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/README.md
git commit -m "docs(mobile): update status and verification checklist for workout detail slice"
```
