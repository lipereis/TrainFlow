# Mobile Workout Days Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add day-level create/edit/delete/reorder to a workout program on mobile (Phase 1, slice 6), following the same pattern the program-metadata slice (slice 5) established.

**Architecture:** A `DayForm` component (mirrors `ProgramForm`) drives two new screens (`days/new`, `days/[dayId]/edit`); four new mutation hooks in `dayMutations.ts` (mirrors `workoutMutations.ts`) call the already-existing web API day endpoints; the workout detail screen's `DaySection` gains Edit/Delete/Up/Down actions and an "Add day" link.

**Tech Stack:** Expo SDK 57, expo-router, TanStack Query v5, Clerk (`@clerk/expo`), Zod (via `@trainflow/shared-types`), React Native `StyleSheet`.

## Global Constraints

- Days do not have a `status` field — do not add one to `DayForm` (unlike `ProgramForm`, which has Draft/Active/Archived).
- Exercises within a day stay read-only in this slice. Do not add any exercise create/edit/delete/reorder UI — that's a later slice.
- New screens register **flat** in `apps/mobile/src/app/(app)/_layout.tsx` (not nested `_layout.tsx` files) — a nested single-screen `Stack` with `headerShown:true` has nothing to pop to, which broke back-button navigation in an earlier slice (exercise-library slice, commit `acd4587`).
- Mutation hooks invalidate `queryKey: ["workouts"]` (prefix match) on success — no optimistic updates. This matches every existing hook in `workoutMutations.ts`.
- No jest tests for hooks, screens, or form components — this codebase's established convention (confirmed: no test files exist for `ProgramForm.tsx`, `workoutMutations.ts`, `useWorkout`/`useWorkouts`/`useClients`/`useExercises`). Only `apps/mobile/src/lib/api.ts` and `@trainflow/shared-types` schemas get jest coverage. Verification for this slice is `tsc --noEmit` plus the manual checklist.
- Read `apps/mobile/AGENTS.md` before writing code — Expo has changed; consult the versioned docs at docs.expo.dev/versions/v57.0.0/ before assuming any Expo API.

---

### Task 1: `DayForm` component

**Files:**
- Create: `apps/mobile/src/components/workouts/DayForm.tsx`

**Interfaces:**
- Consumes: `workoutDaySchema` from `@trainflow/shared-types` (fields: `name: string` required 1-200 chars, `focus?: string|null` max 200, `estimatedDurationMin?: number|null` non-negative int, `warmup?: string|null` max 2000, `cooldown?: string|null` max 2000, `observations?: string|null` max 5000, plus `id`/`sortOrder`/`exercises` which this form omits).
- Produces: exported `DayFormValues` type (`{ name: string; focus: string | null; estimatedDurationMin: number | null; warmup: string | null; cooldown: string | null; observations: string | null; }`) and exported `DayForm` component with props `{ mode: "create" | "edit"; initialValues?: Partial<DayFormValues>; submitLabel: string; onSubmit: (values: DayFormValues) => Promise<void>; }`. Consumed by Task 3 (create screen) and Task 4 (edit screen).

- [ ] **Step 1: Write the component**

Full contents of `apps/mobile/src/components/workouts/DayForm.tsx`:

