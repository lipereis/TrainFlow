# TrainFlow — i18n (pt-BR / en) + light/dark theme

**Date:** 2026-07-21  
**Status:** Approved design (pending implementation plan)  
**App:** `apps/web` (Next.js App Router on Vercel)

## Goal

Let trainers (majority in Brazil) use the full product UI in **Portuguese (Brazil)** or **English**, and choose **light / dark / system** theme so the default bright white shell is not forced.

## Non-goals

- Translating Clerk-hosted Account Portal / email templates (out of band; can follow later).
- URL-prefixed locales (`/pt-BR/clients`) — unnecessary for an authenticated app.
- Translating Excel/PDF export *file contents* in v1 (UI chrome around export yes; generated document strings can stay English unless trivial to wire).
- Multi-theme brand kits (only light + dark + system).

## Decisions

| Topic | Choice |
|-------|--------|
| Locales | `pt-BR`, `en` |
| Default locale | `pt-BR` |
| Locale routing | Cookie + localStorage; **no** path prefix |
| i18n library | `next-intl` (App Router, client + server) |
| Theme library | `next-themes` |
| Theme modes | `light` \| `dark` \| `system` |
| Default theme | `system` |
| Tailwind | `darkMode: "class"` |
| Toggle placement | Trainer header next to `UserButton`; same on client portal; landing gets compact controls |
| Coverage | Full app UI strings (shell, pages, forms, wizard, spreadsheet labels, empty states, errors shown in UI) |

## Architecture

```
<html lang={locale} class="dark|light">
  ThemeProvider (next-themes, attribute="class", defaultTheme="system")
  NextIntlClientProvider / next-intl server helpers
    App shells (trainer / client / landing)
```

### Locale persistence

1. Cookie `NEXT_LOCALE` (`pt-BR` \| `en`) — readable in middleware / RSC.
2. Mirror in `localStorage` for client toggles.
3. Missing preference → **`pt-BR`**.
4. Changing language updates cookie + storage and refreshes messages (soft navigation / `router.refresh()`).

### Theme persistence

- Handled by `next-themes` (`localStorage` key e.g. `trainflow-theme`).
- Default `system`; user can pin light or dark.
- Prevent flash: inline script / `suppressHydrationWarning` on `<html>` per next-themes docs.

### Message catalogs

```
apps/web/messages/pt-BR.json
apps/web/messages/en.json
```

Namespaces (suggested):

- `common` — actions (Save, Cancel, Delete, Search, …)
- `nav` — sidebar / brand
- `auth` — landing / post-auth copy we own
- `dashboard`, `clients`, `workouts`, `templates`, `exercises`
- `wizard`, `spreadsheet`
- `errors` — user-visible API/UI errors we render as text

Keep keys stable English identifiers (`nav.clients`). Values in both locale files.

### UI controls

Compact header controls (no card chrome):

1. **Language:** `PT` \| `EN` segmented control (or select).
2. **Theme:** Light / Dark / System (icons + accessible labels).

Labels themselves are translated via `common.theme.*` / `common.language.*`.

### Styling

- Map shell surfaces to Tailwind that support dark:
  - Light: existing zinc-50/white/zinc-200 borders.
  - Dark: `bg-zinc-950` / `bg-zinc-900` surfaces, `border-zinc-800`, `text-zinc-100`.
- Replace hardcoded `bg-white`, `border-zinc-200`, `text-zinc-900` in shells and shared components with paired `dark:` classes (or shared CSS variables later).
- Print styles stay light (`@media print` forces light readable pages).

## User flows

1. First visit → UI in **pt-BR**, theme follows OS.
2. User switches to English → cookie set; full UI English after refresh of RSC trees.
3. User pins Dark → stays dark regardless of OS.
4. Preference survives reload and new sessions on same browser.

## Files likely touched

- `apps/web/package.json` — add `next-intl`, `next-themes`
- `apps/web/src/app/layout.tsx` — providers, `lang`, theme
- `apps/web/src/middleware.ts` — locale cookie for next-intl (compose with Clerk)
- `apps/web/tailwind.config.ts` — `darkMode: "class"`
- `apps/web/src/app/globals.css` — body light/dark base
- `apps/web/src/components/*` + `src/app/**/page.tsx` — replace literals with `t(...)`
- New: `messages/*.json`, `src/i18n/*`, `src/components/locale-toggle.tsx`, `src/components/theme-toggle.tsx`, `src/components/appearance-controls.tsx`

## Clerk middleware note

Existing `clerkMiddleware` must remain. Locale resolution runs alongside it (next-intl middleware helper or thin cookie reader) **without** reintroducing redirect loops. Public routes and webhook/API skip rules stay as today.

## Acceptance criteria

- [ ] Toggles visible on trainer + client shells (and landing).
- [ ] Default locale pt-BR; default theme system.
- [ ] Switching language updates all in-scope UI strings (no leftover English when pt-BR selected, except Clerk chrome / export file internals if deferred).
- [ ] Switching theme updates shell + main pages; no unreadable contrast.
- [ ] Preferences persist across reload.
- [ ] Print/export preview still readable (print CSS light).
- [ ] No auth/middleware regressions (`/api/health`, sign-in, dashboard).

## Out of scope follow-ups

- Clerk Dashboard localization / invitation email language.
- Localizing generated Excel/PDF cell labels.
- Per-trainer org default locale stored in DB.
