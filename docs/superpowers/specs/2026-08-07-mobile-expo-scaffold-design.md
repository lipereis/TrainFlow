# TrainFlow mobile: React Native + Expo scaffold (Phase 0)

**Date:** 2026-08-07
**Scope:** Replace the Capacitor WebView shell as the primary mobile solution with a real React Native + Expo app. This spec covers Phase 0 only: monorepo restructuring, Expo app scaffold, auth + one live API call proven end-to-end, and the migration strategy for later phases. It does **not** cover the trainer or client feature screens themselves — those are separate specs.

## Context

`apps/mobile` currently ships a Capacitor wrapper (see `2026-08-07-mobile-app-shell-design.md`) that loads the production web app (`https://trainflow-chi.vercel.app`) in a native WebView. This works for shipping something to both stores fast, but has two structural problems the user wants to move away from as the primary solution:

1. **App Store risk** — thin WebView wrappers commonly get rejected under Guideline 4.2 (Minimum Functionality), and Stripe-hosted checkout for a digital subscription risks Guideline 3.1.1 (In-App Purchase required).
2. **No real native UI** — trainer-first workflows (workout builder, exercise library, PDF/Excel export, native sharing) and client-mode workflows (rest timer, rep/weight logging) want native components and native APIs (share sheet, haptics, etc.), which a WebView can't give cleanly.

The user wants a proper React Native + Expo app that reuses the existing Next.js API routes as its backend — no duplicated business logic, no direct Supabase/Postgres access from the client.

## Decisions made during brainstorming