```tsx
import { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet } from "react-native";
import { workoutDaySchema } from "@trainflow/shared-types";

export type DayFormValues = {
  name: string;
  focus: string | null;
  estimatedDurationMin: number | null;
  warmup: string | null;
  cooldown: string | null;
  observations: string | null;
};

type FieldState = {
  name: string;
  focus: string;
  estimatedDurationMin: string;
  warmup: string;
  cooldown: string;
  observations: string;
};

const createDaySchema = workoutDaySchema.omit({ id: true, exercises: true });
const updateDaySchema = createDaySchema.partial();

function toFieldState(initial: Partial<DayFormValues> | undefined): FieldState {
  return {
    name: initial?.name ?? "",
    focus: initial?.focus ?? "",
    estimatedDurationMin:
      initial?.estimatedDurationMin != null ? String(initial.estimatedDurationMin) : "",
    warmup: initial?.warmup ?? "",
    cooldown: initial?.cooldown ?? "",
    observations: initial?.observations ?? "",
  };
}

function buildPayload(state: FieldState): DayFormValues {
  return {
    name: state.name,
    focus: state.focus.trim() === "" ? null : state.focus,
    estimatedDurationMin:
      state.estimatedDurationMin.trim() === "" ? null : Number(state.estimatedDurationMin),
    warmup: state.warmup.trim() === "" ? null : state.warmup,
    cooldown: state.cooldown.trim() === "" ? null : state.cooldown,
    observations: state.observations.trim() === "" ? null : state.observations,
  };
}

const RENDERED_FIELD_KEYS = ["name", "focus", "estimatedDurationMin", "warmup", "cooldown", "observations"];

export function DayForm({
  mode,
  initialValues,
  submitLabel,
  onSubmit,
}: {
  mode: "create" | "edit";
  initialValues?: Partial<DayFormValues>;
  submitLabel: string;
  onSubmit: (values: DayFormValues) => Promise<void>;
}) {
  const [state, setState] = useState<FieldState>(() => toFieldState(initialValues));
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function update<K extends keyof FieldState>(key: K, value: FieldState[K]) {
    setState((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit() {
    setSubmitError(null);
    const payload = buildPayload(state);
    const result = (mode === "create" ? createDaySchema : updateDaySchema).safeParse(payload);

    if (!result.success) {
      const errors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const key = String(issue.path[0]);
        if (!errors[key]) {
          errors[key] = issue.message;
        }
      }
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setSubmitting(true);
    try {
      await onSubmit(payload);
    } catch (err) {
      setSubmitError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={styles.form}>
      {submitError ? <Text style={styles.errorText}>{submitError}</Text> : null}

      <Text style={styles.label}>Name</Text>
      <TextInput style={styles.input} value={state.name} onChangeText={(v) => update("name", v)} />
      {fieldErrors.name ? <Text style={styles.fieldError}>{fieldErrors.name}</Text> : null}

      <Text style={styles.label}>Focus</Text>
      <TextInput style={styles.input} value={state.focus} onChangeText={(v) => update("focus", v)} />
      {fieldErrors.focus ? <Text style={styles.fieldError}>{fieldErrors.focus}</Text> : null}

      <Text style={styles.label}>Estimated duration (minutes)</Text>
      <TextInput
        style={styles.input}
        value={state.estimatedDurationMin}
        onChangeText={(v) => update("estimatedDurationMin", v)}
        keyboardType="number-pad"
      />
      {fieldErrors.estimatedDurationMin ? (
        <Text style={styles.fieldError}>{fieldErrors.estimatedDurationMin}</Text>
      ) : null}

      <Text style={styles.label}>Warmup</Text>
      <TextInput
        style={[styles.input, styles.multiline]}
        value={state.warmup}
        onChangeText={(v) => update("warmup", v)}
        multiline
      />
      {fieldErrors.warmup ? <Text style={styles.fieldError}>{fieldErrors.warmup}</Text> : null}

      <Text style={styles.label}>Cooldown</Text>
      <TextInput
        style={[styles.input, styles.multiline]}
        value={state.cooldown}
        onChangeText={(v) => update("cooldown", v)}
        multiline
      />
      {fieldErrors.cooldown ? <Text style={styles.fieldError}>{fieldErrors.cooldown}</Text> : null}

      <Text style={styles.label}>Observations</Text>
      <TextInput
        style={[styles.input, styles.multiline]}
        value={state.observations}
        onChangeText={(v) => update("observations", v)}
        multiline
      />
      {fieldErrors.observations ? <Text style={styles.fieldError}>{fieldErrors.observations}</Text> : null}

      {Object.entries(fieldErrors)
        .filter(([key]) => !RENDERED_FIELD_KEYS.includes(key))
        .map(([key, message]) => (
          <Text key={key} style={styles.fieldError}>
            {message}
          </Text>
        ))}

      <Pressable
        style={[styles.submitButton, submitting ? styles.submitButtonDisabled : null]}
        onPress={handleSubmit}
        disabled={submitting}
      >
        <Text style={styles.submitButtonText}>{submitting ? "Saving..." : submitLabel}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: 8 },
  label: { fontSize: 12, textTransform: "uppercase", color: "#888", marginTop: 8 },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 12, fontSize: 15 },
  multiline: { minHeight: 80, textAlignVertical: "top" },
  fieldError: { fontSize: 12, color: "red" },
  errorText: { fontSize: 13, color: "red" },
  submitButton: {
    backgroundColor: "#0066cc",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 16,
  },
  submitButtonDisabled: { opacity: 0.6 },
  submitButtonText: { color: "#fff", fontSize: 15, fontWeight: "600" },
});
```

