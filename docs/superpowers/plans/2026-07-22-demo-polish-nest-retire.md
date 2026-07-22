# Demo Polish + Nest Retire Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove legacy Nest (`apps/api`) and Railway/Docker packaging so the repo matches Vercel-only production, then run a fixed prod smoke checklist and fix clear demo-blocking issues.

**Architecture:** Production already runs Next.js Route Handlers under `apps/web`. Delete the unused Nest package and root container files, update CI/docs/README, verify install/test, then smoke `https://trainflow-chi.vercel.app` and land only checklist-driven fixes.

**Tech Stack:** pnpm/Turborepo, GitHub Actions, Next.js `apps/web`, `@trainflow/workout-math` Jest, Vercel production.

## Global Constraints

- Order: Nest retire first, then prod smoke + fixes.
- Full delete of `apps/api` and Nest deploy artifacts (`Dockerfile`, `docker-entrypoint.api.sh`, `railway.toml`, `.dockerignore`).
- Do not rewrite historical `docs/superpowers/*` plans/specs (archive).
- CI after retire: `workout-math` + `web` (tsc + jest); no `@trainflow/api`.
- Demo polish: fix only clear issues found on the checklist (no spreadsheet redesign, no custom domain, no Sentry).
- Production URL: `https://trainflow-chi.vercel.app`.

---

## File map

| Path | Responsibility |
|------|----------------|
| `apps/api/**` | DELETE — legacy Nest |
| `Dockerfile`, `docker-entrypoint.api.sh`, `railway.toml`, `.dockerignore` | DELETE — Nest/Railway packaging |
| `.github/workflows/ci.yml` | Drop Nest test/build steps |
| `README.md` | Vercel-only monorepo docs |
| `docs/deploy.md` | Remove “legacy Nest remains” wording |
| `.env.example` | Confirm no Nest-only vars (scrub if any) |
| `docs/superpowers/plans/2026-07-22-demo-smoke-findings.md` | Optional findings log from smoke (create only if issues found) |

---

### Task 1: Delete Nest package and Docker/Railway artifacts

**Files:**
- Delete: `apps/api/` (entire tree)
- Delete: `Dockerfile`
- Delete: `docker-entrypoint.api.sh`
- Delete: `railway.toml`
- Delete: `.dockerignore`

**Interfaces:**
- Produces: workspace with only `apps/web` under `apps/`
- Consumes: nothing

- [ ] **Step 1: Confirm no runtime dependency on `@trainflow/api` from web/packages**

```bash
cd /path/to/TrainFlow
rg "@trainflow/api" apps/web packages --glob '!**/node_modules/**'
```

Expected: **no matches**. If any match exists in `apps/web` or `packages/*`, STOP and report — do not delete yet.

- [ ] **Step 2: Delete Nest and container files**

```bash
git rm -r apps/api
git rm Dockerfile docker-entrypoint.api.sh railway.toml .dockerignore
```

Expected: files staged for deletion. `ls apps` shows only `web`.

- [ ] **Step 3: Commit**

```bash
git commit -m "$(cat <<'EOF'
chore: remove legacy Nest API and Railway Docker packaging

Production runs on Next.js Route Handlers only; drop unused apps/api
and container entrypoints.
EOF
)"
```

---

### Task 2: Update CI and operator docs

**Files:**
- Modify: `.github/workflows/ci.yml`
- Modify: `README.md`
- Modify: `docs/deploy.md`
- Modify: `.env.example` (only if Nest-only vars remain)

**Interfaces:**
- Consumes: Task 1 deletion (no `@trainflow/api` package)
- Produces: CI that tests `workout-math` + `web` only

- [ ] **Step 1: Patch CI — remove Nest steps**

In `.github/workflows/ci.yml`, delete these three lines (currently after workout-math test):

```yaml
      - run: pnpm --filter @trainflow/api test
      - run: pnpm --filter @trainflow/api test:e2e
      - run: pnpm --filter @trainflow/api build
```

