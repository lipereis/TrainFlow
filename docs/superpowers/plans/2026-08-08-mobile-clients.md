# Mobile Clients (Phase 1, slice 2) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a read-only clients list screen and client detail screen to `apps/mobile`, and wire the dashboard's existing client rows/stat into them — closing the tap-through gap the dashboard slice deliberately deferred.

**Architecture:** Add a `useClient(clientId)` query hook alongside the existing `useClients()`/`useWorkouts()` hooks. Add a new `(app)/clients/` route group (nested `Stack` with header re-enabled) holding a list screen and a `[id]` detail screen, both driven by TanStack Query state the same way the dashboard is. Wrap the dashboard's client rows and "Clients" stat block in `Pressable` to navigate into the new screens.

**Tech Stack:** Expo SDK 57, Expo Router 57 (file-based, `typedRoutes` experiment on), React Native 0.86, TanStack Query 5, Clerk (`@clerk/expo`), `@trainflow/shared-types` (Zod-derived `ClientDto`).

## Global Constraints

- Read-only: no invite/create/edit/delete/resend-invite actions.
- No search or status filtering on the list.
- No per-client workout-programs list on the detail screen.
- Bare `View`/`Text`/`StyleSheet` styling only, matching existing screens — no design system.
- `app.json` has `typedRoutes: true`, but `.expo/` is gitignored and no generated route types exist in this working tree yet (they're produced the first time `expo start` runs). Until then `Href` typing is permissive, so plain template-string paths (`` `/clients/${id}` ``) typecheck fine — do not add route casts or `as any` to work around a typing issue that doesn't currently exist.
- Read spec at `docs/superpowers/specs/2026-08-08-mobile-clients-design.md` for full rationale before starting.

---

### Task 1: `useClient` query hook

**Files:**
- Modify: `apps/mobile/src/lib/queries/clients.ts`
- Test: none (matches existing `useClients`/`useWorkouts`, both untested — no hook-testing setup in this package; see spec's Testing section)

**Interfaces:**
- Consumes: `apiFetch<T>(path: string, token: string | null): Promise<T>` from `apps/mobile/src/lib/api.ts`; `ClientDto` from `@trainflow/shared-types`; `useAuth` from `@clerk/expo`.
- Produces: `useClient(clientId: string)` — a TanStack Query hook returning `{ data: ClientDto | undefined, isPending: boolean, error: unknown }`, query key `["clients", clientId]`.

- [ ] **Step 1: Add the hook**

Full contents of `apps/mobile/src/lib/queries/clients.ts` after this change:

```typescript
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/expo";
import type { ClientDto } from "@trainflow/shared-types";
import { apiFetch } from "@/lib/api";

export function useClients() {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  return useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const token = await getToken();
      return apiFetch<ClientDto[]>("/api/clients", token);
    },
    enabled: isLoaded && isSignedIn,
  });
}

export function useClient(clientId: string) {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  return useQuery({
    queryKey: ["clients", clientId],
    queryFn: async () => {
      const token = await getToken();
      return apiFetch<ClientDto>(`/api/clients/${clientId}`, token);
    },
    enabled: isLoaded && isSignedIn && !!clientId,
  });
}
```

- [ ] **Step 2: Typecheck**

Run: `pnpm --filter @trainflow/mobile exec tsc --noEmit`
Expected: no new errors from this file.

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/src/lib/queries/clients.ts
git commit -m "feat(mobile): add useClient query hook"
```

---

### Task 2: Clients list screen

**Files:**
- Create: `apps/mobile/src/app/(app)/clients/_layout.tsx`
- Create: `apps/mobile/src/app/(app)/clients/index.tsx`

**Interfaces:**
- Consumes: `useClients()` from `apps/mobile/src/lib/queries/clients.ts` (produces `{ data: ClientDto[] | undefined, isPending: boolean, error: unknown }`; `ClientDto = { id: string; name: string; email: string; status: "PENDING" | "ACTIVE" | "INACTIVE"; ... }`); `useRouter` from `expo-router`.
- Produces: default-exported `ClientsLayout` (nested `Stack`, re-enables the header the parent `(app)/_layout.tsx` turns off) and default-exported `ClientsListScreen` at route `/clients`.

- [ ] **Step 1: Write the nested layout**

```tsx
// apps/mobile/src/app/(app)/clients/_layout.tsx
import { Stack } from "expo-router";

export default function ClientsLayout() {
  return (
    <Stack screenOptions={{ headerShown: true }}>
      <Stack.Screen name="index" options={{ title: "Clients" }} />
      <Stack.Screen name="[id]" options={{ title: "Client" }} />
    </Stack>
  );
}
```

- [ ] **Step 2: Write the list screen**

```tsx
// apps/mobile/src/app/(app)/clients/index.tsx
import { View, Text, FlatList, ActivityIndicator, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useClients } from "@/lib/queries/clients";

export default function ClientsListScreen() {
  const router = useRouter();
  const clients = useClients();

  return (
    <View style={styles.screen}>
      {clients.isPending ? <ActivityIndicator /> : null}
      {clients.error ? (
        <Text style={styles.errorText}>{(clients.error as Error).message}</Text>
      ) : null}
      <FlatList
        data={clients.data ?? []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable style={styles.row} onPress={() => router.push(`/clients/${item.id}`)}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.email}>{item.email}</Text>
            <Text style={styles.status}>{item.status}</Text>
          </Pressable>
        )}
        ListEmptyComponent={
          !clients.isPending && !clients.error ? <Text>No clients yet.</Text> : null
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
  },
  name: { fontSize: 16, fontWeight: "600" },
  email: { fontSize: 13, color: "#666" },
  status: { fontSize: 12, color: "#999", marginTop: 2 },
  errorText: { fontSize: 13, color: "red" },
});
```

- [ ] **Step 3: Typecheck**

Run: `pnpm --filter @trainflow/mobile exec tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add "apps/mobile/src/app/(app)/clients/_layout.tsx" "apps/mobile/src/app/(app)/clients/index.tsx"
git commit -m "feat(mobile): add clients list screen"
```

---

### Task 3: Client detail screen

**Files:**
- Create: `apps/mobile/src/app/(app)/clients/[id].tsx`

**Interfaces:**
- Consumes: `useClient(clientId: string)` from Task 1 (produces `{ data: ClientDto | undefined, isPending: boolean, error: unknown }`, `ClientDto` fields: `name, email, status, phone, birthDate, heightCm, weightKg, goal, experienceLevel, weeklyAvailability, injuries, restrictions, equipment, observations` — all except `name`/`email`/`status` are nullable); `useLocalSearchParams` from `expo-router`.
- Produces: default-exported `ClientDetailScreen` at route `/clients/[id]`.

- [ ] **Step 1: Write the detail screen**

```tsx
// apps/mobile/src/app/(app)/clients/[id].tsx
import { View, Text, ScrollView, ActivityIndicator, StyleSheet } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useClient } from "@/lib/queries/clients";