- [ ] **Step 2: Typecheck**

Run: `pnpm --filter @trainflow/mobile exec tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/src/components/workouts/DayForm.tsx
git commit -m "feat(mobile): add shared DayForm component"
```

---

### Task 2: Day mutation hooks

**Files:**
- Create: `apps/mobile/src/lib/queries/dayMutations.ts`

**Interfaces:**
- Consumes: `apiFetch<T>` from `apps/mobile/src/lib/api.ts`; `queryClient` from `apps/mobile/src/lib/queryClient.ts`; `useAuth` from `@clerk/expo`; `WorkoutDayInput`, `WorkoutDayDto`, `WorkoutProgramDto` from `@trainflow/shared-types`.
- Produces: `useAddDay(workoutId: string)` — `mutationFn: (input: WorkoutDayInput) => Promise<WorkoutDayDto>`. `useUpdateDay(workoutId: string, dayId: string)` — `mutationFn: (input: Partial<WorkoutDayInput>) => Promise<WorkoutDayDto>`. `useDeleteDay(workoutId: string, dayId: string)` — `mutationFn: () => Promise<undefined>`. `useReorderDays(workoutId: string)` — `mutationFn: (input: { ids: string[] }) => Promise<WorkoutProgramDto>`. All four invalidate `queryKey: ["workouts"]` `onSuccess`. Consumed by Task 3 (create screen), Task 4 (edit screen), Task 5 (delete), Task 6 (reorder).

- [ ] **Step 1: Write the hooks file**

Full contents of `apps/mobile/src/lib/queries/dayMutations.ts`:

```typescript
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@clerk/expo";
import type { WorkoutDayInput, WorkoutDayDto, WorkoutProgramDto } from "@trainflow/shared-types";
import { apiFetch } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";

export function useAddDay(workoutId: string) {
  const { getToken } = useAuth();
  return useMutation({
    mutationFn: async (input: WorkoutDayInput) => {
      const token = await getToken();
      return apiFetch<WorkoutDayDto>(`/api/workouts/${workoutId}/days`, token, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workouts"] });
    },
  });
}

export function useUpdateDay(workoutId: string, dayId: string) {
  const { getToken } = useAuth();
  return useMutation({
    mutationFn: async (input: Partial<WorkoutDayInput>) => {
      const token = await getToken();
      return apiFetch<WorkoutDayDto>(`/api/workouts/${workoutId}/days/${dayId}`, token, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workouts"] });
    },
  });
}

export function useDeleteDay(workoutId: string, dayId: string) {
  const { getToken } = useAuth();
  return useMutation({
    mutationFn: async () => {
      const token = await getToken();
      return apiFetch<undefined>(`/api/workouts/${workoutId}/days/${dayId}`, token, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workouts"] });
    },
  });
}

export function useReorderDays(workoutId: string) {
  const { getToken } = useAuth();
  return useMutation({
    mutationFn: async (input: { ids: string[] }) => {
      const token = await getToken();
      return apiFetch<WorkoutProgramDto>(`/api/workouts/${workoutId}/days/reorder`, token, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workouts"] });
    },
  });
}
```

