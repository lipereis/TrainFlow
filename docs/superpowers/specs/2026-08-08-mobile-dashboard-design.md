# Mobile Dashboard (Phase 1, slice 1) Design

## Context

`apps/mobile` finished Phase 0 (see `docs/superpowers/specs/2026-08-07-mobile-expo-scaffold-design.md`): Clerk auth, Bearer-token API client, and a placeholder Home screen wired to `GET /api/workouts` only. Phase 1 covers the real trainer surfaces — dashboard, clients, exercise library, workout builder — each too large for a single spec, so each gets its own design → plan → build cycle. This is the first slice: the dashboard, replacing the placeholder Home screen.

The web app's equivalent is `apps/web/src/app/(trainer)/dashboard/page.tsx`: three stat cards (clients / programs / active programs), a "recent programs" list (first 8 workouts), and a clients list (first 8 clients), plus header actions ("New client", "New workout") and tap-through to workout/client detail pages.

## Scope decisions

- **No tap-through.** Web links rows to workout-detail and client-detail pages; neither exists on mobile yet. Rows are display-only this slice — building detail screens as a side effect of a dashboard spec would blow the scope.
- **No header actions.** "New client" / "New workout" have no destination screens on mobile either; dropped for this slice rather than shown disabled.
- **Bare styling.** Matches the existing sign-in/sign-up/Home screens: plain `View`/`Text`/`StyleSheet`, no design system or theme work.

These narrow the slice to: fetch two lists, derive three numbers, render three read-only sections.

## Architecture / data

- New hook `src/lib/queries/clients.ts`: `useClients()`, same shape as the existing `useWorkouts()` (`src/lib/queries/workouts.ts`) — `useQuery` wrapping `apiFetch<ClientDto[]>("/api/clients", token)`. Unlike workouts, `ClientDto` is already exported from `@trainflow/shared-types` (`packages/shared-types/src/clients.ts`), so no local stopgap type is needed here.
- The Home route (`src/app/(app)/index.tsx`) becomes the dashboard screen. Sign-out button stays.
- Stats are derived client-side from the two query results, same math as web: `clients.length`, `workouts.length`, `workouts.filter(w => w.status === "ACTIVE").length`. No new backend endpoint.

## Components

Single screen, three sections, same slice sizes as web (first 8 each):

1. Stat row: clients count, programs count, active-programs count.
2. "Recent programs" — first 8 workouts, name + status text. Empty state: "No workouts yet."
3. "Clients" — first 8 clients, name + status text. Empty state: "No clients yet."

No new components/files beyond the screen itself and the `useClients` hook.

## Error handling

Each section is independent, driven by its own query's state:

- `useClients()` errors: client stat shows "—" plus an inline error line; clients section shows nothing extra (empty list).
- `useWorkouts()` errors: same treatment for the programs stat — shows "—" and an inline error line.

This is a deliberate improvement over web, which shows a client-fetch error but silently swallows workout-fetch errors into an empty list. Carrying that inconsistency forward isn't worth it.

Loading: a single `ActivityIndicator` shown while either query is loading (matches current Home screen's existing pattern for workouts).

## Testing

No hook-testing setup exists yet in `apps/mobile` (the existing `useWorkouts` hook is untested for the same reason — see `apps/mobile/src/lib/__tests__/`, which only covers `api.ts` and shared-types resolution). Not introducing one for this slice. Verification is manual on-device, extending the existing checklist in `apps/mobile/README.md`:

- [ ] Dashboard shows client count, program count, and active-program count matching what the same trainer sees on web
- [ ] Recent programs list shows the same programs as web's dashboard (or "No workouts yet." if empty)
- [ ] Clients list shows the same clients as web's dashboard (or "No clients yet." if empty)
- [ ] Killing network / forcing a 401 shows the inline error state on the relevant stat, not a crash

Typecheck (`pnpm --filter @trainflow/mobile exec tsc --noEmit` or equivalent) is the only automated gate.

## Out of scope (explicitly deferred)

- Workout detail screen, client detail screen (needed for tap-through)
- Client-create / workout-create screens (needed for header actions)
- Any visual polish/theme system
- `@trainflow/shared-types` response schema for workouts (noted as a pre-existing gap in the Phase 0 spec's self-review; still not blocking this slice — a local `WorkoutSummary` type already exists in `queries/workouts.ts` and covers what the dashboard needs)