function Field({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.fieldValue}>{value === null || value === undefined || value === "" ? "—" : value}</Text>
    </View>
  );
}

export default function ClientDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const client = useClient(id);

  if (client.isPending) {
    return (
      <View style={styles.screen}>
        <ActivityIndicator />
      </View>
    );
  }

  if (client.error || !client.data) {
    return (
      <View style={styles.screen}>
        <Text style={styles.errorText}>
          {client.error ? (client.error as Error).message : "Client not found."}
        </Text>
      </View>
    );
  }

  const c = client.data;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.name}>{c.name}</Text>
      <Text style={styles.email}>{c.email}</Text>

      <Field label="Status" value={c.status} />
      <Field label="Phone" value={c.phone} />
      <Field label="Birth date" value={c.birthDate ? c.birthDate.slice(0, 10) : null} />
      <Field label="Experience" value={c.experienceLevel} />
      <Field label="Height" value={c.heightCm != null ? `${c.heightCm} cm` : null} />
      <Field label="Weight" value={c.weightKg != null ? `${c.weightKg} kg` : null} />
      <Field label="Goal" value={c.goal} />
      <Field label="Weekly availability" value={c.weeklyAvailability} />
      <Field label="Injuries" value={c.injuries} />
      <Field label="Restrictions" value={c.restrictions} />
      <Field label="Equipment" value={c.equipment} />
      <Field label="Observations" value={c.observations} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 24 },
  content: { gap: 12, paddingBottom: 24 },
  name: { fontSize: 22, fontWeight: "700" },
  email: { fontSize: 14, color: "#666", marginBottom: 8 },
  field: { gap: 2 },
  fieldLabel: { fontSize: 12, textTransform: "uppercase", color: "#888" },
  fieldValue: { fontSize: 15, color: "#111" },
  errorText: { fontSize: 13, color: "red" },
});
```

- [ ] **Step 2: Typecheck**

Run: `pnpm --filter @trainflow/mobile exec tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add "apps/mobile/src/app/(app)/clients/[id].tsx"
git commit -m "feat(mobile): add client detail screen"
```

---

### Task 4: Dashboard tap-through wiring

**Files:**
- Modify: `apps/mobile/src/app/(app)/index.tsx`

**Interfaces:**
- Consumes: `useRouter` from `expo-router` (new import); existing `useClients()`/`useWorkouts()` results already in this file are unchanged.
- Produces: no new exports — `HomeScreen` gains navigation side effects on the existing clients `FlatList` rows and the "Clients" stat block.

- [ ] **Step 1: Wrap client rows and the Clients stat in `Pressable`**

In `apps/mobile/src/app/(app)/index.tsx`:

1. Add `Pressable` to the `react-native` import and `useRouter` to a new `expo-router` import:

```tsx
import { View, Text, FlatList, ActivityIndicator, Button, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
```

2. Inside `HomeScreen`, add `const router = useRouter();` alongside the existing `signOut`/`user`/`workouts`/`clients` declarations.

3. Replace the "Clients" `statBlock` `View` with a `Pressable`:

```tsx
        <Pressable style={styles.statBlock} onPress={() => router.push("/clients")}>
          <Text style={styles.statLabel}>Clients</Text>
          <Text style={styles.statValue}>
            {clients.error || clients.isPending ? "—" : clients.data?.length ?? 0}
          </Text>
          {clients.error ? (
            <Text style={styles.errorText}>{(clients.error as Error).message}</Text>
          ) : null}
        </Pressable>
```

4. Replace the clients `FlatList`'s `renderItem` to wrap each row in a `Pressable`:

```tsx
      <FlatList
        data={recentClients}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable onPress={() => router.push(`/clients/${item.id}`)}>
            <Text>
              {item.name} — {item.status}
            </Text>
          </Pressable>
        )}
        ListEmptyComponent={
          !clients.isPending && !clients.error ? <Text>No clients yet.</Text> : null
        }
      />
