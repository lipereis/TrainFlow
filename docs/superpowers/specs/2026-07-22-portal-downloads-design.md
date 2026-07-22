# TrainFlow — Client portal program downloads

**Date:** 2026-07-22  
**Status:** Approved design (pending implementation plan)  
**App:** `apps/web` (Next.js App Router on Vercel)

## Goal

Let authenticated clients download their **ACTIVE** workout programs as **PDF** and **Excel** from `/portal`, using the same export generators trainers already use.

## Non-goals

- New portal detail route (`/portal/workouts/[id]`).
- Client editing, check-offs, or messaging.
- Exporting DRAFT / ARCHIVED programs.
- Translating PDF/Excel document body strings (UI chrome only; same as i18n non-goal).
- Custom domain or Clerk Production migration.
- Emailing attachments or OS share-sheet UX.

## Decisions

| Topic | Choice |
|-------|--------|
| Formats | PDF + Excel (both) |
| Placement | Buttons on each ACTIVE program card on `/portal` |
| Routes | Reuse `GET /api/workouts/[id]/export.pdf` and `…/export.xlsx` |
| Auth model | Trainer **or** owning client |
| Client eligibility | Program `clientId` matches session client **and** `status === ACTIVE` |
| Payload | Same `loadExportPayload` / `pdfService` / xlsx builders as trainer |
| i18n | New `portal.downloadPdf` / `portal.downloadExcel` (pt-BR + en) |

## Architecture

```
Client /portal
  → <a href="/api/workouts/:id/export.pdf">  (session cookie)
  → Route Handler
       requireTrainerId  OR  requireClientId + ownership (ACTIVE)
       loadExportPayload(trainerId, programId)
       pdfService / xlsxService → attachment response
```

### Auth / ownership

1. **Trainer path (unchanged):** `requireTrainerId()` → `loadExportPayload(trainerId, id)` (program must belong to that trainer via existing `workoutsService.get`).
2. **Client path (new):** `requireClientId()` → load program by `id` → reject unless `program.clientId === clientId` and `program.status === ACTIVE` → call `loadExportPayload(program.trainerId, id)`.
3. Missing session → 401. Wrong role / not owner / not ACTIVE → 403. Missing program → 404 (same patterns as other handlers via `toErrorResponse`).

Prefer a small shared helper (e.g. `authorizeExport(programId)`) used by both PDF and XLSX route handlers so the two formats stay in lockstep.

### UI

- On each program card header in `apps/web/src/app/(client)/portal/page.tsx`, add two controls:
  - Download PDF → `/api/workouts/{id}/export.pdf`
  - Download Excel → `/api/workouts/{id}/export.xlsx`
- Use simple links or buttons that navigate/download (browser handles `Content-Disposition: attachment`). No new client-side fetch required unless we want loading/error toasts later.
- Empty portal state unchanged (no download UI when there are no ACTIVE programs).

### i18n

Add keys under `portal` in `messages/en.json` and `messages/pt-BR.json`, e.g.:

- `downloadPdf`
- `downloadExcel`

## Testing / acceptance

- As client with ≥1 ACTIVE program: both downloads return files and open/save correctly.
- As client: cannot download another client’s program id (403).
- As client: cannot download DRAFT program even if somehow known (403).
- As trainer: existing spreadsheet export still works.
- Unauthenticated request to export URL → 401.
- UI labels respect locale toggle.

## Out of scope follow-ups

- Portal program detail page.
- Progress / completion tracking.
- Localized export document contents.
