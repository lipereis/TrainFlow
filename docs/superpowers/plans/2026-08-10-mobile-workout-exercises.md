# Mobile Workout Exercises Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add exercise-level create/edit/delete/reorder within a day to a workout program on mobile (Phase 1, slice 7), following the pattern the day-level slice (slice 6) established.

**Architecture:** A library picker screen adds exercises with sensible defaults (no create-form step — mirrors web wizard's `defaultExercisePayload`); an `ExerciseForm` component (edit-only, core fields) drives an edit screen; four new mutation hooks in `exerciseMutations.ts` (mirrors `dayMutations.ts`) call the already-existing web API exercise endpoints; the workout detail screen's `ExerciseRow` gains Edit/Delete/Up/Down actions and `DaySection` gains an "Add exercise" link.

**Tech Stack:** Expo SDK 57, expo-router, TanStack Query v5, Clerk (`@clerk/expo`), React Native `StyleSheet`. No new dependency: unlike `DayForm`/`ProgramForm` (which validate via a `workoutDaySchema.omit(...)`/`updateWorkoutSchema` imported from `@trainflow/shared-types`, both plain `z.object`s), `workoutExerciseSchema` is a `z.object(...).superRefine(...)` — a `ZodEffects` wrapper that has no `.omit()`/`.partial()` methods — so `ExerciseForm` validates with plain TypeScript/number checks instead of importing `zod` directly into `apps/mobile` (which is not a direct dependency there, only of `@trainflow/shared-types`).

## Global Constraints

- This slice covers core fields only: `sets`, `repsMin`, `repsMax`, `weight`, `weightUnit`, `restSec`, `method`. Do NOT expose `tempo`, `rpe`, `rir`, `observation`, `videoUrl`, or `alternativeText` in the edit form.
- Adding an exercise has NO create-form step. Picking a library exercise immediately POSTs a default payload (sets 3, reps 8–12, rest 90s, method "Standard sets", weightUnit "KG", weight null) built from the picked `ExerciseDto`. The trainer fine-tunes via Edit afterward.
- Do NOT build a "create new personal library exercise" flow. Do NOT build move-between-days. Both are explicitly out of scope for this slice.
- The library picker filters the already-fetched `useExercises()` list client-side by name (case-insensitive substring). Do NOT add a server-side search query param.
- New screens register **flat** in `apps/mobile/src/app/(app)/_layout.tsx` (not nested `_layout.tsx` files) — a nested single-screen `Stack` with `headerShown:true` has nothing to pop to, which broke back-button navigation in an earlier slice (exercise-library slice, commit `acd4587`).
- Mutation hooks invalidate `queryKey: ["workouts"]` (prefix match) on success. `useReorderExercises` specifically MUST use a concise-body arrow that returns the `invalidateQueries` promise (`onSuccess: () => queryClient.invalidateQueries(...)`), not a block body that discards it — a block body caused a real bug in slice 6 (`useReorderDays`) where TanStack Query didn't await the refetch before re-enabling the reorder buttons, letting rapid repeat taps silently drop moves. The other three hooks (`useAddExercise`/`useUpdateExercise`/`useDeleteExercise`) use a normal block-body `onSuccess` with no return, matching every other non-reorder hook in this codebase.
- Any row pairing a variable-length name with a multi-button action group needs `flexShrink: 1` + `numberOfLines={1}` on the name and `flexShrink: 0` on the button row — React Native's Yoga defaults `flexShrink` to `0` (unlike web CSS), and this exact gap caused button clipping in slice 6's final review. Apply this from the start to `ExerciseRow`'s name/action-row styles.
- No jest tests for hooks, screens, or form components — this codebase's established convention (no test files exist for `DayForm.tsx`, `dayMutations.ts`, or any prior slice's screens). Verification is `tsc --noEmit` plus the manual checklist.
- Read `apps/mobile/AGENTS.md` before writing code — Expo has changed; consult the versioned docs at docs.expo.dev/versions/v57.0.0/ before assuming any Expo API.

---

### Task 1: Exercise mutation hooks

**Files:**
- Create: `apps/mobile/src/lib/queries/exerciseMutations.ts`