```

The workouts stat block, workouts `FlatList`, and everything else in the file stays unchanged.

- [ ] **Step 2: Typecheck**

Run: `pnpm --filter @trainflow/mobile exec tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Run the existing unit test suite (regression check)**

Run: `pnpm --filter @trainflow/mobile exec jest`
Expected: all existing tests still pass (`api.test.ts`, `sharedTypes.test.ts`) — this task doesn't touch either file, so this is a pure regression check.

- [ ] **Step 4: Commit**

```bash
git add "apps/mobile/src/app/(app)/index.tsx"
git commit -m "feat(mobile): wire dashboard client rows and stat to clients screens"
```

---

### Task 5: README manual verification checklist

**Files:**
- Modify: `apps/mobile/README.md`

**Interfaces:** none (documentation only).

- [ ] **Step 1: Update the status paragraph and extend the checklist**

Replace the current `**Status: Phase 1 in progress.**` paragraph with:

```markdown
**Status: Phase 1 in progress.** Sign-in, a read-only trainer dashboard, and read-only clients screens (list + detail) are wired up, with tap-through from the dashboard into both. No invite/create/edit/delete actions, search, or filtering yet — those, plus the exercise library and workout builder, are follow-up slices. Until this app reaches parity with the trainer-priority screens, `apps/mobile-capacitor` (the Capacitor WebView shell) remains the App Store / Play Store submission path — do not delete it.
```

Append these items to the "Manual verification checklist" section (keep all existing items above them):

```markdown
- [ ] Clients list shows all clients for the signed-in trainer, matching web's `/clients` (unfiltered)
- [ ] Tapping a client row opens that client's detail screen with matching profile data
- [ ] Tapping the dashboard's "Clients" stat opens the clients list
- [ ] Tapping a client row on the dashboard opens that client's detail screen
- [ ] Detail screen shows "—" for null/empty profile fields rather than blank or "null"
- [ ] Killing network / forcing a 401 on either screen shows the inline error state, not a crash
```

- [ ] **Step 2: Commit**

```bash
git add apps/mobile/README.md
git commit -m "docs(mobile): update status and verification checklist for clients slice"
```
