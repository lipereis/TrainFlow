# TrainFlow mobile (Expo)

React Native + Expo app. Trainer-first mobile client for TrainFlow, reusing the existing `apps/web` API — no direct database access, no duplicated backend logic.

**Status: Phase 1 in progress.** Sign-in and a read-only trainer dashboard (client/program stats, recent programs, clients) are wired up. The dashboard has no tap-through to workout/client detail and no create actions yet — those, plus the exercise library and workout builder, are follow-up slices. Until this app reaches parity with the trainer-priority screens, `apps/mobile-capacitor` (the Capacitor WebView shell) remains the App Store / Play Store submission path — do not delete it.

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
