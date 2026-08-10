# Mobile Workout Builder — Program Shell (Phase 1, slice 5) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add create/edit/delete for a workout program's top-level metadata (not days/exercises) to `apps/mobile` — a shared form component, three mutation hooks, two new screens, and entry points from the client detail and workout detail screens.

**Architecture:** A single `ProgramForm` component (new `apps/mobile/src/components/workouts/` directory — this app's first shared, non-screen component) owns field state and validates against the existing `createWorkoutSchema`/`updateWorkoutSchema` from `@trainflow/shared-types` before calling a screen-supplied `onSubmit`. Three new TanStack `useMutation` hooks (`useCreateWorkout`, `useUpdateWorkout`, `useDeleteWorkout`) wrap `apiFetch` with POST/PATCH/DELETE and invalidate the `["workouts"]` query-key prefix on success, so the list/detail screens from the prior slice refetch automatically. `apiFetch` gets one small fix: it currently assumes every response has a JSON body, but `DELETE /api/workouts/:id` returns `204 No Content`.

**Tech Stack:** Expo SDK 57, Expo Router 57 (file-based, flat route registration in `(app)/_layout.tsx`), React Native 0.86, TanStack Query 5, Zod (via `@trainflow/shared-types`), Clerk (`@clerk/expo`).

## Global Constraints

- Program-shell CRUD only: no day/exercise editing, no client picker (clientId comes from the launching screen), no date-picker package (plain `YYYY-MM-DD` text inputs), no duplicate/from-template/export.
- Status is not shown/editable in create mode (server always creates `DRAFT`, ignoring any `status` sent) — only in edit mode.
- Delete requires a native `Alert.alert` confirmation before the mutation fires — the only destructive action in this slice.
- `isPending` (not `isLoading`) gates loading states; inline `Text` for all errors — no toast/snackbar library.
- Bare `View`/`Text`/`TextInput`/`Pressable`/`StyleSheet` only — no design system, no new npm dependencies beyond what's already installed.
- `.expo/` (gitignored) won't exist in a fresh worktree, so `Href` typing is permissive there — plain template-string route paths (`` `/workouts/${id}/edit` ``) typecheck fine without casts. This stops being true after merging into a main checkout with a stale `.expo/` — see the prior slice's documented fix (`rm -rf apps/mobile/.expo`, briefly run `npx expo start` until "Waiting on http://localhost:8081", stop it, re-run typecheck) if that happens at merge time; it is not part of this plan's tasks.
- Read spec at `docs/superpowers/specs/2026-08-10-mobile-workout-builder-design.md` for full rationale before starting.

---

### Task 1: Fix `apiFetch` to handle `204 No Content`

**Files:**
- Modify: `apps/mobile/src/lib/api.ts`
- Test: `apps/mobile/src/lib/__tests__/api.test.ts`

**Interfaces:**
- Consumes: nothing new.
- Produces: `apiFetch<T>(path, token, init?)` now returns `undefined as T` for a `204` response instead of calling `res.json()` (which throws `SyntaxError` on an empty body). Every later task's `useDeleteWorkout` hook (Task 2) relies on this.

- [ ] **Step 1: Write the failing test**

Add to `apps/mobile/src/lib/__tests__/api.test.ts` (new `describe` block, appended after the existing `buildApiRequest` block):

```typescript
import { apiFetch, buildApiRequest, getApiUrl } from "../api";

describe("apiFetch", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("returns undefined for a 204 No Content response instead of throwing on an empty body", async () => {
    global.fetch = jest.fn().mockResolvedValue(
      new Response(null, { status: 204 }),
    ) as unknown as typeof fetch;

    const result = await apiFetch<undefined>("/api/workouts/abc", null, {
      method: "DELETE",
    });

    expect(result).toBeUndefined();
  });

  it("still parses a JSON body for a normal 200 response", async () => {
    global.fetch = jest.fn().mockResolvedValue(
      new Response(JSON.stringify({ id: "abc" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    ) as unknown as typeof fetch;

    const result = await apiFetch<{ id: string }>("/api/workouts", null);

    expect(result).toEqual({ id: "abc" });
  });
});
```

Update the file's top import line from:

```typescript
import { buildApiRequest, getApiUrl } from "../api";
```

to:

```typescript
import { apiFetch, buildApiRequest, getApiUrl } from "../api";
```

- [ ] **Step 2: Run tests to verify the first one fails**

Run: `pnpm --filter @trainflow/mobile exec jest api.test.ts`
Expected: the "returns undefined for a 204" test FAILS with a `SyntaxError` (something like "Unexpected end of JSON input") thrown from inside `apiFetch`'s unconditional `res.json()` call. The second new test passes already (200 path is unchanged).

- [ ] **Step 3: Apply the fix**

In `apps/mobile/src/lib/api.ts`, replace the `apiFetch` function body:

```typescript
export async function apiFetch<T>(
  path: string,
  token: string | null,
  init?: RequestInit,
): Promise<T> {
  const { url, init: requestInit } = buildApiRequest(path, token, init);
  const res = await fetch(url, requestInit);
  if (!res.ok) {
    throw new Error(`API ${path} failed: ${res.status}`);
  }
  return (await res.json()) as T;
}
```

with:

```typescript
export async function apiFetch<T>(
  path: string,
  token: string | null,
  init?: RequestInit,
): Promise<T> {
  const { url, init: requestInit } = buildApiRequest(path, token, init);
  const res = await fetch(url, requestInit);
  if (!res.ok) {
    throw new Error(`API ${path} failed: ${res.status}`);
  }
  if (res.status === 204) {
    return undefined as T;
  }
  return (await res.json()) as T;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm --filter @trainflow/mobile exec jest api.test.ts`
Expected: PASS, all tests in the file green (5 pre-existing + 2 new = 7).

- [ ] **Step 5: Run the full suite and typecheck**

Run: `pnpm --filter @trainflow/mobile exec jest`
Expected: 3 suites, 7 tests, all passing.

Run: `pnpm --filter @trainflow/mobile exec tsc --noEmit`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add apps/mobile/src/lib/api.ts apps/mobile/src/lib/__tests__/api.test.ts
git commit -m "fix(mobile): handle 204 No Content responses in apiFetch"
```

---

### Task 2: Workout mutation hooks

**Files:**
- Create: `apps/mobile/src/lib/queries/workoutMutations.ts`
- Test: none — matches the existing untested-hook convention (`useWorkouts`, `useWorkout`, `useClients`, `useExercises`).

**Interfaces:**
- Consumes: `apiFetch<T>` from `apps/mobile/src/lib/api.ts` (Task 1's fix makes the delete hook below safe); `queryClient` singleton from `apps/mobile/src/lib/queryClient.ts` (already used directly, not via `useQueryClient()`, by `apps/mobile/src/app/(app)/index.tsx`'s sign-out handler); `useAuth` from `@clerk/expo`; `CreateWorkoutInput`, `UpdateWorkoutInput`, `WorkoutProgramDto` from `@trainflow/shared-types`.
- Produces: `useCreateWorkout()` — `useMutation` hook, `mutationFn: (input: CreateWorkoutInput) => Promise<WorkoutProgramDto>`. `useUpdateWorkout(id: string)` — `mutationFn: (input: UpdateWorkoutInput) => Promise<WorkoutProgramDto>`. `useDeleteWorkout(id: string)` — `mutationFn: () => Promise<undefined>`. All three invalidate `queryKey: ["workouts"]` (prefix match, covers the list/client-scoped-list/detail caches from the prior slice) `onSuccess`. Consumed by Task 4 (create screen), Task 5 (edit screen), Task 6 (delete button on detail screen).

- [ ] **Step 1: Write the hooks file**

Full contents of `apps/mobile/src/lib/queries/workoutMutations.ts`:

```typescript
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@clerk/expo";
import type {
  CreateWorkoutInput,
  UpdateWorkoutInput,
  WorkoutProgramDto,
} from "@trainflow/shared-types";
import { apiFetch } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";

export function useCreateWorkout() {
  const { getToken } = useAuth();
  return useMutation({
    mutationFn: async (input: CreateWorkoutInput) => {
      const token = await getToken();
      return apiFetch<WorkoutProgramDto>("/api/workouts", token, {
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

export function useUpdateWorkout(id: string) {
  const { getToken } = useAuth();
  return useMutation({
    mutationFn: async (input: UpdateWorkoutInput) => {
      const token = await getToken();
      return apiFetch<WorkoutProgramDto>(`/api/workouts/${id}`, token, {
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

export function useDeleteWorkout(id: string) {
  const { getToken } = useAuth();
  return useMutation({
    mutationFn: async () => {
      const token = await getToken();
      return apiFetch<undefined>(`/api/workouts/${id}`, token, {
        method: "DELETE",
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
git add apps/mobile/src/lib/queries/workoutMutations.ts
git commit -m "feat(mobile): add workout create/update/delete mutation hooks"
```

---

### Task 3: `ProgramForm` shared component

**Files:**
- Create: `apps/mobile/src/components/workouts/ProgramForm.tsx`
- Test: none — this is a form component with no existing component-testing setup in this app (no `@testing-library/react-native` installed); matches the untested-UI convention used by every screen so far. Its validation logic is exercised indirectly through the existing, already-tested `createWorkoutSchema`/`updateWorkoutSchema` in `@trainflow/shared-types`.

**Interfaces:**
- Consumes: `createWorkoutSchema`, `updateWorkoutSchema` from `@trainflow/shared-types`.
- Produces: `ProgramForm` component and `ProgramFormValues` type — `{ name: string; goal: string | null; startDate: string; endDate: string | null; daysPerWeek: number; level: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | null; location: string | null; equipment: string | null; observations: string | null; status: "DRAFT" | "ACTIVE" | "ARCHIVED" }`. Props: `mode: "create" | "edit"`, `initialValues?: Partial<ProgramFormValues>`, `clientId?: string` (required in practice for `mode="create"` — used only to satisfy `createWorkoutSchema`'s required `clientId` during validation, never rendered as a field), `submitLabel: string`, `onSubmit: (values: ProgramFormValues) => Promise<void>`. Consumed by Task 4 (`mode="create"`) and Task 5 (`mode="edit"`).

- [ ] **Step 1: Write the component**

Full contents of `apps/mobile/src/components/workouts/ProgramForm.tsx`:

```tsx
import { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet } from "react-native";
import { createWorkoutSchema, updateWorkoutSchema } from "@trainflow/shared-types";

export type ProgramFormValues = {
  name: string;
  goal: string | null;
  startDate: string;
  endDate: string | null;
  daysPerWeek: number;
  level: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | null;
  location: string | null;
  equipment: string | null;
  observations: string | null;
  status: "DRAFT" | "ACTIVE" | "ARCHIVED";
};

type FieldState = {
  name: string;
  goal: string;
  startDate: string;
  endDate: string;
  daysPerWeek: string;
  level: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | null;
  location: string;
  equipment: string;
  observations: string;
  status: "DRAFT" | "ACTIVE" | "ARCHIVED";
};

function toFieldState(initial: Partial<ProgramFormValues> | undefined): FieldState {
  return {
    name: initial?.name ?? "",
    goal: initial?.goal ?? "",
    startDate: initial?.startDate ?? "",
    endDate: initial?.endDate ?? "",
    daysPerWeek: initial?.daysPerWeek != null ? String(initial.daysPerWeek) : "",
    level: initial?.level ?? null,
    location: initial?.location ?? "",
    equipment: initial?.equipment ?? "",
    observations: initial?.observations ?? "",
    status: initial?.status ?? "DRAFT",
  };
}

function buildPayload(state: FieldState): ProgramFormValues {
  return {
    name: state.name,
    goal: state.goal.trim() === "" ? null : state.goal,
    startDate: state.startDate,
    endDate: state.endDate.trim() === "" ? null : state.endDate,
    daysPerWeek: state.daysPerWeek.trim() === "" ? NaN : Number(state.daysPerWeek),
    level: state.level,
    location: state.location.trim() === "" ? null : state.location,
    equipment: state.equipment.trim() === "" ? null : state.equipment,
    observations: state.observations.trim() === "" ? null : state.observations,
    status: state.status,
  };
}

const LEVEL_OPTIONS: { value: "BEGINNER" | "INTERMEDIATE" | "ADVANCED"; label: string }[] = [
  { value: "BEGINNER", label: "Beginner" },
  { value: "INTERMEDIATE", label: "Intermediate" },
  { value: "ADVANCED", label: "Advanced" },
];

const STATUS_OPTIONS: { value: "DRAFT" | "ACTIVE" | "ARCHIVED"; label: string }[] = [
  { value: "DRAFT", label: "Draft" },
  { value: "ACTIVE", label: "Active" },
  { value: "ARCHIVED", label: "Archived" },
];

function ToggleRow<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T | null;
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

export function ProgramForm({
  mode,
  initialValues,
  clientId,
  submitLabel,
  onSubmit,
}: {
  mode: "create" | "edit";
  initialValues?: Partial<ProgramFormValues>;
  clientId?: string;
  submitLabel: string;
  onSubmit: (values: ProgramFormValues) => Promise<void>;
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
    const result =
      mode === "create"
        ? createWorkoutSchema.safeParse({ ...payload, clientId })
        : updateWorkoutSchema.safeParse(payload);

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

      <Text style={styles.label}>Goal</Text>
      <TextInput style={styles.input} value={state.goal} onChangeText={(v) => update("goal", v)} />
      {fieldErrors.goal ? <Text style={styles.fieldError}>{fieldErrors.goal}</Text> : null}

      <Text style={styles.label}>Start date (YYYY-MM-DD)</Text>
      <TextInput
        style={styles.input}
        value={state.startDate}
        onChangeText={(v) => update("startDate", v)}
        placeholder="YYYY-MM-DD"
      />
      {fieldErrors.startDate ? <Text style={styles.fieldError}>{fieldErrors.startDate}</Text> : null}

      <Text style={styles.label}>End date (YYYY-MM-DD)</Text>
      <TextInput
        style={styles.input}
        value={state.endDate}
        onChangeText={(v) => update("endDate", v)}
        placeholder="YYYY-MM-DD"
      />
      {fieldErrors.endDate ? <Text style={styles.fieldError}>{fieldErrors.endDate}</Text> : null}

      <Text style={styles.label}>Days per week</Text>
      <TextInput
        style={styles.input}
        value={state.daysPerWeek}
        onChangeText={(v) => update("daysPerWeek", v)}
        keyboardType="number-pad"
      />
      {fieldErrors.daysPerWeek ? <Text style={styles.fieldError}>{fieldErrors.daysPerWeek}</Text> : null}

      <Text style={styles.label}>Level</Text>
      <ToggleRow options={LEVEL_OPTIONS} value={state.level} onChange={(v) => update("level", v)} />

      <Text style={styles.label}>Location</Text>
      <TextInput style={styles.input} value={state.location} onChangeText={(v) => update("location", v)} />

      <Text style={styles.label}>Equipment</Text>
      <TextInput style={styles.input} value={state.equipment} onChangeText={(v) => update("equipment", v)} />

      <Text style={styles.label}>Observations</Text>
      <TextInput
        style={[styles.input, styles.multiline]}
        value={state.observations}
        onChangeText={(v) => update("observations", v)}
        multiline
      />

      {mode === "edit" ? (
        <>
          <Text style={styles.label}>Status</Text>
          <ToggleRow options={STATUS_OPTIONS} value={state.status} onChange={(v) => update("status", v)} />
        </>
      ) : null}

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
  toggleRow: { flexDirection: "row", gap: 8 },
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
git add apps/mobile/src/components/workouts/ProgramForm.tsx
git commit -m "feat(mobile): add shared ProgramForm component"
```

---

### Task 4: "New program" create screen

**Files:**
- Create: `apps/mobile/src/app/(app)/workouts/new.tsx`
- Modify: `apps/mobile/src/app/(app)/_layout.tsx`

**Interfaces:**
- Consumes: `ProgramForm`, `ProgramFormValues` from Task 3; `useCreateWorkout` from Task 2 (`mutateAsync(input: CreateWorkoutInput): Promise<WorkoutProgramDto>`).
- Produces: default-exported `NewWorkoutScreen` at route `/workouts/new`, reading a `clientId` query param.

- [ ] **Step 1: Write the screen**

Full contents of `apps/mobile/src/app/(app)/workouts/new.tsx`:

```tsx
import { ScrollView, StyleSheet } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ProgramForm, type ProgramFormValues } from "@/components/workouts/ProgramForm";
import { useCreateWorkout } from "@/lib/queries/workoutMutations";

export default function NewWorkoutScreen() {
  const { clientId } = useLocalSearchParams<{ clientId: string }>();
  const router = useRouter();
  const createWorkout = useCreateWorkout();

  async function handleSubmit(values: ProgramFormValues) {
    const result = await createWorkout.mutateAsync({ ...values, clientId });
    router.replace(`/workouts/${result.id}`);
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <ProgramForm mode="create" clientId={clientId} submitLabel="Create program" onSubmit={handleSubmit} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 24 },
  content: { paddingBottom: 40 },
});
```

- [ ] **Step 2: Register the route**

In `apps/mobile/src/app/(app)/_layout.tsx`, add one line inside the existing `<Stack>`, after the `workouts/[id]` screen:

```tsx
      <Stack.Screen name="workouts/new" options={{ headerShown: true, title: "New Program" }} />
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
    </Stack>
  );
}
```

- [ ] **Step 3: Typecheck**

Run: `pnpm --filter @trainflow/mobile exec tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add "apps/mobile/src/app/(app)/workouts/new.tsx" "apps/mobile/src/app/(app)/_layout.tsx"
git commit -m "feat(mobile): add new-program create screen"
```

---

### Task 5: "Edit program" screen

**Files:**
- Create: `apps/mobile/src/app/(app)/workouts/[id]/edit.tsx`
- Modify: `apps/mobile/src/app/(app)/_layout.tsx`

**Interfaces:**
- Consumes: `useWorkout(id)` from `apps/mobile/src/lib/queries/workouts.ts` (existing, from the prior slice — returns `{ data: WorkoutProgramDto | undefined, isPending: boolean, error: unknown }`); `ProgramForm`, `ProgramFormValues` from Task 3; `useUpdateWorkout` from Task 2 (`mutateAsync(input: UpdateWorkoutInput): Promise<WorkoutProgramDto>`).
- Produces: default-exported `EditWorkoutScreen` at route `/workouts/[id]/edit`.

- [ ] **Step 1: Write the screen**

Full contents of `apps/mobile/src/app/(app)/workouts/[id]/edit.tsx` (note the nested `[id]/edit.tsx` path — this creates route `/workouts/[id]/edit`, a sibling of the existing `/workouts/[id]` detail route, not a child layout):

```tsx
import { View, Text, ScrollView, ActivityIndicator, StyleSheet } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useWorkout } from "@/lib/queries/workouts";
import { useUpdateWorkout } from "@/lib/queries/workoutMutations";
import { ProgramForm, type ProgramFormValues } from "@/components/workouts/ProgramForm";

export default function EditWorkoutScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const workout = useWorkout(id);
  const updateWorkout = useUpdateWorkout(id);

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

  async function handleSubmit(values: ProgramFormValues) {
    await updateWorkout.mutateAsync(values);
    router.back();
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <ProgramForm
        mode="edit"
        submitLabel="Save changes"
        initialValues={{
          name: w.name,
          goal: w.goal,
          startDate: w.startDate.slice(0, 10),
          endDate: w.endDate ? w.endDate.slice(0, 10) : null,
          daysPerWeek: w.daysPerWeek,
          level: w.level,
          location: w.location,
          equipment: w.equipment,
          observations: w.observations,
          status: w.status,
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

In `apps/mobile/src/app/(app)/_layout.tsx`, add one line inside the existing `<Stack>`, after the `workouts/new` screen added in Task 4:

```tsx
      <Stack.Screen name="workouts/[id]/edit" options={{ headerShown: true, title: "Edit Program" }} />
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
    </Stack>
  );
}
```

- [ ] **Step 3: Typecheck**

Run: `pnpm --filter @trainflow/mobile exec tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add "apps/mobile/src/app/(app)/workouts/[id]/edit.tsx" "apps/mobile/src/app/(app)/_layout.tsx"
git commit -m "feat(mobile): add edit-program screen"
```

---

### Task 6: Edit/Delete buttons on the workout detail screen

**Files:**
- Modify: `apps/mobile/src/app/(app)/workouts/[id].tsx`

**Interfaces:**
- Consumes: `useDeleteWorkout` from Task 2 (`mutateAsync(): Promise<undefined>`); `useRouter` from `expo-router`; `Alert` from `react-native`.
- Produces: no new exports — `WorkoutDetailScreen` gains an action row (Edit link + Delete link with confirm) and a delete-error banner.

- [ ] **Step 1: Update imports**

In `apps/mobile/src/app/(app)/workouts/[id].tsx`, replace the top of the file:

```tsx
import { View, Text, ScrollView, ActivityIndicator, StyleSheet } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useWorkout } from "@/lib/queries/workouts";
import { formatRepRange, formatRest, formatWeight, emptyDisplay } from "@trainflow/workout-math";
import type { WorkoutDayDto, WorkoutExerciseDto } from "@trainflow/shared-types";
```

with:

```tsx
import { useState } from "react";
import { View, Text, ScrollView, ActivityIndicator, Pressable, Alert, StyleSheet } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useWorkout } from "@/lib/queries/workouts";
import { useDeleteWorkout } from "@/lib/queries/workoutMutations";
import { formatRepRange, formatRest, formatWeight, emptyDisplay } from "@trainflow/workout-math";
import type { WorkoutDayDto, WorkoutExerciseDto } from "@trainflow/shared-types";
```

- [ ] **Step 2: Add router/mutation/state and the action row**

Inside `WorkoutDetailScreen`, immediately after the existing `const workout = useWorkout(id);` line, add:

```tsx
  const router = useRouter();
  const deleteWorkout = useDeleteWorkout(id);
  const [deleteError, setDeleteError] = useState<string | null>(null);
```

Then replace this block (the two lines rendering name and status, right after `const w = workout.data;`):

```tsx
      <Text style={styles.name}>{w.name}</Text>
      <Text style={styles.status}>{w.status}</Text>
```

with:

```tsx
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
```

- [ ] **Step 3: Add the new styles**

Add two entries to the existing `StyleSheet.create` call in the same file, alongside `status`:

```tsx
  actionRow: { flexDirection: "row", gap: 16, marginBottom: 8 },
  actionLink: { fontSize: 14, color: "#0066cc" },
  deleteLink: { fontSize: 14, color: "red" },
```

- [ ] **Step 4: Typecheck**

Run: `pnpm --filter @trainflow/mobile exec tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Run the existing unit test suite (regression check)**

Run: `pnpm --filter @trainflow/mobile exec jest`
Expected: all tests still pass (this task doesn't touch any tested file).

- [ ] **Step 6: Commit**

```bash
git add "apps/mobile/src/app/(app)/workouts/[id].tsx"
git commit -m "feat(mobile): add edit/delete actions to workout detail screen"
```

---

### Task 7: "New program" link on the client detail screen

**Files:**
- Modify: `apps/mobile/src/app/(app)/clients/[id].tsx`

**Interfaces:**
- Consumes: existing `router` (`useRouter()`, already declared in this file from the prior slice's Programs section).
- Produces: no new exports — `ClientDetailScreen` gains a plain-text "New program" link.

- [ ] **Step 1: Add the link**

In `apps/mobile/src/app/(app)/clients/[id].tsx`, replace this line:

```tsx
      <Text style={styles.sectionTitle}>Programs</Text>
```

with:

```tsx
      <Text style={styles.sectionTitle}>Programs</Text>
      <Pressable onPress={() => router.push(`/workouts/new?clientId=${id}`)}>
        <Text style={styles.link}>New program</Text>
      </Pressable>
```

`Pressable` and `router` are already imported/declared in this file (used by the Programs-section rows). No new imports needed.

Add one new style entry to the existing `StyleSheet.create` call in the same file, alongside `programRow`:

```tsx
  link: { fontSize: 15, color: "#0066cc", marginBottom: 4 },
```

- [ ] **Step 2: Typecheck**

Run: `pnpm --filter @trainflow/mobile exec tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add "apps/mobile/src/app/(app)/clients/[id].tsx"
git commit -m "feat(mobile): add new-program link to client detail"
```

---

### Task 8: README status and manual verification checklist

**Files:**
- Modify: `apps/mobile/README.md`

**Interfaces:** none (documentation only).

- [ ] **Step 1: Update the status paragraph**

Replace the current status paragraph (line 5):

```markdown
**Status: Phase 1 in progress.** Sign-in, a read-only trainer dashboard, read-only clients screens (list + detail), a read-only exercise library list, and a read-only workout program detail screen (with tap-through from the dashboard and from client detail) are wired up. No invite/create/edit/delete actions, search, or filtering yet. Until this app reaches parity with the trainer-priority screens, `apps/mobile-capacitor` (the Capacitor WebView shell) remains the App Store / Play Store submission path — do not delete it.
```

with:

```markdown
**Status: Phase 1 in progress.** Sign-in, a read-only trainer dashboard, read-only clients screens (list + detail), a read-only exercise library list, a workout program detail screen, and workout program create/edit/delete (metadata only — no day/exercise editing yet) are wired up. No invite/edit/delete for clients, no search or filtering anywhere yet. Until this app reaches parity with the trainer-priority screens, `apps/mobile-capacitor` (the Capacitor WebView shell) remains the App Store / Play Store submission path — do not delete it.
```

- [ ] **Step 2: Append checklist items**

Append these items to the end of the "Manual verification checklist" section (keep all existing items above them):

```markdown
- [ ] "New program" link on a client's detail screen opens the create form with that client implied (not shown/selectable in the form)
- [ ] Submitting the create form with a blank name shows an inline "required" error under the Name field and does not submit
- [ ] Submitting the create form with endDate before startDate shows an inline error and does not submit
- [ ] A successfully created program lands on that program's detail screen, status "DRAFT", and appears in the client's Programs list and the dashboard's Recent programs list
- [ ] "Edit" on a program's detail screen opens the edit form pre-filled with that program's current values, including status
- [ ] Changing a program's status to ACTIVE or ARCHIVED in the edit form and saving reflects the new status on the detail screen and everywhere else it's shown (client Programs list, dashboard)
- [ ] Saving the edit form returns to the detail screen showing the updated values, not stale data
- [ ] "Delete" on a program's detail screen shows a native confirm dialog; canceling leaves the program untouched
- [ ] Confirming delete removes the program and returns to that client's detail screen, where it no longer appears in the Programs list
- [ ] Killing network / forcing a failure on create, edit, or delete shows the inline error state, not a crash or a silently-lost action
```

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/README.md
git commit -m "docs(mobile): update status and verification checklist for workout builder slice"
```