Keep (order preserved):

```yaml
      - run: pnpm install
      - run: pnpm db:generate
      - run: pnpm --filter @trainflow/db build
      - run: pnpm --filter @trainflow/db migrate:deploy
      - run: pnpm --filter @trainflow/db seed
      - run: pnpm --filter @trainflow/shared-types build
      - run: pnpm --filter @trainflow/workout-math build
      - run: pnpm lint
      - run: pnpm --filter @trainflow/workout-math test
      - run: pnpm --filter @trainflow/web exec tsc --noEmit
      - run: pnpm --filter @trainflow/web test
```

- [ ] **Step 2: Rewrite README Nest references**

Replace the Foundation / Production / Scripts / Tests sections so they match Vercel-only. Apply these concrete edits:

1. Line ~7: change  
   `- Turborepo monorepo (\`apps/web\`, \`apps/api\`, \`packages/*\`)`  
   to  
   `- Turborepo monorepo (\`apps/web\`, \`packages/*\`)`

2. Setup step 1: change “root / API” to “root (shared DB + Clerk secrets)”.

3. Replace the Production deploy paragraph that says legacy Nest stays — use:

```markdown
## Production deploy

See **[docs/deploy.md](docs/deploy.md)** for the Vercel + Clerk + Supabase matrix (env vars, webhooks, session claims, build settings).

| Layer | Host |
|-------|------|
| Frontend + backend (Route Handlers) | Vercel (`apps/web` Root Directory) |
| DB | Supabase PostgreSQL |
| Auth | Clerk |
```

4. Replace Scripts section with:

```markdown
## Scripts

- `pnpm dev` — turbo (Next.js web on port 3000)
- `pnpm test` — package tests via turbo (`@trainflow/workout-math`, `@trainflow/web`, etc.)
- `pnpm db:seed` — seed exercises + sample workout templates
- `pnpm db:migrate:deploy` — apply migrations (CI / production)
```

5. Replace Tests section with:

```markdown
### Tests

```bash
pnpm test
# or targeted:
pnpm --filter @trainflow/workout-math test
pnpm --filter @trainflow/web test
pnpm --filter @trainflow/web exec tsc --noEmit
```
```

- [ ] **Step 3: Update `docs/deploy.md`**

1. Replace the paragraph under the architecture table:

