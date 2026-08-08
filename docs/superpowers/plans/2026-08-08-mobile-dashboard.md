# Mobile Dashboard (Phase 1, slice 1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the placeholder Home screen in `apps/mobile` with a real trainer dashboard: client/program/active-program stats, a recent-programs list, and a clients list — read-only, mirroring `apps/web/src/app/(trainer)/dashboard/page.tsx`'s data slice without tap-through or create actions.

**Architecture:** Add a `useClients()` query hook alongside the existing `useWorkouts()` hook, both backed by the shared `apiFetch` Bearer-token client. Rewrite `src/app/(app)/index.tsx` to consume both hooks, derive three stats client-side, and render three sections with independent loading/error handling per hook.

**Tech Stack:** Expo SDK 57, React Native 0.86, TanStack Query 5, Clerk (`@clerk/expo`), `@trainflow/shared-types` (Zod-derived `ClientDto`), Jest + jest-expo.

## Global Constraints

- No tap-through on any row (workout-detail and client-detail screens don't exist yet).
- No header action buttons ("New client" / "New workout" — no create screens exist yet).
- Bare `View`/`Text`/`StyleSheet` styling only, matching existing screens — no design system.
- Slice sizes match web: first 8 workouts, first 8 clients.
- Read spec at `docs/superpowers/specs/2026-08-08-mobile-dashboard-design.md` for full rationale before starting.

---

### Task 1: `useClients` query hook

**Files:**
- Create: `apps/mobile/src/lib/queries/clients.ts`
- Test: none (matches existing `useWorkouts`, which is also untested — no hook-testing setup in this package yet; see spec's Testing section)

**Interfaces:**
- Consumes: `apiFetch<T>(path: string, token: string | null): Promise<T>` from `apps/mobile/src/lib/api.ts`; `ClientDto` from `@trainflow/shared-types` (`packages/shared-types/src/clients.ts`); `useAuth` from `@clerk/expo`.
- Produces: `useClients()` — a TanStack Query hook returning `{ data: ClientDto[] | undefined, isLoading: boolean, error: unknown }`, query key `["clients"]`.

- [ ] **Step 1: Write the hook**

```typescript
// apps/mobile/src/lib/queries/clients.ts
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/expo";
import type { ClientDto } from "@trainflow/shared-types";
import { apiFetch } from "@/lib/api";

export function useClients() {
  const { getToken } = useAuth();
  return useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const token = await getToken();
      return apiFetch<ClientDto[]>("/api/clients", token);
    },
  });
}
```

- [ ] **Step 2: Typecheck**

Run: `pnpm --filter @trainflow/mobile exec tsc --noEmit`
Expected: no new errors from this file (existing baseline errors, if any, are unrelated — compare against a run on `main` before this task if unsure).

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/src/lib/queries/clients.ts
git commit -m "feat(mobile): add useClients query hook"
```

---

### Task 2: Dashboard screen

**Files:**
- Modify: `apps/mobile/src/app/(app)/index.tsx` (full rewrite — currently the placeholder Home screen)

**Interfaces:**
- Consumes: `useWorkouts()` from `apps/mobile/src/lib/queries/workouts.ts` (produces `{ data: WorkoutSummary[] | undefined, isLoading, error }`, `WorkoutSummary = { id: string; name: string; status: "DRAFT" | "ACTIVE" | "ARCHIVED" }`); `useClients()` from Task 1 (produces `{ data: ClientDto[] | undefined, isLoading, error }`, `ClientDto.status: "PENDING" | "ACTIVE" | "INACTIVE"`, `ClientDto.name: string`, `ClientDto.id: string`); `useAuth`, `useUser` from `@clerk/expo`.
- Produces: default-exported `HomeScreen` React component (route stays `(app)/index.tsx`, no route rename).

- [ ] **Step 1: Write the screen**

```tsx
// apps/mobile/src/app/(app)/index.tsx
import { View, Text, FlatList, ActivityIndicator, Button, StyleSheet } from "react-native";
import { useAuth, useUser } from "@clerk/expo";
import { useWorkouts } from "@/lib/queries/workouts";
import { useClients } from "@/lib/queries/clients";

export default function HomeScreen() {
  const { signOut } = useAuth();
  const { user } = useUser();
  const workouts = useWorkouts();
  const clients = useClients();

  const recentWorkouts = (workouts.data ?? []).slice(0, 8);
  const recentClients = (clients.data ?? []).slice(0, 8);
  const activeCount = (workouts.data ?? []).filter((w) => w.status === "ACTIVE").length;

  const isLoading = workouts.isLoading || clients.isLoading;

  return (
    <View style={styles.screen}>
      <Text style={styles.greeting}>
        Hi {user?.firstName ?? user?.primaryEmailAddress?.emailAddress}
      </Text>

      {isLoading ? <ActivityIndicator /> : null}

      <View style={styles.statRow}>
        <View style={styles.statBlock}>
          <Text style={styles.statLabel}>Clients</Text>
          <Text style={styles.statValue}>
            {clients.error ? "—" : clients.data?.length ?? 0}
          </Text>
          {clients.error ? (
            <Text style={styles.errorText}>{(clients.error as Error).message}</Text>
          ) : null}
        </View>
        <View style={styles.statBlock}>
          <Text style={styles.statLabel}>Programs</Text>
          <Text style={styles.statValue}>
            {workouts.error ? "—" : workouts.data?.length ?? 0}
          </Text>
          {workouts.error ? (
            <Text style={styles.errorText}>{(workouts.error as Error).message}</Text>
          ) : null}
        </View>
        <View style={styles.statBlock}>
          <Text style={styles.statLabel}>Active</Text>
          <Text style={styles.statValue}>{workouts.error ? "—" : activeCount}</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Recent programs</Text>
      <FlatList
        data={recentWorkouts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Text>
            {item.name} — {item.status}
          </Text>
        )}
        ListEmptyComponent={!workouts.isLoading ? <Text>No workouts yet.</Text> : null}
      />

      <Text style={styles.sectionTitle}>Clients</Text>
      <FlatList
        data={recentClients}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Text>
            {item.name} — {item.status}
          </Text>
        )}
        ListEmptyComponent={!clients.isLoading ? <Text>No clients yet.</Text> : null}
      />

      <Button title="Sign out" onPress={() => signOut()} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 24, gap: 12 },
  greeting: { fontSize: 20, fontWeight: "600" },
  statRow: { flexDirection: "row", gap: 16 },
  statBlock: { flex: 1 },
  statLabel: { fontSize: 13, color: "#666" },
  statValue: { fontSize: 24, fontWeight: "700" },
  errorText: { fontSize: 11, color: "red" },
  sectionTitle: { fontSize: 16, fontWeight: "600", marginTop: 8 },
});
```

- [ ] **Step 2: Typecheck**

Run: `pnpm --filter @trainflow/mobile exec tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Run the existing unit test suite (regression check)**