**Interfaces:**
- Consumes: `apiFetch<T>` from `apps/mobile/src/lib/api.ts`; `queryClient` from `apps/mobile/src/lib/queryClient.ts`; `useAuth` from `@clerk/expo`; `WorkoutExerciseInput`, `WorkoutExerciseDto`, `WorkoutProgramDto` from `@trainflow/shared-types`.
- Produces: `useAddExercise(workoutId: string, dayId: string)` — `mutationFn: (input: WorkoutExerciseInput) => Promise<WorkoutExerciseDto>`. `useUpdateExercise(workoutId: string, dayId: string, exerciseId: string)` — `mutationFn: (input: Partial<WorkoutExerciseInput>) => Promise<WorkoutExerciseDto>`. `useDeleteExercise(workoutId: string, dayId: string, exerciseId: string)` — `mutationFn: () => Promise<undefined>`. `useReorderExercises(workoutId: string, dayId: string)` — `mutationFn: (input: { ids: string[] }) => Promise<WorkoutProgramDto>`. All four invalidate `queryKey: ["workouts"]` `onSuccess` (see Global Constraints for the reorder-hook's return-promise requirement). Consumed by Task 3 (add screen), Task 4 (edit screen), Task 5 (delete), Task 6 (reorder).

- [ ] **Step 1: Write the hooks file**

Full contents of `apps/mobile/src/lib/queries/exerciseMutations.ts`:

```typescript
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@clerk/expo";
import type {
  WorkoutExerciseInput,
  WorkoutExerciseDto,
  WorkoutProgramDto,
} from "@trainflow/shared-types";
import { apiFetch } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";

export function useAddExercise(workoutId: string, dayId: string) {
  const { getToken } = useAuth();
  return useMutation({
    mutationFn: async (input: WorkoutExerciseInput) => {
      const token = await getToken();
      return apiFetch<WorkoutExerciseDto>(
        `/api/workouts/${workoutId}/days/${dayId}/exercises`,
        token,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        },
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workouts"] });
    },
  });
}

export function useUpdateExercise(workoutId: string, dayId: string, exerciseId: string) {
  const { getToken } = useAuth();
  return useMutation({
    mutationFn: async (input: Partial<WorkoutExerciseInput>) => {
      const token = await getToken();
      return apiFetch<WorkoutExerciseDto>(
        `/api/workouts/${workoutId}/days/${dayId}/exercises/${exerciseId}`,
        token,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        },
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workouts"] });
    },
  });
}

export function useDeleteExercise(workoutId: string, dayId: string, exerciseId: string) {
  const { getToken } = useAuth();
  return useMutation({
    mutationFn: async () => {
      const token = await getToken();
      return apiFetch<undefined>(
        `/api/workouts/${workoutId}/days/${dayId}/exercises/${exerciseId}`,
        token,
        { method: "DELETE" },
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workouts"] });
    },
  });
}

export function useReorderExercises(workoutId: string, dayId: string) {
  const { getToken } = useAuth();
  return useMutation({
    mutationFn: async (input: { ids: string[] }) => {
      const token = await getToken();
      return apiFetch<WorkoutProgramDto>(
        `/api/workouts/${workoutId}/days/${dayId}/exercises/reorder`,
        token,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        },
      );
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["workouts"] }),
  });
}
```

- [ ] **Step 2: Typecheck**

Run: `pnpm --filter @trainflow/mobile exec tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/src/lib/queries/exerciseMutations.ts
git commit -m "feat(mobile): add exercise create/update/delete/reorder mutation hooks"
```

---

### Task 2: `ExerciseForm` component

**Files:**
- Create: `apps/mobile/src/components/workouts/ExerciseForm.tsx`

**Interfaces:**
- Consumes: `EXECUTION_METHODS` from `@trainflow/shared-types` (the const array `["Standard sets", "Superset", "Bi-set", "Tri-set", "Giant set", "Drop set", "Rest-pause", "Custom"]`).
- Produces: exported `ExerciseFormValues` type (`{ sets: number; repsMin: number; repsMax: number; weight: number | null; weightUnit: "KG" | "LB"; restSec: number | null; method: (typeof EXECUTION_METHODS)[number]; }`) and exported `ExerciseForm` component with props `{ initialValues: ExerciseFormValues; submitLabel: string; onSubmit: (values: ExerciseFormValues) => Promise<void>; }`. No `mode` prop — this form is edit-only (see Global Constraints: adding has no form step). Consumed by Task 4 (edit screen).

- [ ] **Step 1: Write the component**

Full contents of `apps/mobile/src/components/workouts/ExerciseForm.tsx`:

```tsx
import { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet } from "react-native";
import { EXECUTION_METHODS } from "@trainflow/shared-types";

export type ExerciseFormValues = {
  sets: number;
  repsMin: number;
  repsMax: number;
  weight: number | null;
  weightUnit: "KG" | "LB";
  restSec: number | null;
  method: (typeof EXECUTION_METHODS)[number];
};

type FieldState = {
  sets: string;
  repsMin: string;
  repsMax: string;
  weight: string;
  weightUnit: "KG" | "LB";
  restSec: string;
  method: (typeof EXECUTION_METHODS)[number];
};

function toFieldState(initial: ExerciseFormValues): FieldState {
  return {
    sets: String(initial.sets),
    repsMin: String(initial.repsMin),
    repsMax: String(initial.repsMax),
    weight: initial.weight != null ? String(initial.weight) : "",
    weightUnit: initial.weightUnit,
    restSec: initial.restSec != null ? String(initial.restSec) : "",
    method: initial.method,
  };
}

function buildPayload(state: FieldState) {
  return {
    sets: state.sets.trim() === "" ? NaN : Number(state.sets),
    repsMin: state.repsMin.trim() === "" ? NaN : Number(state.repsMin),
    repsMax: state.repsMax.trim() === "" ? NaN : Number(state.repsMax),
    weight: state.weight.trim() === "" ? null : Number(state.weight),
    weightUnit: state.weightUnit,
    restSec: state.restSec.trim() === "" ? null : Number(state.restSec),
    method: state.method,
  };
}

const WEIGHT_UNIT_OPTIONS: { value: "KG" | "LB"; label: string }[] = [
  { value: "KG", label: "kg" },
  { value: "LB", label: "lb" },
];

const METHOD_OPTIONS: { value: (typeof EXECUTION_METHODS)[number]; label: string }[] =
  EXECUTION_METHODS.map((method) => ({ value: method, label: method }));

function ToggleRow<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <View style={styles.toggleRow}>
      {options.map((option) => (
        <Pressable
          key={option.value}
          onPress={() => onChange(option.value)}
          style={[styles.toggleOption, value === option.value ? styles.toggleOptionActive : null]}
        >
          <Text style={value === option.value ? styles.toggleLabelActive : styles.toggleLabel}>
            {option.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

export function ExerciseForm({
  initialValues,
  submitLabel,
  onSubmit,
}: {
  initialValues: ExerciseFormValues;
  submitLabel: string;
  onSubmit: (values: ExerciseFormValues) => Promise<void>;
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
    const errors: Record<string, string> = {};

    if (!Number.isFinite(payload.sets) || payload.sets <= 0) {
      errors.sets = "Sets must be a positive number";
    }
    if (!Number.isFinite(payload.repsMin) || payload.repsMin <= 0) {
      errors.repsMin = "Rep min must be a positive number";
    }
    if (!Number.isFinite(payload.repsMax) || payload.repsMax <= 0) {
      errors.repsMax = "Rep max must be a positive number";
    }
    if (
      Number.isFinite(payload.repsMin) &&
      Number.isFinite(payload.repsMax) &&
      payload.repsMin > payload.repsMax
    ) {
      errors.repsMax = "Rep max must be greater than or equal to rep min";
    }
    if (payload.weight !== null && (!Number.isFinite(payload.weight) || payload.weight < 0)) {
      errors.weight = "Weight must be zero or a positive number";
    }
    if (payload.restSec !== null && (!Number.isFinite(payload.restSec) || payload.restSec < 0)) {
      errors.restSec = "Rest must be zero or a positive number";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setSubmitting(true);
    try {
      await onSubmit(payload as ExerciseFormValues);
    } catch (err) {
      setSubmitError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={styles.form}>
      {submitError ? <Text style={styles.errorText}>{submitError}</Text> : null}

      <Text style={styles.label}>Sets</Text>
      <TextInput
        style={styles.input}
        value={state.sets}
        onChangeText={(v) => update("sets", v)}
        keyboardType="number-pad"
      />
      {fieldErrors.sets ? <Text style={styles.fieldError}>{fieldErrors.sets}</Text> : null}

      <Text style={styles.label}>Rep min</Text>
      <TextInput
        style={styles.input}
        value={state.repsMin}
        onChangeText={(v) => update("repsMin", v)}
        keyboardType="number-pad"
      />
      {fieldErrors.repsMin ? <Text style={styles.fieldError}>{fieldErrors.repsMin}</Text> : null}

      <Text style={styles.label}>Rep max</Text>
      <TextInput
        style={styles.input}
        value={state.repsMax}
        onChangeText={(v) => update("repsMax", v)}
        keyboardType="number-pad"
      />
      {fieldErrors.repsMax ? <Text style={styles.fieldError}>{fieldErrors.repsMax}</Text> : null}

      <Text style={styles.label}>Weight</Text>
      <TextInput
        style={styles.input}
        value={state.weight}
        onChangeText={(v) => update("weight", v)}
        keyboardType="number-pad"
      />
      {fieldErrors.weight ? <Text style={styles.fieldError}>{fieldErrors.weight}</Text> : null}

      <Text style={styles.label}>Weight unit</Text>
      <ToggleRow
        options={WEIGHT_UNIT_OPTIONS}
        value={state.weightUnit}
        onChange={(v) => update("weightUnit", v)}
      />

      <Text style={styles.label}>Rest (seconds)</Text>
      <TextInput
        style={styles.input}
        value={state.restSec}
        onChangeText={(v) => update("restSec", v)}
        keyboardType="number-pad"
      />
      {fieldErrors.restSec ? <Text style={styles.fieldError}>{fieldErrors.restSec}</Text> : null}

      <Text style={styles.label}>Method</Text>
      <ToggleRow options={METHOD_OPTIONS} value={state.method} onChange={(v) => update("method", v)} />

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
  fieldError: { fontSize: 12, color: "red" },
  errorText: { fontSize: 13, color: "red" },
  toggleRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  toggleOption: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  toggleOptionActive: { borderColor: "#0066cc", backgroundColor: "#e6f0fb" },
  toggleLabel: { fontSize: 13, color: "#333" },
  toggleLabelActive: { fontSize: 13, color: "#0066cc", fontWeight: "600" },
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
git add apps/mobile/src/components/workouts/ExerciseForm.tsx
git commit -m "feat(mobile): add ExerciseForm component"
```

---

### Task 3: "Add exercise" library-picker screen

**Files:**
- Create: `apps/mobile/src/app/(app)/workouts/[id]/days/[dayId]/exercises/add.tsx`
- Modify: `apps/mobile/src/app/(app)/_layout.tsx`

**Interfaces:**
- Consumes: `useExercises` from `apps/mobile/src/lib/queries/exercises.ts` (returns `UseQueryResult<ExerciseDto[]>`, already built); `useAddExercise` from Task 1 (`mutateAsync(input: WorkoutExerciseInput): Promise<WorkoutExerciseDto>`).
- Produces: default-exported `AddExerciseScreen` at route `/workouts/[id]/days/[dayId]/exercises/add`.

- [ ] **Step 1: Write the screen**

Full contents of `apps/mobile/src/app/(app)/workouts/[id]/days/[dayId]/exercises/add.tsx`:

```tsx
import { useState } from "react";
import { View, Text, TextInput, FlatList, ActivityIndicator, Pressable, StyleSheet } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useExercises } from "@/lib/queries/exercises";
import { useAddExercise } from "@/lib/queries/exerciseMutations";
import type { ExerciseDto } from "@trainflow/shared-types";

function defaultExercisePayload(exercise: ExerciseDto) {
  return {
    exerciseId: exercise.id,
    customName: exercise.name,
    muscleGroup: exercise.primaryMuscle,
    category: exercise.category,
    sets: 3,
    repsMin: 8,
    repsMax: 12,
    weight: null,
    weightUnit: "KG" as const,
    restSec: 90,
    method: "Standard sets" as const,
  };
}

export default function AddExerciseScreen() {
  const { id, dayId } = useLocalSearchParams<{ id: string; dayId: string }>();
  const router = useRouter();
  const exercises = useExercises();
  const addExercise = useAddExercise(id, dayId);
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  const filtered = (exercises.data ?? []).filter((exercise) =>
    exercise.name.toLowerCase().includes(query.trim().toLowerCase()),
  );

  async function handlePick(exercise: ExerciseDto) {
    setError(null);
    try {
      await addExercise.mutateAsync(defaultExercisePayload(exercise));
      router.back();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <View style={styles.screen}>
      <TextInput
        style={styles.input}
        value={query}
        onChangeText={setQuery}
        placeholder="Search exercises"
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      {exercises.isPending ? <ActivityIndicator /> : null}
      {exercises.error ? (
        <Text style={styles.errorText}>{(exercises.error as Error).message}</Text>
      ) : null}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable style={styles.row} onPress={() => handlePick(item)} disabled={addExercise.isPending}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.meta}>
              {item.primaryMuscle} · {item.category}
            </Text>
          </Pressable>
        )}
        ListEmptyComponent={
          !exercises.isPending && !exercises.error ? <Text>No exercises found.</Text> : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 24, gap: 12 },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 12, fontSize: 15 },
  row: {
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#ccc",
    gap: 4,
  },
  name: { fontSize: 16, fontWeight: "600" },
  meta: { fontSize: 13, color: "#666" },
  errorText: { fontSize: 13, color: "red" },
});
```

- [ ] **Step 2: Register the route**

In `apps/mobile/src/app/(app)/_layout.tsx`, add one line inside the existing `<Stack>`, after the `workouts/[id]/days/[dayId]/edit` screen:

```tsx
      <Stack.Screen name="workouts/[id]/days/[dayId]/exercises/add" options={{ headerShown: true, title: "Add Exercise" }} />
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
      <Stack.Screen name="workouts/[id]/days/[dayId]/edit" options={{ headerShown: true, title: "Edit Day" }} />
      <Stack.Screen name="workouts/[id]/days/[dayId]/exercises/add" options={{ headerShown: true, title: "Add Exercise" }} />
    </Stack>
  );
}
```

- [ ] **Step 3: Typecheck**

Run: `pnpm --filter @trainflow/mobile exec tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add "apps/mobile/src/app/(app)/workouts/[id]/days/[dayId]/exercises/add.tsx" "apps/mobile/src/app/(app)/_layout.tsx"
git commit -m "feat(mobile): add exercise library-picker screen"
```

---

### Task 4: "Edit exercise" screen

**Files:**
- Create: `apps/mobile/src/app/(app)/workouts/[id]/days/[dayId]/exercises/[exerciseId]/edit.tsx`
- Modify: `apps/mobile/src/app/(app)/_layout.tsx`

**Interfaces:**
- Consumes: `ExerciseForm`, `ExerciseFormValues` from Task 2; `useUpdateExercise` from Task 1 (`mutateAsync(input: Partial<WorkoutExerciseInput>): Promise<WorkoutExerciseDto>`); `useWorkout` from `apps/mobile/src/lib/queries/workouts.ts` (already returns the full `WorkoutProgramDto` including nested `days[].exercises[]`, so no separate exercise fetch is needed).
- Produces: default-exported `EditExerciseScreen` at route `/workouts/[id]/days/[dayId]/exercises/[exerciseId]/edit`.

- [ ] **Step 1: Write the screen**

Full contents of `apps/mobile/src/app/(app)/workouts/[id]/days/[dayId]/exercises/[exerciseId]/edit.tsx`:

```tsx
import { View, Text, ScrollView, ActivityIndicator, StyleSheet } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useWorkout } from "@/lib/queries/workouts";
import { useUpdateExercise } from "@/lib/queries/exerciseMutations";
import { ExerciseForm, type ExerciseFormValues } from "@/components/workouts/ExerciseForm";

export default function EditExerciseScreen() {
  const { id, dayId, exerciseId } = useLocalSearchParams<{
    id: string;
    dayId: string;
    exerciseId: string;
  }>();
  const router = useRouter();
  const workout = useWorkout(id);
  const updateExercise = useUpdateExercise(id, dayId, exerciseId);

  if (workout.isPending) {
    return (
      <View style={styles.screen}>
        <ActivityIndicator />
      </View>
    );
  }

  const day = workout.data?.days.find((d) => d.id === dayId);
  const exercise = day?.exercises.find((e) => e.id === exerciseId);

  if (workout.error || !workout.data || !day || !exercise) {
    return (
      <View style={styles.screen}>
        <Text style={styles.errorText}>
          {workout.error ? (workout.error as Error).message : "Exercise not found."}
        </Text>
      </View>
    );
  }

  async function handleSubmit(values: ExerciseFormValues) {
    await updateExercise.mutateAsync(values);
    router.back();
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <ExerciseForm
        submitLabel="Save changes"
        initialValues={{
          sets: exercise.sets,
          repsMin: exercise.repsMin,
          repsMax: exercise.repsMax,
          weight: exercise.weight,
          weightUnit: exercise.weightUnit,
          restSec: exercise.restSec,
          method: exercise.method,
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

In `apps/mobile/src/app/(app)/_layout.tsx`, add one line after `workouts/[id]/days/[dayId]/exercises/add`:

```tsx
      <Stack.Screen name="workouts/[id]/days/[dayId]/exercises/[exerciseId]/edit" options={{ headerShown: true, title: "Edit Exercise" }} />
```

- [ ] **Step 3: Typecheck**

Run: `pnpm --filter @trainflow/mobile exec tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add "apps/mobile/src/app/(app)/workouts/[id]/days/[dayId]/exercises/[exerciseId]/edit.tsx" "apps/mobile/src/app/(app)/_layout.tsx"
git commit -m "feat(mobile): add edit-exercise screen"
```

---

### Task 5: "Add exercise" link and per-exercise Edit/Delete actions on the detail screen

**Files:**
- Modify: `apps/mobile/src/app/(app)/workouts/[id].tsx`

**Interfaces:**
- Consumes: `useDeleteExercise` from Task 1 (`mutateAsync(): Promise<undefined>`).
- Produces: `ExerciseRow` now accepts `workoutId: string` and `dayId: string` props and renders its own Edit/Delete actions with local error state (`actionError`), matching the shape `DaySection` already has for day-level actions. `DaySection` renders an "Add exercise" link. Task 6 extends `ExerciseRow` to add Up/Down reorder buttons.

- [ ] **Step 1: Replace the file**

Full new contents of `apps/mobile/src/app/(app)/workouts/[id].tsx`:

```tsx
import { useState } from "react";
import { View, Text, ScrollView, ActivityIndicator, Pressable, Alert, StyleSheet } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useWorkout } from "@/lib/queries/workouts";
import { useDeleteWorkout } from "@/lib/queries/workoutMutations";
import { useDeleteDay, useReorderDays } from "@/lib/queries/dayMutations";
import { useDeleteExercise } from "@/lib/queries/exerciseMutations";
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