```markdown
Do **not** use Railway. All HTTP traffic (UI + API) is served by the Next.js app on Vercel (`apps/web`). Route Handlers live under `apps/web/src/app/api/**`.
```

2. In Code references table, **delete** the row:

```markdown
| Legacy Nest (not for prod) | `apps/api` |
```

- [ ] **Step 4: Scrub `.env.example` if needed**

```bash
rg "API_PORT|WEB_ORIGIN|NEXT_PUBLIC_API_URL|Railway|Nest" .env.example
```

Expected: no Nest/Railway-only vars. If found, delete those lines. Current file should already be Next/Clerk/Supabase-only — no change required if clean.

- [ ] **Step 5: Commit**

```bash
git add .github/workflows/ci.yml README.md docs/deploy.md .env.example
git commit -m "$(cat <<'EOF'
docs(ci): drop Nest from CI and document Vercel-only stack

Align Actions, README, and deploy docs with apps/web Route Handlers.
EOF
)"
```

---

### Task 3: Verify workspace without Nest

**Files:** none (verification); may touch `pnpm-lock.yaml` if `pnpm install` rewrites after package removal

**Interfaces:**
- Consumes: Tasks 1–2 complete tree

- [ ] **Step 1: Reinstall and sanity-grep**

```bash
pnpm install
rg "@trainflow/api|apps/api" --glob '!docs/superpowers/**' --glob '!**/node_modules/**' --glob '!pnpm-lock.yaml'
```

Expected: no remaining operational references outside historical `docs/superpowers/**` (and lockfile until refresh). If `pnpm-lock.yaml` still lists `@trainflow/api`, `pnpm install` should have pruned it — include lockfile in commit if changed.

- [ ] **Step 2: Lint + tests**

```bash
pnpm lint
pnpm --filter @trainflow/workout-math test
pnpm --filter @trainflow/web exec tsc --noEmit
pnpm --filter @trainflow/web test
```

Expected: all PASS / exit 0.

- [ ] **Step 3: Commit lockfile if changed**

```bash
git add pnpm-lock.yaml
git status
# only if lockfile modified:
git commit -m "$(cat <<'EOF'
chore: refresh lockfile after removing @trainflow/api
EOF
)"
```

If lockfile unchanged, skip commit.

---

### Task 4: Production smoke + checklist fixes

**Files:**
- Modify: only files required to fix clear issues found
- Create (optional): `docs/superpowers/plans/2026-07-22-demo-smoke-findings.md` if ≥1 issue found

**Interfaces:**
- Consumes: live prod at `https://trainflow-chi.vercel.app`
- Produces: fixes committed; findings noted

- [ ] **Step 1: Automated health check**

```bash
curl -sS "https://trainflow-chi.vercel.app/api/health"
```

Expected: JSON with `"ok": true` and db healthy (e.g. `"db": true`). If fail, fix health/DB config before continuing — that is in scope.

- [ ] **Step 2: Manual checklist (browser, signed-in)**

Record pass/fail for each:

1. Trainer sign-in → `/dashboard` loads  
2. `/clients` list; open a client  
3. Open a workout → Export PDF + Export Excel succeed  
4. Invite UI reachable (`/clients/invite` or client invite control)  
5. As CLIENT: `/portal` shows ACTIVE program(s); Download PDF + Excel work  
6. Viewport &lt; 768px: trainer menu opens drawer; closes on backdrop, Escape, and nav link  

- [ ] **Step 3: Fix clear failures only**

For each failure:

- Prefer minimal change in `apps/web`
- Re-run the failed checklist item locally or on preview
- Do **not** start spreadsheet mobile redesign, i18n overhaul, or domain work

If no failures: write nothing; skip findings file.

If failures: create `docs/superpowers/plans/2026-07-22-demo-smoke-findings.md`:

```markdown
# Demo smoke findings (2026-07-22)

| # | Step | Issue | Fix commit |
|---|------|-------|------------|
| 1 | … | … | … |
```

- [ ] **Step 4: Commit fixes (if any)**

```bash
git add -A
git commit -m "$(cat <<'EOF'
fix(web): address demo smoke checklist issues

EOF
)"
```

Use a more specific message if only one area changed (e.g. `fix(web): restore portal download on …`). Skip commit if nothing to fix.

---

### Task 5: Push and production deploy

**Files:** none

- [ ] **Step 1: Push**

```bash
git push origin HEAD
```

Expected: `main` updated on GitHub; CI runs without Nest steps.

- [ ] **Step 2: Deploy**

```bash
pnpm dlx vercel deploy --prod --non-interactive
```

Expected: `readyState: READY`, aliased to `https://trainflow-chi.vercel.app`.

- [ ] **Step 3: Re-smoke health + one authenticated path**

```bash
curl -sS "https://trainflow-chi.vercel.app/api/health"
```

Plus quick browser check: trainer dashboard or portal still loads.

---

## Spec coverage self-review

| Spec item | Task |
|-----------|------|
| Delete `apps/api` + Docker/Railway files | Task 1 |
| CI without Nest; web + workout-math | Task 2 |
| README + deploy.md Vercel-only | Task 2 |
| `.env.example` scrub | Task 2 |
| Verify install/lint/tests; no api imports | Task 3 |
| Prod smoke checklist | Task 4 |
| Fix clear issues only | Task 4 |
| Historical superpowers docs untouched | All tasks (no edits) |
| Deploy | Task 5 |

## Placeholder scan

No TBD / “implement later” / vague steps.

## Type consistency

N/A (deletion + docs + opportunistic fixes; no new shared API types).
