# TrainFlow mobile (Expo)

React Native + Expo app. Trainer-first mobile client for TrainFlow, reusing the existing `apps/web` API — no direct database access, no duplicated backend logic.

**Status: Phase 1 in progress.** Sign-in, a read-only trainer dashboard, read-only clients screens (list + detail), and a read-only exercise library list are wired up. No invite/create/edit/delete actions, search, or filtering yet — those, plus the workout builder, are follow-up slices. Until this app reaches parity with the trainer-priority screens, `apps/mobile-capacitor` (the Capacitor WebView shell) remains the App Store / Play Store submission path — do not delete it.

Built on Expo SDK 57 (React Native 0.86, React 19). Routes live under `src/app/` (this SDK generation's default, not root `app/`).

## Setup

```bash
pnpm install
pnpm --filter @trainflow/shared-types build
cp apps/mobile/.env.example apps/mobile/.env
# fill in EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY from apps/web/.env.local's
# NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY (same Clerk instance)
```

`packages/shared-types` must be built before the app can resolve `@trainflow/shared-types` — Turborepo does this automatically when run through `turbo`, but running `expo start` directly bypasses that, so re-run the build manually after changing anything under `packages/shared-types/src`.

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
- [ ] Exercises list shows both global library and trainer-custom exercises, matching web's unfiltered `/exercises`
- [ ] Library vs Custom badge matches web's badge for the same exercise
- [ ] Tapping a video link opens the URL
- [ ] Exercises with no video link / no instructions render cleanly with those elements omitted, not blank space or "null"
- [ ] Killing network / forcing a 401 shows the inline error state, not a crash