function ExerciseRow({
  exercise,
  workoutId,
  dayId,
}: {
  exercise: WorkoutExerciseDto;
  workoutId: string;
  dayId: string;
}) {
  const router = useRouter();
  const deleteExercise = useDeleteExercise(workoutId, dayId, exercise.id);
  const [actionError, setActionError] = useState<string | null>(null);

  function handleDelete() {
    Alert.alert("Delete exercise?", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          setActionError(null);
          try {
            await deleteExercise.mutateAsync();
          } catch (err) {
            setActionError((err as Error).message);
          }
        },
      },
    ]);
  }

  return (
    <View style={styles.exerciseRow}>
      <View style={styles.exerciseHeaderRow}>
        <Text style={styles.exerciseName} numberOfLines={1}>
          {exercise.customName?.trim() || "Exercise"}
        </Text>
        <View style={styles.exerciseActionRow}>
          <Pressable
            onPress={() =>
              router.push(`/workouts/${workoutId}/days/${dayId}/exercises/${exercise.id}/edit`)
            }
          >
            <Text style={styles.exerciseActionLink}>Edit</Text>
          </Pressable>
          <Pressable onPress={handleDelete}>
            <Text style={styles.exerciseDeleteLink}>Delete</Text>
          </Pressable>
        </View>
      </View>
      {actionError ? <Text style={styles.errorText}>{actionError}</Text> : null}
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
        <Text style={styles.dayName} numberOfLines={1}>{day.name}</Text>
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
      <View style={styles.exerciseListHeader}>
        <Text style={styles.exerciseListTitle}>Exercises</Text>
        <Pressable onPress={() => router.push(`/workouts/${workoutId}/days/${day.id}/exercises/add`)}>
          <Text style={styles.dayActionLink}>Add exercise</Text>
        </Pressable>
      </View>
      {day.exercises.length === 0 ? <Text style={styles.emptyExercises}>No exercises yet.</Text> : null}
      {day.exercises.map((exercise) => (
        <ExerciseRow key={exercise.id} exercise={exercise} workoutId={workoutId} dayId={day.id} />
      ))}
    </View>
  );
}