Run: `pnpm --filter @trainflow/mobile exec jest`
Expected: all existing tests still pass (`api.test.ts`, `sharedTypes.test.ts`) — this task doesn't touch either file, so this is a pure regression check.

- [ ] **Step 4: Commit**

```bash
git add "apps/mobile/src/app/(app)/index.tsx"
git commit -m "feat(mobile): build trainer dashboard screen with client/program stats"
```

---

### Task 3: README manual verification checklist

**Files:**
- Modify: `apps/mobile/README.md`

**Interfaces:** none (documentation only).

- [ ] **Step 1: Replace the status line and extend the checklist**

In `apps/mobile/README.md`, update the `**Status: Phase 0 (scaffold).**` paragraph and the manual verification checklist. Replace the existing status paragraph with:

```markdown
**Status: Phase 1 in progress.** Sign-in and a read-only trainer dashboard (client/program stats, recent programs, clients) are wired up. The dashboard has no tap-through to workout/client detail and no create actions yet — those, plus the exercise library and workout builder, are follow-up slices. Until this app reaches parity with the trainer-priority screens, `apps/mobile-capacitor` (the Capacitor WebView shell) remains the App Store / Play Store submission path — do not delete it.
```

Append these items to the existing "Manual verification checklist" section (keep the Phase 0 items above them):

```markdown
- [ ] Dashboard shows client count, program count, and active-program count matching what the same trainer sees on web
- [ ] Recent programs list shows the same programs as web's dashboard (or "No workouts yet." if empty)
- [ ] Clients list shows the same clients as web's dashboard (or "No clients yet." if empty)
- [ ] Killing network / forcing a 401 shows the inline error state on the relevant stat, not a crash
```

- [ ] **Step 2: Commit**

```bash
git add apps/mobile/README.md
git commit -m "docs(mobile): update status and verification checklist for dashboard slice"
```