- **Directory layout:** current Capacitor project renamed `apps/mobile` → `apps/mobile-capacitor` (package name `@trainflow/mobile-capacitor`, git history preserved via `git mv`). A fresh Expo app is scaffolded at `apps/mobile` (package name `@trainflow/mobile`), matching the target architecture where `apps/mobile` means the Expo app. Capacitor is **not** deleted this phase — it stays as the App Store submission fallback until Expo reaches feature parity on trainer-priority screens.
- **Preview target:** Expo Go on a physical phone (QR scan), not a simulator/emulator. No Xcode/Android Studio dependency for day-to-day dev.
- **Dev API target:** the Expo app points at the already-deployed production API, `https://trainflow-chi.vercel.app` (same URL the Capacitor shell already uses), not a local Next dev server. Zero LAN/network setup — works from anywhere Expo Go can reach the internet. Configurable later via `EXPO_PUBLIC_API_URL` if local-API testing is wanted.
- **Auth reuse:** same Clerk instance as `apps/web` (same publishable key). Native mobile calls hit existing API routes with `Authorization: Bearer <token>` — confirmed compatible, since `apps/web` route handlers call Clerk's `auth()` helper directly (not `clerkMiddleware().protect()` on `/api/*`), and Clerk's backend SDK accepts a Bearer token on top of the cookie flow with no extra config.
- **Auth UI:** Clerk has no prebuilt React Native `<SignIn>` component (that's web-only). Phase 0 builds a minimal custom sign-in/sign-up screen using `useSignIn`/`useSignUp` from `@clerk/clerk-expo`, email+password only. Social OAuth is deferred, but when added later `useOAuth` opens the system browser via `expo-web-browser` — this sidesteps the `403 disallowed_useragent` WebView-OAuth problem flagged in the Capacitor README, since it's not an embedded WebView.
- **State/data layer:** TanStack Query for all server state, a thin `fetch` wrapper for the API client. No direct DB access, no duplicated Zod schemas — mobile imports `@trainflow/shared-types` (already a pnpm workspace package used by `apps/web`) for request/response types and the `Role` union.
- **Feature scope for this phase:** intentionally minimal — one placeholder authenticated screen wired to one real API call (`GET /api/workouts`), to prove the whole chain works. All trainer/client feature screens (dashboard, clients, workout builder, exercise library, templates, notes, PDF/Excel export + native sharing, today's workout, rest timer, progress) are out of scope here and get their own specs after this lands.

## Architecture

**Renamed:** `apps/mobile` → `apps/mobile-capacitor` (`package.json` name → `@trainflow/mobile-capacitor`). No other changes to that project.

**New `apps/mobile/`** (Expo, TypeScript, Expo Router):

- `app/_layout.tsx` — root layout: `ClerkProvider` (token cache backed by `expo-secure-store`) wrapping `QueryClientProvider` (TanStack Query).
- `app/(auth)/sign-in.tsx`, `app/(auth)/sign-up.tsx` — custom screens via `useSignIn`/`useSignUp`.
- `app/(app)/index.tsx` — single authenticated placeholder screen ("Home"), gated by Clerk auth state, rendering the result of a `useWorkouts()` query.
- `lib/api.ts` — fetch wrapper: base URL from `EXPO_PUBLIC_API_URL` (default `https://trainflow-chi.vercel.app`), attaches `Authorization: Bearer <token>` via `useAuth().getToken()`.
- `lib/queries/workouts.ts` — one example TanStack Query hook (`useWorkouts`) calling `GET /api/workouts`, typed against `@trainflow/shared-types`.
- `.env` — `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` (copied from `apps/web`'s `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`), `EXPO_PUBLIC_API_URL`.
- `package.json` deps: `expo`, `expo-router`, `@clerk/clerk-expo`, `expo-secure-store`, `@tanstack/react-query`, `expo-sharing`, `expo-file-system` (share sheet + file APIs, unused yet but needed by the later PDF/Excel export screens — added now so Phase 0 confirms they install and prebuild cleanly), `@trainflow/shared-types` (workspace dep).

**Workspace wiring:** `pnpm-workspace.yaml` already globs `apps/*`, so no change needed there. Root `turbo.json`'s `dev` task shape (persistent, no build dependency) is satisfied by Expo's own `dev` script; no turbo config change needed. `apps/web`, `packages/*`, and `apps/mobile-capacitor` are untouched — purely additive change.

## Migration strategy

1. `git mv apps/mobile apps/mobile-capacitor`, update its `package.json` name to `@trainflow/mobile-capacitor`, fix the one doc reference (`apps/mobile/README.md` path mentions) accordingly.
2. Scaffold `apps/mobile` fresh via `create-expo-app` (TypeScript template) + Expo Router.
3. Wire Clerk + TanStack Query + the one live `/api/workouts` call — this is the proof that the architecture works end to end (Clerk session token → existing Next.js API route → shared Zod types → rendered in RN).
4. Verify per the checklist below.
5. **Not this phase:** building out the trainer-tab/client-tab navigation tree and the actual feature screens. Each feature area gets its own spec/plan. Capacitor is deleted only once Expo covers, at minimum, the trainer-priority screens (dashboard, clients, client profile, workout builder, exercise library).

## Verification (definition of done for this phase)

- `pnpm install` succeeds at the repo root with `apps/mobile` (Expo) present in the workspace and `apps/mobile-capacitor` still installing cleanly.
- `npx expo start` (run from `apps/mobile`) boots the dev server and renders a QR code.
- Expo Go on a physical phone scans the QR, opens the app, reaches the sign-in screen.
- Signing in with a real Clerk account succeeds and navigates to the placeholder Home screen.
- Home screen's `useWorkouts` query returns a real (possibly empty) `200` response from `https://trainflow-chi.vercel.app/api/workouts` — proves the Bearer-token auth path against the deployed API works, not just that the UI renders.
- `tsc --noEmit` is clean in `apps/mobile`.
- `npx expo prebuild` (or `npx expo-doctor`) confirms iOS and Android native projects can be generated from the current config — actual Xcode/Android Studio builds are out of scope for this environment (same constraint noted in the Capacitor spec: this machine has neither installed).

## What does not change

- `apps/web` — no code changes, no new API routes, no schema changes.
- `apps/mobile-capacitor` — fully preserved, still buildable, still the store-submission fallback until Expo reaches parity.
- No direct Supabase/Postgres access is introduced anywhere in `apps/mobile` — every data operation goes through an existing `apps/web` API route.