export default function WorkoutDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const workout = useWorkout(id);
  const router = useRouter();
  const deleteWorkout = useDeleteWorkout(id);
  const reorderDays = useReorderDays(id);
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
  dayActionRow: { flexDirection: "row", gap: 12, flexShrink: 0 },
  dayActionLink: { fontSize: 13, color: "#0066cc" },
  dayDeleteLink: { fontSize: 13, color: "red" },
  dayActionDisabled: { color: "#ccc" },
  dayName: { fontSize: 16, fontWeight: "600", flexShrink: 1 },
  dayFocus: { fontSize: 13, color: "#666" },
  dayTotals: { fontSize: 12, color: "#888" },
  exerciseListHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  exerciseListTitle: { fontSize: 13, fontWeight: "600", color: "#444" },
  emptyExercises: { fontSize: 13, color: "#888" },
  exerciseRow: {
    paddingVertical: 6,
    paddingLeft: 8,
    gap: 2,
  },
  exerciseHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  exerciseActionRow: { flexDirection: "row", gap: 12, flexShrink: 0 },
  exerciseActionLink: { fontSize: 12, color: "#0066cc" },
  exerciseDeleteLink: { fontSize: 12, color: "red" },
  exerciseName: { fontSize: 14, fontWeight: "500", flexShrink: 1 },
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
git commit -m "feat(mobile): add exercise-level edit/delete actions and add-exercise link to detail screen"
```

---

### Task 6: Exercise reordering (Up/Down)

**Files:**
- Modify: `apps/mobile/src/app/(app)/workouts/[id].tsx`

**Interfaces:**
- Consumes: `useReorderExercises` from Task 1 (`mutateAsync(input: { ids: string[] }): Promise<WorkoutProgramDto>`); `ExerciseRow` and `DaySection` from Task 5's file.
- Produces: `ExerciseRow` gains `isFirst: boolean`, `isLast: boolean`, `onMove: (exerciseId: string, direction: "up" | "down") => Promise<void>` props and renders Up/Down buttons. `DaySection` gains a `moveExercise` function (scoped to that day's own `exercises` array) passed as `onMove`.

- [ ] **Step 1: Update the import line**

In `apps/mobile/src/app/(app)/workouts/[id].tsx`, replace:

```tsx
import { useDeleteExercise } from "@/lib/queries/exerciseMutations";
```

with:

```tsx
import { useDeleteExercise, useReorderExercises } from "@/lib/queries/exerciseMutations";
```

- [ ] **Step 2: Extend `ExerciseRow` with reorder props and buttons**

Replace the entire `ExerciseRow` function:

```tsx
function ExerciseRow({
  exercise,
  workoutId,
  dayId,
}: {
  exercise: WorkoutExerciseDto;
  workoutId: string;
  dayId: string;
}) {
  const router = useRouter();
  const deleteExercise = useDeleteExercise(workoutId, dayId, exercise.id);
  const [actionError, setActionError] = useState<string | null>(null);

  function handleDelete() {
    Alert.alert("Delete exercise?", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          setActionError(null);
          try {
            await deleteExercise.mutateAsync();
          } catch (err) {
            setActionError((err as Error).message);
          }
        },
      },
    ]);
  }

  return (
    <View style={styles.exerciseRow}>
      <View style={styles.exerciseHeaderRow}>
        <Text style={styles.exerciseName} numberOfLines={1}>
          {exercise.customName?.trim() || "Exercise"}
        </Text>
        <View style={styles.exerciseActionRow}>
          <Pressable
            onPress={() =>
              router.push(`/workouts/${workoutId}/days/${dayId}/exercises/${exercise.id}/edit`)
            }
          >
            <Text style={styles.exerciseActionLink}>Edit</Text>
          </Pressable>
          <Pressable onPress={handleDelete}>
            <Text style={styles.exerciseDeleteLink}>Delete</Text>
          </Pressable>
        </View>
      </View>
      {actionError ? <Text style={styles.errorText}>{actionError}</Text> : null}
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
```

with:

```tsx
function ExerciseRow({
  exercise,
  workoutId,
  dayId,
  isFirst,
  isLast,
  onMove,
}: {
  exercise: WorkoutExerciseDto;
  workoutId: string;
  dayId: string;
  isFirst: boolean;
  isLast: boolean;
  onMove: (exerciseId: string, direction: "up" | "down") => Promise<void>;
}) {
  const router = useRouter();
  const deleteExercise = useDeleteExercise(workoutId, dayId, exercise.id);
  const [actionError, setActionError] = useState<string | null>(null);
  const [moving, setMoving] = useState(false);

  function handleDelete() {
    Alert.alert("Delete exercise?", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          setActionError(null);
          try {
            await deleteExercise.mutateAsync();
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
      await onMove(exercise.id, direction);
    } catch (err) {
      setActionError((err as Error).message);
    } finally {
      setMoving(false);
    }
  }

  return (
    <View style={styles.exerciseRow}>
      <View style={styles.exerciseHeaderRow}>
        <Text style={styles.exerciseName} numberOfLines={1}>
          {exercise.customName?.trim() || "Exercise"}
        </Text>
        <View style={styles.exerciseActionRow}>
          <Pressable onPress={() => handleMove("up")} disabled={isFirst || moving}>
            <Text style={[styles.exerciseActionLink, isFirst ? styles.exerciseActionDisabled : null]}>
              Up
            </Text>
          </Pressable>
          <Pressable onPress={() => handleMove("down")} disabled={isLast || moving}>
            <Text style={[styles.exerciseActionLink, isLast ? styles.exerciseActionDisabled : null]}>
              Down
            </Text>
          </Pressable>
          <Pressable
            onPress={() =>
              router.push(`/workouts/${workoutId}/days/${dayId}/exercises/${exercise.id}/edit`)
            }
          >
            <Text style={styles.exerciseActionLink}>Edit</Text>
          </Pressable>
          <Pressable onPress={handleDelete}>
            <Text style={styles.exerciseDeleteLink}>Delete</Text>
          </Pressable>
        </View>
      </View>
      {actionError ? <Text style={styles.errorText}>{actionError}</Text> : null}
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
```

- [ ] **Step 3: Add `useReorderExercises` and `moveExercise` to `DaySection`**

Replace:

```tsx
  const router = useRouter();
  const deleteDay = useDeleteDay(workoutId, day.id);
  const [actionError, setActionError] = useState<string | null>(null);
  const [moving, setMoving] = useState(false);
```

with:

```tsx
  const router = useRouter();
  const deleteDay = useDeleteDay(workoutId, day.id);
  const reorderExercises = useReorderExercises(workoutId, day.id);
  const [actionError, setActionError] = useState<string | null>(null);
  const [moving, setMoving] = useState(false);
```

Replace:

```tsx
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
```

with:

```tsx
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

  async function moveExercise(exerciseId: string, direction: "up" | "down") {
    const exercises = day.exercises;
    const index = exercises.findIndex((e) => e.id === exerciseId);
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= exercises.length) {
      return;
    }
    const reordered = [...exercises];
    [reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]];
    await reorderExercises.mutateAsync({ ids: reordered.map((e) => e.id) });
  }

  return (
    <View style={styles.daySection}>
```

- [ ] **Step 4: Wire the new props into the exercise list**

Replace:

```tsx
      {day.exercises.map((exercise) => (
        <ExerciseRow key={exercise.id} exercise={exercise} workoutId={workoutId} dayId={day.id} />
      ))}
```

with:

```tsx
      {day.exercises.map((exercise, index) => (
        <ExerciseRow
          key={exercise.id}
          exercise={exercise}
          workoutId={workoutId}
          dayId={day.id}
          isFirst={index === 0}
          isLast={index === day.exercises.length - 1}
          onMove={moveExercise}
        />
      ))}
```

- [ ] **Step 5: Add the disabled-link style**

In the `StyleSheet.create` call, replace:

```tsx
  exerciseDeleteLink: { fontSize: 12, color: "red" },
```

with:

```tsx
  exerciseDeleteLink: { fontSize: 12, color: "red" },
  exerciseActionDisabled: { color: "#ccc" },
```

- [ ] **Step 6: Typecheck**

Run: `pnpm --filter @trainflow/mobile exec tsc --noEmit`
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add "apps/mobile/src/app/(app)/workouts/[id].tsx"
git commit -m "feat(mobile): add exercise reorder up/down actions"
```

---

### Task 7: README status and manual verification checklist

**Files:**
- Modify: `apps/mobile/README.md`

**Interfaces:** none (documentation only).

- [ ] **Step 1: Update the status paragraph**

In `apps/mobile/README.md` (line 5), replace:

```markdown
**Status: Phase 1 in progress.** Sign-in, a read-only trainer dashboard, read-only clients screens (list + detail), a read-only exercise library list, workout program create/edit/delete (metadata), and day-level create/edit/delete/reorder within a program are wired up. Exercises within a day are still read-only — no exercise editing yet. No invite/edit/delete for clients, no search or filtering anywhere yet. Until this app reaches parity with the trainer-priority screens, `apps/mobile-capacitor` (the Capacitor WebView shell) remains the App Store / Play Store submission path — do not delete it.
```

with:

```markdown
**Status: Phase 1 in progress.** Sign-in, a read-only trainer dashboard, read-only clients screens (list + detail), a read-only exercise library list, workout program create/edit/delete (metadata), day-level create/edit/delete/reorder, and exercise-level create/edit/delete/reorder within a day are wired up. Adding an exercise picks from the existing library only (no inline custom-exercise creation, no moving an exercise between days). No invite/edit/delete for clients, no search or filtering outside the exercise picker. Until this app reaches parity with the trainer-priority screens, `apps/mobile-capacitor` (the Capacitor WebView shell) remains the App Store / Play Store submission path — do not delete it.
```

- [ ] **Step 2: Append checklist items**

Append these items to the end of the "Manual verification checklist" section (keep all existing items above them):

```markdown
- [ ] "Add exercise" on a day opens the library picker; typing in the search field filters the list by name
- [ ] Tapping a library exercise adds it to the day with default values (3 sets, 8–12 reps, 90s rest, Standard sets) and returns to the program detail screen
- [ ] "Edit" on an exercise opens the form pre-filled with its current core-field values (sets, rep range, weight, weight unit, rest, method)
- [ ] Submitting the edit form with rep max less than rep min shows an inline error and does not submit
- [ ] Saving an edited exercise reflects the new values on the detail screen, not stale data
- [ ] "Delete" on an exercise shows a native confirm dialog; canceling leaves it untouched; confirming removes it from the day
- [ ] Up/Down reorder buttons change an exercise's position within its day and persist across a screen refresh; the first exercise's Up button and the last exercise's Down button are disabled/absent
- [ ] Rapidly tapping Up or Down multiple times on an exercise moves it the expected number of positions, not fewer
- [ ] Killing network on add/edit/delete/reorder shows the inline error state, not a crash or a silently-lost action
```

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/README.md
git commit -m "docs(mobile): update status and verification checklist for workout-exercises slice"
```
