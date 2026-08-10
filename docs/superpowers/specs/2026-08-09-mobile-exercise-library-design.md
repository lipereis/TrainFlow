# Mobile Exercise Library (Phase 1, slice 3) Design

## Context

Phase 1 slices 1-2 shipped the trainer dashboard and clients screens (read-only, following the same pattern each time). This slice adds a read-only exercise library screen, mirroring the same shape: a new query hook plus a list screen wired to a dashboard entry point.

The web app's equivalent is `apps/web/src/app/(trainer)/exercises/page.tsx`: a single page with search + muscle/category filter dropdowns, a create form, and a list where each row already shows name, library/custom badge, primary muscle, category, equipment, a truncated instructions preview, and a video link. There is no separate exercise detail page on web — the list row is the full presentation. This slice builds a narrower read-only subset — see Scope decisions.

## Scope decisions

- **Read-only.** No create, edit, or delete. Same reasoning as the clients slice: mutating flows need their own forms/validation/error-states and don't belong in this slice.
- **No search/filter.** The backend (`GET /api/exercises`) already accepts `q`/`muscle`/`category` query params, but this slice's `useExercises()` calls it with none, returning the full trainer-scoped list (global library + trainer's custom exercises). Filtering is a natural follow-up that doesn't require restructuring the screen.
- **No detail screen.** Unlike clients, web's own exercise list row is already the full presentation (name, badges, equipment, instructions, video link) — there's no additional data a detail screen would surface. Single screen only.
- **Dashboard entry point is a plain link, not a stat tile.** The dashboard's existing stat tiles (Clients/Programs/Active) are trainer-scoped counts. Exercise counts mix a global library with trainer-custom entries, which doesn't fit the same "my stuff" framing, so this slice adds a plain text link/button instead of a fourth stat.

## Architecture / data

- New file `src/lib/queries/exercises.ts`: `useExercises()`, `useQuery` wrapping `apiFetch<ExerciseDto[]>("/api/exercises", token)`, `queryKey: ["exercises"]`, `enabled: isLoaded && isSignedIn` — same shape as `useClients()`. Backend endpoint already exists (`apps/web/src/app/api/exercises/route.ts`, trainer-scoped, returns global + custom); no backend changes.
- New route group `src/app/(app)/exercises/`:
  - `_layout.tsx` — nested `Stack` with `headerShown: true`, same override pattern as `clients/_layout.tsx` (the parent `(app)/_layout.tsx` sets `headerShown: false` globally).
  - `index.tsx` — list screen (only screen in this slice).

## Components

**List screen** (`exercises/index.tsx`)
- `useExercises()`, full result, no client-side filtering.
- `FlatList` row per exercise:
  - Name + badge: "Library" when `trainerId` is `null`, "Custom" otherwise (mirrors web's `Badge` logic).
  - Primary muscle and category as badge/text.
  - Equipment as badge.
  - `defaultInstructions`, rendered when non-empty (lightly clamped, e.g. `numberOfLines={2}`, matching web's `line-clamp-2` — full instructions aren't needed for a read-only skim list).
  - `videoUrl`, rendered as tappable link text when present, opens via `Linking.openURL(videoUrl)`.
- Loading: `ActivityIndicator` while `exercises.isPending`.
- Error: inline error text (same treatment as clients/dashboard).
- Empty: "No exercises yet." (gated on `!isPending && !error`, same `isPending`-based gating as prior slices).

**Dashboard wiring** (`src/app/(app)/index.tsx`)
- New `Pressable`/`Text` link, "Exercise library", placed below the existing Clients section, `onPress` → `router.push("/exercises")`.
- No new query on the dashboard itself — this slice doesn't add an exercise count anywhere on the dashboard.

## Error handling

Same pattern as prior slices: the screen's loading/error/empty state is driven directly by `useExercises()`'s `isPending`/`error`/`data`, no shared state, no retry UI beyond React Query's default.

## Testing

No hook-testing setup exists yet in `apps/mobile` (same gap noted in prior slices). Not introducing one for `useExercises` either. Verification is manual on-device, extending the checklist in `apps/mobile/README.md`:

- [ ] Exercise library link on the dashboard opens the exercises list
- [ ] Exercises list shows both global library and trainer-custom exercises, matching web's unfiltered `/exercises`
- [ ] Library vs Custom badge matches web's badge for the same exercise
- [ ] Tapping a video link opens the URL (external browser or in-app view, whichever `Linking.openURL` does on the test device)
- [ ] Exercises with no `videoUrl` / no `defaultInstructions` render cleanly with those elements omitted, not blank space or "null"
- [ ] Killing network / forcing a 401 shows the inline error state, not a crash

Typecheck (`npx tsc --noEmit` in `apps/mobile`) is the only automated gate.

## Out of scope (explicitly deferred)

- Search or muscle/category filtering on the list
- Create/edit/delete exercise screens
- Exercise detail screen
- Alternatives (`alternativeIds`) display
- Dashboard exercise-count stat tile
- Any visual polish/theme system
