# TrainFlow mobile (Expo)

React Native + Expo app. Trainer-first mobile client for TrainFlow, reusing the existing `apps/web` API — no direct database access, no duplicated backend logic.

**Status: Phase 1 in progress.** Sign-in, a read-only trainer dashboard, read-only clients screens (list + detail), a read-only exercise library list, workout program create/edit/delete (metadata), and day-level create/edit/delete/reorder within a program are wired up. Exercises within a day are still read-only — no exercise editing yet. No invite/edit/delete for clients, no search or filtering anywhere yet. Until this app reaches parity with the trainer-priority screens, `apps/mobile-capacitor` (the Capacitor WebView shell) remains the App Store / Play Store submission path — do not delete it.

Built on Expo SDK 57 (React Native 0.86, React 19). Routes live under `src/app/` (this SDK generation's default, not root `app/`).

## Setup

```bash
pnpm install
pnpm --filter @trainflow/shared-types build
pnpm --filter @trainflow/workout-math build
cp apps/mobile/.env.example apps/mobile/.env
# fill in EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY from apps/web/.env.local's
# NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY (same Clerk instance)
```

`packages/shared-types` and `packages/workout-math` must be built before the app can resolve `@trainflow/shared-types` and `@trainflow/workout-math` — Turborepo does this automatically when run through `turbo`, but running `expo start` directly bypasses that, so re-run the build manually after changing anything under `packages/shared-types/src` or `packages/workout-math/src`.

## Run

```bash
cd apps/mobile
npx expo start
```

Scan the QR code with Expo Go (iOS: Camera app; Android: Expo Go app) on a phone on the same network. The app talks to the production API (`https://trainflow-chi.vercel.app`) by default — no local backend needed.

## Test

```bash
pnpm --filter @trainflow/mobile exec jest
```

## Native builds

`npx expo prebuild` generates `ios/` and `android/` (gitignored — this is a managed-workflow Expo project, native projects aren't committed). iOS generation requires a Mac with Xcode/CocoaPods; this hasn't been exercised end-to-end from a Windows environment. Before a real store build, set `expo.ios.bundleIdentifier` and `expo.android.package` in `app.json` (left unset for now — Phase 0 doesn't need them).

## Manual verification checklist (run once after setup, on a physical device)

- [ ] `npx expo start` renders a QR code with no Metro errors
- [ ] Expo Go opens the app and lands on the sign-in screen
- [ ] Signing in with a real Clerk account redirects to the Home screen
- [ ] Home screen shows either real workout rows or "No workouts yet." (not an error)
- [ ] Sign out returns to the sign-in screen
- [ ] Dashboard shows client count, program count, and active-program count matching what the same trainer sees on web
- [ ] Recent programs list shows the same programs as web's dashboard (or "No workouts yet." if empty)
- [ ] Clients list shows the same clients as web's dashboard (or "No clients yet." if empty)
- [ ] Killing network / forcing a 401 shows the inline error state on the relevant stat, not a crash
- [ ] Clients list shows all clients for the signed-in trainer, matching web's `/clients` (unfiltered)
- [ ] Tapping a client row opens that client's detail screen with matching profile data
- [ ] Tapping the dashboard's "Clients" stat opens the clients list
- [ ] Tapping a client row on the dashboard opens that client's detail screen
- [ ] Detail screen shows "—" for null/empty profile fields rather than blank or "null"
- [ ] Killing network / forcing a 401 on either screen shows the inline error state, not a crash
- [ ] Back from the clients list returns to the dashboard, and back from a client detail returns to where it was opened from (list or dashboard)
- [ ] Exercise library link on the dashboard opens the exercises list
- [ ] Back from the exercises list returns to the dashboard
- [ ] Exercises list shows both global library and trainer-custom exercises, matching web's unfiltered `/exercises`
- [ ] Library vs Custom badge matches web's badge for the same exercise
- [ ] With a custom exercise that has a video URL (create one on web first), tapping "Video" opens it
- [ ] Exercises with no video link / no instructions render cleanly with those elements omitted, not blank space or "null"
- [ ] Killing network / forcing a 401 shows the inline error state, not a crash
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
- [ ] "Add day" on a program's detail screen opens the create form
- [ ] Submitting the day form with a blank name shows an inline "required" error and does not submit
- [ ] A successfully created day appears in the program's Days list
- [ ] "Edit" on a day opens the form pre-filled with that day's current values
- [ ] Saving an edited day reflects the new values on the detail screen, not stale data
- [ ] "Delete" on a day shows a native confirm dialog; canceling leaves the day untouched; confirming removes it from the list
- [ ] The Up button is absent/disabled on the first day and the Down button is absent/disabled on the last day
- [ ] Pressing Up or Down on a day changes its position in the list and the new order persists across a screen refresh
- [ ] Killing network on add/edit/delete/reorder shows the inline error state, not a crash or a silently-lost action
