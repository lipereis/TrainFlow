# TrainFlow — Foundation Design

## Context

TrainFlow is an AI-powered operating system for personal trainers, automating administrative work (workout tracking, progress calculations, client management, reports, scheduling, payments, AI insights). The full product spans many independent subsystems (client management, workout builder, automation engine, AI assistant, body assessment, reports, scheduling, financial module, notifications, client mobile app).

Given the scope, the project is decomposed into sub-projects, each with its own spec → plan → implementation cycle. This document covers the **Foundation** sub-project: the base that every other sub-project depends on (repo scaffold, authentication, core data model, role-based access).

Planned build order after Foundation: Client Management → Workout Builder → Automation Engine → Trainer Dashboard → AI Assistant → Scheduling → Financial Module → Reports → Notifications → Client Mobile App (as a responsive web experience within the same Next.js app, not a separate codebase).

## Goals

- Stand up a monorepo that all future sub-projects build on top of.
- Authenticate two roles: Trainer and Client.
- Let a trainer register a client and have that client join via an invite flow.
- Enforce data isolation so a trainer only ever sees their own clients.
- Establish conventions (folder structure, typed API contracts, error handling, testing) that later sub-projects follow.

## Non-Goals

- No workout, payment, scheduling, or AI-related tables/logic. Those are separate specs.
- No native mobile app. Client experience is a responsive Next.js web app.
- No multi-trainer organizations / staff accounts — one trainer account owns its clients directly.
- No Postgres Row-Level Security — data isolation is enforced in the NestJS service layer via explicit `trainerId` filtering.

## Technology Decisions

| Concern | Choice | Why |
|---|---|---|
| Monorepo tooling | Turborepo | Shared types/DB schema across web + api, single install, cached builds |
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui | Matches required stack; serves both trainer dashboard and client portal via role-gated routes |
| Backend | NestJS on Node.js | Matches required stack; clean modular structure for business logic |
| Database | PostgreSQL via Supabase | Managed Postgres + Storage in one provider |
| ORM | Prisma | Type-safe schema/migrations shared by NestJS |
| Auth | Clerk | Hosted signup/login/invite flows, JWT-based, roles in metadata |
| API hosting | Railway | Runs the NestJS container; connects to Supabase Postgres over connection string |
| File storage | Supabase Storage | Used by later sub-projects (photos/videos); not used by Foundation itself |

## Monorepo Layout

```
trainflow/
├── apps/
│   ├── web/          # Next.js app (trainer dashboard + client portal)
│   └── api/           # NestJS app (deployed to Railway)
├── packages/
│   ├── db/            # Prisma schema, migrations, generated client
│   ├── shared-types/  # DTOs, enums, zod schemas shared by web + api
│   └── ui/             # Shared shadcn/ui-based components
├── docs/
└── turbo.json
```

## Auth & Roles

- Identity managed entirely by Clerk. No local password storage.
- Role stored in Clerk `publicMetadata.role`, one of `TRAINER` | `CLIENT`.
- NestJS `AuthGuard` verifies the Clerk-issued JWT on every request and attaches `{ clerkUserId, role }` to the request context.
- A `RolesGuard` decorator (`@Roles('TRAINER')`) restricts routes by role.
- Data isolation: every service method that reads/writes `Client` (or, later, anything scoped to a client) filters by the requesting trainer's `trainerId`. There is no cross-trainer query path in the service layer.

## Signup / Invite Flow

1. **Trainer signup**: trainer signs up directly through Clerk (role defaults to `TRAINER`). A Clerk webhook (`user.created`) calls `POST /trainers/signup-webhook`, which creates the corresponding `Trainer` row.
2. **Client registration**: trainer fills a minimal form (name, email) in the dashboard → `POST /clients/invite`. This creates a `Client` row with `status = PENDING` and an `InviteToken` (random token, 7-day expiry), then triggers a Clerk invitation email to the client's address.
3. **Client acceptance**: client opens the invite link, sets a password through Clerk's hosted flow. On successful signup, a Clerk webhook (`user.created`, role=`CLIENT`) calls `POST /invites/accept` with the token, which links `Client.clerkUserId`, marks the `InviteToken` used, and sets `Client.status = ACTIVE`.
4. **Expired/invalid token**: acceptance endpoint returns a typed error; frontend shows "invite expired, ask your trainer to resend" with a resend action for the trainer.

## Core Data Model (Prisma)

```prisma
model Trainer {
  id          String   @id @default(uuid())
  clerkUserId String   @unique
  name        String
  email       String   @unique
  createdAt   DateTime @default(now())
  clients     Client[]
}

model Client {
  id          String       @id @default(uuid())
  trainerId   String
  trainer     Trainer      @relation(fields: [trainerId], references: [id])
  clerkUserId String?      @unique
  name        String
  email       String
  status      ClientStatus @default(PENDING)
  createdAt   DateTime     @default(now())
  inviteToken InviteToken?

  @@index([trainerId])
}

model InviteToken {
  id        String    @id @default(uuid())
  clientId  String    @unique
  client    Client    @relation(fields: [clientId], references: [id])
  token     String    @unique
  expiresAt DateTime
  usedAt    DateTime?
}

enum ClientStatus {
  PENDING
  ACTIVE
  INACTIVE
}
```

Indexing: `trainerId` on `Client` (list-by-trainer is the hottest query); unique constraints on `clerkUserId`/`email`/`token` double as lookup indexes. Later sub-projects add their own tables/indexes in their own specs.

## API Surface (Foundation)

| Endpoint | Role | Purpose |
|---|---|---|
| `POST /trainers/signup-webhook` | Clerk webhook (internal) | Create `Trainer` row on Clerk `user.created` for trainer role |
| `POST /clients/invite` | Trainer | Create `Client` (PENDING) + `InviteToken`, send Clerk invite |
| `POST /clients/:id/resend-invite` | Trainer | Regenerate token if expired |
| `POST /invites/accept` | Clerk webhook (internal) | Link `Client.clerkUserId`, mark token used, activate client |
| `GET /clients` | Trainer | List own clients (paginated) |
| `GET /clients/:id` | Trainer (own client only) | Client detail |

All non-webhook routes require a valid Clerk JWT via `AuthGuard`; trainer routes additionally require `@Roles('TRAINER')` and implicit `trainerId` scoping.

## Error Handling

- NestJS global exception filter converts thrown errors into a consistent shape: `{ code: string, message: string }`.
- Request DTOs validated with `zod` schemas from `packages/shared-types` (shared with the frontend for form validation).
- Known error codes for Foundation: `INVITE_EXPIRED`, `INVITE_ALREADY_USED`, `CLIENT_NOT_FOUND`, `FORBIDDEN_CROSS_TENANT`.

## Testing

- Unit tests (Jest) for `AuthGuard`, `RolesGuard`, and each service method (mocked Prisma client).
- E2E test (Jest + Supertest) covering the full invite flow: trainer creates client → invite token generated → accept endpoint activates client → expired-token path returns `INVITE_EXPIRED`.
- CI runs lint + unit + e2e on every push (added as part of implementation, not specified further here).

## Open Questions For Later Sub-Projects (explicitly out of scope here)

- Whether trainers can eventually have staff/assistant accounts (would change the tenancy model) — revisit if requested.
- Whether Client Mobile experience ever needs to become a PWA for push notifications — revisit during Notifications sub-project.
