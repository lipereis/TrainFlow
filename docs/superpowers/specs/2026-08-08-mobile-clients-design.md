# Mobile Clients (Phase 1, slice 2) Design

## Context

Phase 1, slice 1 shipped the trainer dashboard (`docs/superpowers/specs/2026-08-08-mobile-dashboard-design.md`), which explicitly deferred tap-through: its client rows are display-only because no client detail screen exists yet. This slice closes that gap by adding a clients list screen and a client detail screen, and wiring the dashboard's existing client rows/stat into them.

The web app's equivalent is `apps/web/src/app/(trainer)/clients/page.tsx` (list, with search + invite/new actions) and `apps/web/src/app/(trainer)/clients/[clientId]/page.tsx` (detail, with edit/delete actions and a per-client workout-programs list). This slice intentionally builds a narrower read-only subset — see Scope decisions.

## Scope decisions

- **Read-only.** No invite, create, edit, delete, or resend-invite. Those are mutating flows with their own forms/validation/error-states; bundling them here would blow the slice size the same way the dashboard spec avoided bundling detail screens.
- **No search/filter.** List screen renders the full `useClients()` result as-is. Client volume doesn't need it yet, and it's trivial to add later without restructuring the screen.
- **No per-client workout-programs list on the detail screen.** Web's detail page also lists that client's programs via `/workouts?clientId=`. Mobile's `useWorkouts()` has no client-filtering support (`WorkoutSummary` type has no `clientId` field) — adding it belongs with the workout-builder slice, not here.
- **Dashboard wiring is in scope.** Unlike the dashboard slice (which had nothing to link to), this slice's whole purpose is to give the dashboard's client rows and "Clients" stat a destination, so wiring them up now is the natural close of that deferral.

## Architecture / data

- New hook in `src/lib/queries/clients.ts`: `useClient(clientId: string)`, `useQuery` wrapping `apiFetch<ClientDto>(\`/api/clients/${clientId}\`, token)`, `queryKey: ["clients", clientId]`, `enabled: isLoaded && isSignedIn && !!clientId`. Backend endpoint already exists (`apps/web/src/app/api/clients/[id]/route.ts`, trainer-scoped) — no backend changes.
- New route group `src/app/(app)/clients/`:
  - `_layout.tsx` — nested `Stack` with `headerShown: true`. The parent `(app)/_layout.tsx` sets `headerShown: false` globally (dashboard is a root screen with no back target); this override gives the list and detail screens a native header with an automatic back button, no custom back-button code needed.
  - `index.tsx` — list screen.
  - `[id].tsx` — detail screen, id via `useLocalSearchParams()`.

## Components

**List screen** (`clients/index.tsx`)
- `useClients()`, full result (no slice-to-8, unlike the dashboard).
- `FlatList` row: name, email, status text. Tap row → `router.push(`/clients/${id}`)`.
- Loading: `ActivityIndicator` while `clients.isPending`.
- Error: inline error text (same treatment as dashboard's per-section error line).
- Empty: "No clients yet." (gated on `!isPending && !error`, matching the dashboard fix's `isPending`-based gating — see `apps/mobile/src/app/(app)/index.tsx`).

**Detail screen** (`clients/[id].tsx`)
- `useClient(id)`.
- Header block: name, email, status.
- Profile fields, each rendered by a small local `Field({ label, value })` component (mirrors web's `Field` in `clients/[clientId]/page.tsx`, minus i18n — mobile has no i18n setup): phone, birthDate (sliced to date-only), experienceLevel, heightCm, weightKg, goal, weeklyAvailability, injuries, restrictions, equipment, observations. `value` renders "—" when null/empty.
- Loading/error states: same `isPending`/error pattern as the list screen and dashboard.
- Not-found (404 from `apiFetch`, e.g. deleted client): show the existing error-text pattern; no dedicated not-found UI — out of scope for a read-only slice.

**Dashboard wiring** (`src/app/(app)/index.tsx`)
- Each client row wrapped in `Pressable`, `onPress` → `router.push(`/clients/${id}`)`.
- The "Clients" stat block wrapped in `Pressable`, `onPress` → `router.push("/clients")`.
- No visual change otherwise (still plain `View`/`Text`/`StyleSheet`, matching the existing bare-styling decision from the dashboard spec).

## Error handling

Same pattern as the dashboard slice: each screen's loading/error/empty state is driven directly by its query's `isPending`/`error`/`data`, no shared state, no retry UI beyond what React Query gives by default.

## Testing

No hook-testing setup exists yet in `apps/mobile` (same gap noted in the dashboard spec — `useClients`/`useWorkouts` are untested). Not introducing one for `useClient` either, for the same reason. Verification is manual on-device, extending the checklist in `apps/mobile/README.md`:

- [ ] Clients list shows all clients for the signed-in trainer, matching web's `/clients` (unfiltered)
- [ ] Tapping a client row opens that client's detail screen with matching profile data
- [ ] Tapping the dashboard's "Clients" stat opens the clients list
- [ ] Tapping a client row on the dashboard opens that client's detail screen
- [ ] Detail screen shows "—" for null/empty profile fields rather than blank or "null"
- [ ] Killing network / forcing a 401 on either screen shows the inline error state, not a crash

Typecheck (`npx tsc --noEmit` in `apps/mobile`) is the only automated gate.

## Out of scope (explicitly deferred)

- Invite / create client screen
- Edit client screen
- Delete / resend-invite actions
- Search or status filtering on the list
- Per-client workout-programs list on the detail screen (needs `useWorkouts` client-filtering — belongs with the workout-builder slice)
- Any visual polish/theme system
