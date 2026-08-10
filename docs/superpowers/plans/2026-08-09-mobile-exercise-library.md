# Mobile Exercise Library (Phase 1, slice 3) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a read-only exercise library list screen to `apps/mobile`, and a plain-link entry point from the dashboard — mirroring the dashboard/clients slices' pattern of a TanStack Query hook plus a screen driven directly by its loading/error/empty state.

**Architecture:** Add a `useExercises()` query hook alongside the existing `useClients()`/`useWorkouts()` hooks, calling the already-existing `GET /api/exercises` endpoint with no query params (full trainer-scoped list: global library + custom). Add a new `(app)/exercises/` route group (nested `Stack` with header re-enabled, same shape as `(app)/clients/`) holding a single list screen — no detail screen, since web's own list row is already the full presentation. Add a plain text link on the dashboard navigating to `/exercises`.

**Tech Stack:** Expo SDK 57, Expo Router 57 (file-based, `typedRoutes` experiment on), React Native 0.86, TanStack Query 5, Clerk (`@clerk/expo`), `@trainflow/shared-types` (Zod-derived `ExerciseDto`).

## Global Constraints

- Read-only: no create/edit/delete actions.
- No search or muscle/category filtering on the list.
- No exercise detail screen.
- No dashboard stat tile for exercise count — a plain link only.
- Bare `View`/`Text`/`StyleSheet` styling only, matching existing screens — no design system.
- `app.json` has `typedRoutes: true`, but `.expo/` is gitignored and no generated route types exist in this working tree yet (produced the first time `expo start` runs). Until then `Href` typing is permissive, so plain template-string paths (`"/exercises"`) typecheck fine — do not add route casts or `as any` to work around a typing issue that doesn't currently exist.
- Read spec at `docs/superpowers/specs/2026-08-09-mobile-exercise-library-design.md` for full rationale before starting.

---

### Task 1: `useExercises` query hook