- [ ] **Step 2: Typecheck**

Run: `pnpm --filter @trainflow/mobile exec tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/src/lib/queries/dayMutations.ts
git commit -m "feat(mobile): add day create/update/delete/reorder mutation hooks"
```

---

### Task 3: "New day" create screen

**Files:**
- Create: `apps/mobile/src/app/(app)/workouts/[id]/days/new.tsx`
- Modify: `apps/mobile/src/app/(app)/_layout.tsx`

**Interfaces:**
- Consumes: `DayForm`, `DayFormValues` from Task 1; `useAddDay` from Task 2 (`mutateAsync(input: WorkoutDayInput): Promise<WorkoutDayDto>`).
- Produces: default-exported `NewDayScreen` at route `/workouts/[id]/days/new`.

- [ ] **Step 1: Write the screen**

Full contents of `apps/mobile/src/app/(app)/workouts/[id]/days/new.tsx`:

```tsx
import { ScrollView, StyleSheet } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { DayForm, type DayFormValues } from "@/components/workouts/DayForm";
import { useAddDay } from "@/lib/queries/dayMutations";

export default function NewDayScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const addDay = useAddDay(id);

  async function handleSubmit(values: DayFormValues) {
    await addDay.mutateAsync(values);
    router.back();
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <DayForm mode="create" submitLabel="Add day" onSubmit={handleSubmit} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 24 },
  content: { paddingBottom: 40 },
});
```

- [ ] **Step 2: Register the route**

In `apps/mobile/src/app/(app)/_layout.tsx`, add one line inside the existing `<Stack>`, after the `workouts/[id]/edit` screen:

```tsx
      <Stack.Screen name="workouts/[id]/days/new" options={{ headerShown: true, title: "New Day" }} />
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
      <Stack.Screen name="workouts/new" options={{ headerShown: true, title: "New Program" }} />
      <Stack.Screen name="workouts/[id]/edit" options={{ headerShown: true, title: "Edit Program" }} />
      <Stack.Screen name="workouts/[id]/days/new" options={{ headerShown: true, title: "New Day" }} />
    </Stack>
  );
}
```

- [ ] **Step 3: Typecheck**

Run: `pnpm --filter @trainflow/mobile exec tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add "apps/mobile/src/app/(app)/workouts/[id]/days/new.tsx" "apps/mobile/src/app/(app)/_layout.tsx"
git commit -m "feat(mobile): add new-day create screen"
```

---

### Task 4: "Edit day" screen

**Files:**
- Create: `apps/mobile/src/app/(app)/workouts/[id]/days/[dayId]/edit.tsx`
- Modify: `apps/mobile/src/app/(app)/_layout.tsx`

**Interfaces:**
- Consumes: `DayForm`, `DayFormValues` from Task 1; `useUpdateDay` from Task 2 (`mutateAsync(input: Partial<WorkoutDayInput>): Promise<WorkoutDayDto>`); `useWorkout` from `apps/mobile/src/lib/queries/workouts.ts` (already returns the full `WorkoutProgramDto` including `days: WorkoutDayDto[]`, so no separate day fetch is needed).
- Produces: default-exported `EditDayScreen` at route `/workouts/[id]/days/[dayId]/edit`.

- [ ] **Step 1: Write the screen**

Full contents of `apps/mobile/src/app/(app)/workouts/[id]/days/[dayId]/edit.tsx`:

```tsx
import { View, Text, ScrollView, ActivityIndicator, StyleSheet } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useWorkout } from "@/lib/queries/workouts";
import { useUpdateDay } from "@/lib/queries/dayMutations";
import { DayForm, type DayFormValues } from "@/components/workouts/DayForm";

export default function EditDayScreen() {
  const { id, dayId } = useLocalSearchParams<{ id: string; dayId: string }>();
  const router = useRouter();
  const workout = useWorkout(id);
  const updateDay = useUpdateDay(id, dayId);

  if (workout.isPending) {
    return (
      <View style={styles.screen}>
        <ActivityIndicator />
      </View>
    );
  }

  const day = workout.data?.days.find((d) => d.id === dayId);

  if (workout.error || !workout.data || !day) {
    return (
      <View style={styles.screen}>
        <Text style={styles.errorText}>
          {workout.error ? (workout.error as Error).message : "Day not found."}
        </Text>
      </View>
    );
  }

  async function handleSubmit(values: DayFormValues) {
    await updateDay.mutateAsync(values);
    router.back();
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <DayForm
        mode="edit"
        submitLabel="Save changes"
        initialValues={{
          name: day.name,
          focus: day.focus,
          estimatedDurationMin: day.estimatedDurationMin,
          warmup: day.warmup,
          cooldown: day.cooldown,
          observations: day.observations,
        }}
        onSubmit={handleSubmit}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 24 },
  content: { paddingBottom: 40 },
  errorText: { fontSize: 13, color: "red" },
});
```

- [ ] **Step 2: Register the route**

In `apps/mobile/src/app/(app)/_layout.tsx`, add one line after `workouts/[id]/days/new`:

```tsx
      <Stack.Screen name="workouts/[id]/days/[dayId]/edit" options={{ headerShown: true, title: "Edit Day" }} />
```

- [ ] **Step 3: Typecheck**

Run: `pnpm --filter @trainflow/mobile exec tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add "apps/mobile/src/app/(app)/workouts/[id]/days/[dayId]/edit.tsx" "apps/mobile/src/app/(app)/_layout.tsx"
git commit -m "feat(mobile): add edit-day screen"
```

---

### Task 5: "Add day" link and per-day Edit/Delete actions on the detail screen

**Files:**
- Modify: `apps/mobile/src/app/(app)/workouts/[id].tsx`

**Interfaces:**
- Consumes: `useDeleteDay` from Task 2 (`mutateAsync(): Promise<undefined>`).
- Produces: `DaySection` now accepts a `workoutId: string` prop and renders its own Edit/Delete actions with local error state (`actionError`). Task 6 extends this same component to add Up/Down reorder buttons.

- [ ] **Step 1: Replace the file**

Full new contents of `apps/mobile/src/app/(app)/workouts/[id].tsx`:

```tsx
import { useState } from "react";
import { View, Text, ScrollView, ActivityIndicator, Pressable, Alert, StyleSheet } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useWorkout } from "@/lib/queries/workouts";
import { useDeleteWorkout } from "@/lib/queries/workoutMutations";
import { useDeleteDay } from "@/lib/queries/dayMutations";
import { formatRepRange, formatRest, formatWeight, emptyDisplay } from "@trainflow/workout-math";
import type { WorkoutDayDto, WorkoutExerciseDto } from "@trainflow/shared-types";

function Field({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.fieldValue}>{value === "" ? "—" : emptyDisplay(value)}</Text>
    </View>
  );
}

function ExerciseRow({ exercise }: { exercise: WorkoutExerciseDto }) {
  return (
    <View style={styles.exerciseRow}>
      <Text style={styles.exerciseName}>{exercise.customName?.trim() || "Exercise"}</Text>
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

function DaySection({ day, workoutId }: { day: WorkoutDayDto; workoutId: string }) {
  const router = useRouter();
  const deleteDay = useDeleteDay(workoutId, day.id);
  const [actionError, setActionError] = useState<string | null>(null);

  function handleDelete() {
    Alert.alert("Delete day?", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          setActionError(null);
          try {
            await deleteDay.mutateAsync();
          } catch (err) {
            setActionError((err as Error).message);
          }
        },
      },
    ]);
  }

  return (
    <View style={styles.daySection}>
      <View style={styles.dayHeaderRow}>
        <Text style={styles.dayName}>{day.name}</Text>
        <View style={styles.dayActionRow}>
          <Pressable onPress={() => router.push(`/workouts/${workoutId}/days/${day.id}/edit`)}>
            <Text style={styles.dayActionLink}>Edit</Text>
          </Pressable>
          <Pressable onPress={handleDelete}>
            <Text style={styles.dayDeleteLink}>Delete</Text>
          </Pressable>
        </View>
      </View>
      {actionError ? <Text style={styles.errorText}>{actionError}</Text> : null}
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
  const router = useRouter();
  const deleteWorkout = useDeleteWorkout(id);
  const [deleteError, setDeleteError] = useState<string | null>(null);

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

      <View style={styles.actionRow}>
        <Pressable onPress={() => router.push(`/workouts/${id}/edit`)}>
          <Text style={styles.actionLink}>Edit</Text>
        </Pressable>
        <Pressable
          onPress={() => {
            Alert.alert("Delete program?", "This cannot be undone.", [
              { text: "Cancel", style: "cancel" },
              {
                text: "Delete",
                style: "destructive",
                onPress: async () => {
                  setDeleteError(null);
                  try {
                    await deleteWorkout.mutateAsync();
                    router.replace(`/clients/${w.clientId}`);
                  } catch (err) {
                    setDeleteError((err as Error).message);
                  }
                },
              },
            ]);
          }}
        >
          <Text style={styles.deleteLink}>Delete</Text>
        </Pressable>
      </View>
      {deleteError ? <Text style={styles.errorText}>{deleteError}</Text> : null}

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

      <View style={styles.dayListHeader}>
        <Text style={styles.sectionTitleFlat}>Days</Text>
        <Pressable onPress={() => router.push(`/workouts/${id}/days/new`)}>
          <Text style={styles.actionLink}>Add day</Text>
        </Pressable>
      </View>
      {w.days.length === 0 ? <Text>No days yet.</Text> : null}
      {w.days.map((day) => (
        <DaySection key={day.id} day={day} workoutId={id} />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 24 },
  content: { gap: 12, paddingBottom: 24 },
  name: { fontSize: 22, fontWeight: "700" },
  status: { fontSize: 13, color: "#666", marginBottom: 8 },
  actionRow: { flexDirection: "row", gap: 16, marginBottom: 8 },
  actionLink: { fontSize: 14, color: "#0066cc" },
  deleteLink: { fontSize: 14, color: "red" },
  field: { gap: 2 },
  fieldLabel: { fontSize: 12, textTransform: "uppercase", color: "#888" },
  fieldValue: { fontSize: 15, color: "#111" },
  sectionTitle: { fontSize: 16, fontWeight: "600", marginTop: 12 },
  sectionTitleFlat: { fontSize: 16, fontWeight: "600" },
  dayListHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
  },
  summary: { fontSize: 13, color: "#444" },
  daySection: {
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#ccc",
    gap: 4,
  },
  dayHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  dayActionRow: { flexDirection: "row", gap: 12 },
  dayActionLink: { fontSize: 13, color: "#0066cc" },
  dayDeleteLink: { fontSize: 13, color: "red" },
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

- [ ] **Step 2: Typecheck**

Run: `pnpm --filter @trainflow/mobile exec tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add "apps/mobile/src/app/(app)/workouts/[id].tsx"
git commit -m "feat(mobile): add day-level edit/delete actions to workout detail screen"
```

---

### Task 6: Day reordering (Up/Down)

**Files:**
- Modify: `apps/mobile/src/app/(app)/workouts/[id].tsx`

**Interfaces:**
- Consumes: `useReorderDays` from Task 2 (`mutateAsync(input: { ids: string[] }): Promise<WorkoutProgramDto>`); `DaySection` and `WorkoutDetailScreen` from Task 5's file.
- Produces: `DaySection` gains `isFirst: boolean`, `isLast: boolean`, `onMove: (dayId: string, direction: "up" | "down") => Promise<void>` props and renders Up/Down buttons. `WorkoutDetailScreen` gains a `moveDay` function passed as `onMove`.

- [ ] **Step 1: Update the import line**

In `apps/mobile/src/app/(app)/workouts/[id].tsx`, replace:

```tsx
import { useDeleteDay } from "@/lib/queries/dayMutations";
```

with:

```tsx
import { useDeleteDay, useReorderDays } from "@/lib/queries/dayMutations";
```

- [ ] **Step 2: Extend `DaySection` with reorder props and buttons**

Replace the entire `DaySection` function:

```tsx
function DaySection({ day, workoutId }: { day: WorkoutDayDto; workoutId: string }) {
  const router = useRouter();
  const deleteDay = useDeleteDay(workoutId, day.id);
  const [actionError, setActionError] = useState<string | null>(null);

  function handleDelete() {
    Alert.alert("Delete day?", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          setActionError(null);
          try {
            await deleteDay.mutateAsync();
          } catch (err) {
            setActionError((err as Error).message);
          }
        },
      },
    ]);
  }

  return (
    <View style={styles.daySection}>
      <View style={styles.dayHeaderRow}>
        <Text style={styles.dayName}>{day.name}</Text>
        <View style={styles.dayActionRow}>
          <Pressable onPress={() => router.push(`/workouts/${workoutId}/days/${day.id}/edit`)}>
            <Text style={styles.dayActionLink}>Edit</Text>
          </Pressable>
          <Pressable onPress={handleDelete}>
            <Text style={styles.dayDeleteLink}>Delete</Text>
          </Pressable>
        </View>
      </View>
      {actionError ? <Text style={styles.errorText}>{actionError}</Text> : null}
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
```

with:

```tsx
function DaySection({
  day,
  workoutId,
  isFirst,
  isLast,
  onMove,
}: {
  day: WorkoutDayDto;
  workoutId: string;
  isFirst: boolean;
  isLast: boolean;
  onMove: (dayId: string, direction: "up" | "down") => Promise<void>;
}) {
  const router = useRouter();
  const deleteDay = useDeleteDay(workoutId, day.id);
  const [actionError, setActionError] = useState<string | null>(null);
  const [moving, setMoving] = useState(false);

  function handleDelete() {
    Alert.alert("Delete day?", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          setActionError(null);
          try {
            await deleteDay.mutateAsync();
          } catch (err) {
            setActionError((err as Error).message);
          }
        },
      },
    ]);
  }

  async function handleMove(direction: "up" | "down") {
    setActionError(null);
    setMoving(true);
    try {
      await onMove(day.id, direction);
    } catch (err) {
      setActionError((err as Error).message);
    } finally {
      setMoving(false);
    }
  }

  return (
    <View style={styles.daySection}>
      <View style={styles.dayHeaderRow}>
        <Text style={styles.dayName}>{day.name}</Text>
        <View style={styles.dayActionRow}>
          <Pressable onPress={() => handleMove("up")} disabled={isFirst || moving}>
            <Text style={[styles.dayActionLink, isFirst ? styles.dayActionDisabled : null]}>Up</Text>
          </Pressable>
          <Pressable onPress={() => handleMove("down")} disabled={isLast || moving}>
            <Text style={[styles.dayActionLink, isLast ? styles.dayActionDisabled : null]}>Down</Text>
          </Pressable>
          <Pressable onPress={() => router.push(`/workouts/${workoutId}/days/${day.id}/edit`)}>
            <Text style={styles.dayActionLink}>Edit</Text>
          </Pressable>
          <Pressable onPress={handleDelete}>
            <Text style={styles.dayDeleteLink}>Delete</Text>
          </Pressable>
        </View>
      </View>
      {actionError ? <Text style={styles.errorText}>{actionError}</Text> : null}
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
```

- [ ] **Step 3: Add `useReorderDays` and `moveDay` to `WorkoutDetailScreen`**

Replace:

```tsx
  const deleteWorkout = useDeleteWorkout(id);
  const [deleteError, setDeleteError] = useState<string | null>(null);
```

with:

```tsx
  const deleteWorkout = useDeleteWorkout(id);
  const reorderDays = useReorderDays(id);
  const [deleteError, setDeleteError] = useState<string | null>(null);
```

Replace:

```tsx
  const w = workout.data;

  return (
```

with:

```tsx
  const w = workout.data;

  async function moveDay(dayId: string, direction: "up" | "down") {
    const days = w.days;
    const index = days.findIndex((d) => d.id === dayId);
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= days.length) {
      return;
    }
    const reordered = [...days];
    [reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]];
    await reorderDays.mutateAsync({ ids: reordered.map((d) => d.id) });
  }

  return (
```

- [ ] **Step 4: Wire the new props into the day list**

Replace:

```tsx
      {w.days.map((day) => (
        <DaySection key={day.id} day={day} workoutId={id} />
      ))}
```

with:

```tsx
      {w.days.map((day, index) => (
        <DaySection
          key={day.id}
          day={day}
          workoutId={id}
          isFirst={index === 0}
          isLast={index === w.days.length - 1}
          onMove={moveDay}
        />
      ))}
```

- [ ] **Step 5: Add the disabled-link style**

In the `StyleSheet.create` call, replace:

```tsx
  dayDeleteLink: { fontSize: 13, color: "red" },
```

with:

```tsx
  dayDeleteLink: { fontSize: 13, color: "red" },
  dayActionDisabled: { color: "#ccc" },
```

- [ ] **Step 6: Typecheck**

Run: `pnpm --filter @trainflow/mobile exec tsc --noEmit`
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add "apps/mobile/src/app/(app)/workouts/[id].tsx"
git commit -m "feat(mobile): add day reorder up/down actions"
```

---

### Task 7: README status and manual verification checklist

**Files:**
- Modify: `apps/mobile/README.md`

**Interfaces:** none (documentation only).

- [ ] **Step 1: Update the status paragraph**

In `apps/mobile/README.md` (line 5), replace:

```markdown
**Status: Phase 1 in progress.** Sign-in, a read-only trainer dashboard, read-only clients screens (list + detail), a read-only exercise library list, a workout program detail screen, and workout program create/edit/delete (metadata only — no day/exercise editing yet) are wired up. No invite/edit/delete for clients, no search or filtering anywhere yet. Until this app reaches parity with the trainer-priority screens, `apps/mobile-capacitor` (the Capacitor WebView shell) remains the App Store / Play Store submission path — do not delete it.
```

with:

```markdown
**Status: Phase 1 in progress.** Sign-in, a read-only trainer dashboard, read-only clients screens (list + detail), a read-only exercise library list, workout program create/edit/delete (metadata), and day-level create/edit/delete/reorder within a program are wired up. Exercises within a day are still read-only — no exercise editing yet. No invite/edit/delete for clients, no search or filtering anywhere yet. Until this app reaches parity with the trainer-priority screens, `apps/mobile-capacitor` (the Capacitor WebView shell) remains the App Store / Play Store submission path — do not delete it.
```

- [ ] **Step 2: Append checklist items**

Append these items to the end of the "Manual verification checklist" section (keep all existing items above them):

```markdown
- [ ] "Add day" on a program's detail screen opens the create form
- [ ] Submitting the day form with a blank name shows an inline "required" error and does not submit
- [ ] A successfully created day appears in the program's Days list
- [ ] "Edit" on a day opens the form pre-filled with that day's current values
- [ ] Saving an edited day reflects the new values on the detail screen, not stale data
- [ ] "Delete" on a day shows a native confirm dialog; canceling leaves the day untouched; confirming removes it from the list
- [ ] The Up button is absent/disabled on the first day and the Down button is absent/disabled on the last day
- [ ] Pressing Up or Down on a day changes its position in the list and the new order persists across a screen refresh
- [ ] Killing network on add/edit/delete/reorder shows the inline error state, not a crash or a silently-lost action
```

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/README.md
git commit -m "docs(mobile): update status and verification checklist for workout-days slice"
```