**Files:**
- Create: `apps/mobile/src/lib/queries/exercises.ts`
- Test: none (matches existing `useClients`/`useWorkouts`, both untested — no hook-testing setup in this package; see spec's Testing section)

**Interfaces:**
- Consumes: `apiFetch<T>(path: string, token: string | null): Promise<T>` from `apps/mobile/src/lib/api.ts`; `ExerciseDto` from `@trainflow/shared-types` (fields: `id: string; trainerId: string | null; name: string; primaryMuscle: string; secondaryMuscles: string[]; category: string; equipment: string; defaultInstructions: string; videoUrl: string | null; alternativeIds: string[]; createdAt: string; updatedAt: string`); `useAuth` from `@clerk/expo`.
- Produces: `useExercises()` — a TanStack Query hook returning `{ data: ExerciseDto[] | undefined, isPending: boolean, error: unknown }`, query key `["exercises"]`.

- [ ] **Step 1: Write the hook**

Full contents of `apps/mobile/src/lib/queries/exercises.ts`:

```typescript
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/expo";
import type { ExerciseDto } from "@trainflow/shared-types";
import { apiFetch } from "@/lib/api";

export function useExercises() {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  return useQuery({
    queryKey: ["exercises"],
    queryFn: async () => {
      const token = await getToken();
      return apiFetch<ExerciseDto[]>("/api/exercises", token);
    },
    enabled: isLoaded && isSignedIn,
  });
}
```

- [ ] **Step 2: Typecheck**

Run: `pnpm --filter @trainflow/mobile exec tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/src/lib/queries/exercises.ts
git commit -m "feat(mobile): add useExercises query hook"
```

---

### Task 2: Exercise library list screen

**Files:**
- Create: `apps/mobile/src/app/(app)/exercises/_layout.tsx`
- Create: `apps/mobile/src/app/(app)/exercises/index.tsx`

**Interfaces:**
- Consumes: `useExercises()` from Task 1 (produces `{ data: ExerciseDto[] | undefined, isPending: boolean, error: unknown }`).
- Produces: default-exported `ExercisesLayout` (nested `Stack`, re-enables the header the parent `(app)/_layout.tsx` turns off) and default-exported `ExercisesListScreen` at route `/exercises`.

- [ ] **Step 1: Write the nested layout**

```tsx
// apps/mobile/src/app/(app)/exercises/_layout.tsx
import { Stack } from "expo-router";

export default function ExercisesLayout() {
  return (
    <Stack screenOptions={{ headerShown: true }}>
      <Stack.Screen name="index" options={{ title: "Exercises" }} />
    </Stack>
  );
}
```

- [ ] **Step 2: Write the list screen**

```tsx
// apps/mobile/src/app/(app)/exercises/index.tsx
import { View, Text, FlatList, ActivityIndicator, Pressable, Linking, StyleSheet } from "react-native";
import { useExercises } from "@/lib/queries/exercises";
import type { ExerciseDto } from "@trainflow/shared-types";

function ExerciseRow({ exercise }: { exercise: ExerciseDto }) {
  return (
    <View style={styles.row}>
      <View style={styles.rowHeader}>
        <Text style={styles.name}>{exercise.name}</Text>
        <Text style={styles.badge}>{exercise.trainerId ? "Custom" : "Library"}</Text>
      </View>
      <Text style={styles.meta}>
        {exercise.primaryMuscle} · {exercise.category} · {exercise.equipment}
      </Text>
      {exercise.defaultInstructions ? (
        <Text style={styles.instructions} numberOfLines={2}>
          {exercise.defaultInstructions}
        </Text>
      ) : null}
      {exercise.videoUrl ? (
        <Pressable onPress={() => Linking.openURL(exercise.videoUrl as string)}>
          <Text style={styles.videoLink}>Video</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export default function ExercisesListScreen() {
  const exercises = useExercises();

  return (
    <View style={styles.screen}>
      {exercises.isPending ? <ActivityIndicator /> : null}
      {exercises.error ? (
        <Text style={styles.errorText}>{(exercises.error as Error).message}</Text>
      ) : null}
      <FlatList
        data={exercises.data ?? []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ExerciseRow exercise={item} />}
        ListEmptyComponent={
          !exercises.isPending && !exercises.error ? <Text>No exercises yet.</Text> : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 24, gap: 12 },
  row: {
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#ccc",
    gap: 4,
  },
  rowHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  name: { fontSize: 16, fontWeight: "600" },
  badge: {
    fontSize: 11,
    color: "#666",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#ccc",
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  meta: { fontSize: 13, color: "#666" },
  instructions: { fontSize: 13, color: "#444" },
  videoLink: { fontSize: 13, color: "#0066cc", textDecorationLine: "underline" },
  errorText: { fontSize: 13, color: "red" },
});
```

- [ ] **Step 3: Typecheck**

Run: `pnpm --filter @trainflow/mobile exec tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add "apps/mobile/src/app/(app)/exercises/_layout.tsx" "apps/mobile/src/app/(app)/exercises/index.tsx"
git commit -m "feat(mobile): add exercise library list screen"
```

---

### Task 3: Dashboard entry-point link

**Files:**
- Modify: `apps/mobile/src/app/(app)/index.tsx`

**Interfaces:**
- Consumes: existing `router` (`useRouter()` from `expo-router`, already imported and instantiated in this file by the clients slice).
- Produces: no new exports — `HomeScreen` gains a new `Pressable`/`Text` link with a navigation side effect.

- [ ] **Step 1: Add the "Exercise library" link**

In `apps/mobile/src/app/(app)/index.tsx`, insert this block immediately after the clients `FlatList` (which ends with its `ListEmptyComponent` closing `/>`), and immediately before the `Button` that signs out:

```tsx
      <Pressable style={styles.link} onPress={() => router.push("/exercises")}>
        <Text style={styles.linkText}>Exercise library</Text>
      </Pressable>
```

Add two new style entries to the existing `StyleSheet.create` call in the same file:

```tsx
  link: { marginTop: 8 },
  linkText: { fontSize: 15, color: "#0066cc" },
```

No new imports are needed — `Pressable` is already imported (used by the clients stat block and rows), and `router` is already declared via `useRouter()`.

- [ ] **Step 2: Typecheck**

Run: `pnpm --filter @trainflow/mobile exec tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Run the existing unit test suite (regression check)**

Run: `pnpm --filter @trainflow/mobile exec jest`
Expected: all existing tests still pass (`api.test.ts`, `sharedTypes.test.ts`) — this task doesn't touch either file, so this is a pure regression check.

- [ ] **Step 4: Commit**

```bash
git add "apps/mobile/src/app/(app)/index.tsx"
git commit -m "feat(mobile): wire dashboard link to exercise library"
```

---

### Task 4: README manual verification checklist

**Files:**
- Modify: `apps/mobile/README.md`

**Interfaces:** none (documentation only).

- [ ] **Step 1: Update the status paragraph and extend the checklist**

Replace the current `**Status: Phase 1 in progress.**` paragraph with:

```markdown
**Status: Phase 1 in progress.** Sign-in, a read-only trainer dashboard, read-only clients screens (list + detail), and a read-only exercise library list are wired up. No invite/create/edit/delete actions, search, or filtering yet — those, plus the workout builder, are follow-up slices. Until this app reaches parity with the trainer-priority screens, `apps/mobile-capacitor` (the Capacitor WebView shell) remains the App Store / Play Store submission path — do not delete it.
```

Append these items to the "Manual verification checklist" section (keep all existing items above them):

```markdown
- [ ] Exercise library link on the dashboard opens the exercises list
- [ ] Exercises list shows both global library and trainer-custom exercises, matching web's unfiltered `/exercises`
- [ ] Library vs Custom badge matches web's badge for the same exercise
- [ ] Tapping a video link opens the URL
- [ ] Exercises with no video link / no instructions render cleanly with those elements omitted, not blank space or "null"
- [ ] Killing network / forcing a 401 shows the inline error state, not a crash
```

- [ ] **Step 2: Commit**

```bash
git add apps/mobile/README.md
git commit -m "docs(mobile): update status and verification checklist for exercise library slice"
```
