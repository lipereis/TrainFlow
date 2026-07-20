# TrainFlow Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the TrainFlow monorepo with a working Trainer/Client auth + invite flow, backed by a minimal Prisma schema, that every future sub-project builds on.

**Architecture:** Turborepo monorepo with `apps/web` (Next.js 14 App Router) and `apps/api` (NestJS) apps, plus `packages/db` (Prisma), `packages/shared-types` (zod schemas/DTOs), and `packages/ui` (shared components). Clerk provides identity; NestJS enforces role + tenant (trainerId) scoping in the service layer; Postgres is hosted on Supabase; the API deploys to Railway.

**Tech Stack:** TypeScript, Next.js 14, Tailwind CSS, shadcn/ui, NestJS, Prisma, PostgreSQL (Supabase), Clerk, Turborepo, Jest, Supertest, zod.

## Global Constraints

- Frontend: Next.js, TypeScript, Tailwind CSS, shadcn/ui.
- Backend: NestJS, Node.js.
- Database: PostgreSQL (Supabase).
- ORM: Prisma.
- Auth: Clerk.
- API hosting: Railway. Frontend hosting: Vercel (not configured in this plan — deployment config is a later task, not blocking local dev).
- Roles: `TRAINER` | `CLIENT`, stored in Clerk `publicMetadata.role`.
- Data isolation: enforced via explicit `trainerId` filtering in NestJS services — no Postgres RLS.
- No workout/payment/scheduling/AI tables or logic in this plan — Foundation only.
- No native mobile app — client experience is responsive Next.js web.
- Error responses: consistent shape `{ code: string, message: string }`.
- Known error codes: `INVITE_EXPIRED`, `INVITE_ALREADY_USED`, `CLIENT_NOT_FOUND`, `FORBIDDEN_CROSS_TENANT`.

---

### Task 1: Monorepo scaffold

**Files:**
- Create: `package.json` (root)
- Create: `turbo.json`
- Create: `.gitignore`
- Create: `apps/web/package.json` (placeholder, filled in Task 3)
- Create: `apps/api/package.json` (placeholder, filled in Task 5)
- Create: `packages/shared-types/package.json`
- Create: `packages/db/package.json`
- Create: `pnpm-workspace.yaml`

**Interfaces:**
- Produces: workspace layout `apps/web`, `apps/api`, `packages/db`, `packages/shared-types`, `packages/ui` that every later task assumes exists.

- [ ] **Step 1: Create root package.json**

```json
{
  "name": "trainflow",
  "private": true,
  "scripts": {
    "build": "turbo run build",
    "dev": "turbo run dev",
    "lint": "turbo run lint",
    "test": "turbo run test"
  },
  "devDependencies": {
    "turbo": "^2.1.0"
  },
  "packageManager": "pnpm@9.12.0"
}
```

- [ ] **Step 2: Create pnpm-workspace.yaml**

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

- [ ] **Step 3: Create turbo.json**

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {},
    "test": {
      "dependsOn": ["^build"]
    }
  }
}
```

- [ ] **Step 4: Create .gitignore**

```
node_modules/
.next/
dist/
.env
.env.local
.turbo/
*.log
```

- [ ] **Step 5: Create empty app/package directories with placeholder package.json files**

Run:
```bash
mkdir -p apps/web apps/api packages/db packages/shared-types packages/ui
```

`packages/shared-types/package.json`:
```json
{
  "name": "@trainflow/shared-types",
  "version": "0.0.1",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts"
}
```

`packages/ui/package.json`:
```json
{
  "name": "@trainflow/ui",
  "version": "0.0.1",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts"
}
```

`packages/db/package.json`:
```json
{
  "name": "@trainflow/db",
  "version": "0.0.1",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "generate": "prisma generate",
    "migrate:dev": "prisma migrate dev"
  }
}
```

`apps/web/package.json` and `apps/api/package.json`: leave as `{}` for now — Tasks 3 and 5 replace them with real scaffolds (Next.js and Nest CLI generate their own package.json).

- [ ] **Step 6: Install pnpm dependencies at root**

Run: `pnpm install`
Expected: lockfile `pnpm-lock.yaml` created, no errors.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore: scaffold turborepo monorepo layout"
```

---

### Task 2: Shared types package — Client/Trainer DTOs and error codes

**Files:**
- Create: `packages/shared-types/src/errors.ts`
- Create: `packages/shared-types/src/client.ts`
- Create: `packages/shared-types/src/index.ts`
- Create: `packages/shared-types/tsconfig.json`
- Test: `packages/shared-types/src/client.test.ts`

**Interfaces:**
- Produces: `ClientStatus` enum, `InviteClientInput` zod schema + type, `ErrorCode` union type, `AppError` class — consumed by Task 5 (NestJS DTOs) and Task 7 (frontend forms).

- [ ] **Step 1: Add zod dependency**

Run: `pnpm --filter @trainflow/shared-types add zod`

- [ ] **Step 2: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "declaration": true,
    "outDir": "dist"
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Write the failing test for the invite input schema**

`packages/shared-types/src/client.test.ts`:
```typescript
import { describe, it, expect } from "vitest";
import { InviteClientInputSchema } from "./client";

describe("InviteClientInputSchema", () => {
  it("accepts a valid name and email", () => {
    const result = InviteClientInputSchema.safeParse({
      name: "Jane Doe",
      email: "jane@example.com",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid email", () => {
    const result = InviteClientInputSchema.safeParse({
      name: "Jane Doe",
      email: "not-an-email",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an empty name", () => {
    const result = InviteClientInputSchema.safeParse({
      name: "",
      email: "jane@example.com",
    });
    expect(result.success).toBe(false);
  });
});
```

- [ ] **Step 4: Add vitest and run test to verify it fails**

Run: `pnpm --filter @trainflow/shared-types add -D vitest`
Run: `pnpm --filter @trainflow/shared-types exec vitest run`
Expected: FAIL with "Cannot find module './client'"

- [ ] **Step 5: Implement client.ts**

`packages/shared-types/src/client.ts`:
```typescript
import { z } from "zod";

export enum ClientStatus {
  PENDING = "PENDING",
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
}

export const InviteClientInputSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
});

export type InviteClientInput = z.infer<typeof InviteClientInputSchema>;

export interface ClientSummary {
  id: string;
  name: string;
  email: string;
  status: ClientStatus;
  createdAt: string;
}
```

- [ ] **Step 6: Run test to verify it passes**

Run: `pnpm --filter @trainflow/shared-types exec vitest run`
Expected: PASS (3 tests)

- [ ] **Step 7: Implement errors.ts**

`packages/shared-types/src/errors.ts`:
```typescript
export type ErrorCode =
  | "INVITE_EXPIRED"
  | "INVITE_ALREADY_USED"
  | "CLIENT_NOT_FOUND"
  | "FORBIDDEN_CROSS_TENANT";

export class AppError extends Error {
  code: ErrorCode;

  constructor(code: ErrorCode, message: string) {
    super(message);
    this.code = code;
    this.name = "AppError";
  }
}
```

- [ ] **Step 8: Create index.ts barrel export**

`packages/shared-types/src/index.ts`:
```typescript
export * from "./client";
export * from "./errors";
```

- [ ] **Step 9: Add test script to package.json**

Modify `packages/shared-types/package.json`, add to `"scripts"`:
```json
"test": "vitest run"
```

- [ ] **Step 10: Commit**

```bash
git add packages/shared-types
git commit -m "feat: add shared client DTOs and error codes"
```

---

### Task 3: Prisma schema and client package

**Files:**
- Create: `packages/db/prisma/schema.prisma`
- Create: `packages/db/src/index.ts`
- Create: `packages/db/.env.example`
- Modify: `packages/db/package.json`

**Interfaces:**
- Consumes: nothing new.
- Produces: `PrismaClient` singleton export from `@trainflow/db`, plus Prisma models `Trainer`, `Client`, `InviteToken`, enum `ClientStatus` — consumed by Task 5's NestJS services.

- [ ] **Step 1: Add Prisma dependencies**

Run: `pnpm --filter @trainflow/db add @prisma/client`
Run: `pnpm --filter @trainflow/db add -D prisma`

- [ ] **Step 2: Create .env.example**

`packages/db/.env.example`:
```
DATABASE_URL="postgresql://postgres:password@localhost:5432/trainflow?schema=public"
```

Copy it to a real `.env` for local dev (not committed):
```bash
cp packages/db/.env.example packages/db/.env
```

- [ ] **Step 3: Write schema.prisma**

`packages/db/prisma/schema.prisma`:
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

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

- [ ] **Step 4: Generate Prisma client and run first migration**

Run: `pnpm --filter @trainflow/db exec prisma migrate dev --name init`
Expected: migration folder created under `packages/db/prisma/migrations/`, "Your database is now in sync with your schema."

- [ ] **Step 5: Create the PrismaClient singleton**

`packages/db/src/index.ts`:
```typescript
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export * from "@prisma/client";
```

- [ ] **Step 6: Verify generated client type-checks**

Run: `pnpm --filter @trainflow/db exec tsc --noEmit src/index.ts`
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add packages/db
git commit -m "feat: add Prisma schema for Trainer, Client, InviteToken"
```

Note: `.env` is gitignored; only `.env.example` is committed.

---

### Task 4: NestJS API scaffold with Clerk auth guard

**Files:**
- Create: `apps/api/` (generated via Nest CLI)
- Create: `apps/api/src/auth/auth.guard.ts`
- Create: `apps/api/src/auth/roles.decorator.ts`
- Create: `apps/api/src/auth/roles.guard.ts`
- Create: `apps/api/src/common/http-exception.filter.ts`
- Test: `apps/api/src/auth/auth.guard.spec.ts`

**Interfaces:**
- Consumes: `AppError`, `ErrorCode` from `@trainflow/shared-types` (Task 2).
- Produces: `AuthGuard` (attaches `request.auth = { clerkUserId: string, role: "TRAINER" | "CLIENT" }`), `@Roles(...roles)` decorator, `RolesGuard`, global `HttpExceptionFilter` — consumed by Task 5's controllers.

- [ ] **Step 1: Generate the NestJS app**

Run:
```bash
cd apps/api
pnpm dlx @nestjs/cli new . --package-manager pnpm --skip-git
cd ../..
```

- [ ] **Step 2: Add Clerk backend SDK and shared-types dependency**

Run: `pnpm --filter api add @clerk/backend @trainflow/shared-types @trainflow/db`

- [ ] **Step 3: Write the failing test for AuthGuard**

`apps/api/src/auth/auth.guard.spec.ts`:
```typescript
import { ExecutionContext, UnauthorizedException } from "@nestjs/common";
import { AuthGuard } from "./auth.guard";
import * as clerkBackend from "@clerk/backend";

jest.mock("@clerk/backend", () => ({
  verifyToken: jest.fn(),
}));

function makeContext(headers: Record<string, string>) {
  const req: any = { headers };
  return {
    switchToHttp: () => ({
      getRequest: () => req,
    }),
  } as ExecutionContext;
}

describe("AuthGuard", () => {
  let guard: AuthGuard;

  beforeEach(() => {
    guard = new AuthGuard();
    jest.clearAllMocks();
  });

  it("throws UnauthorizedException when no Authorization header is present", async () => {
    const ctx = makeContext({});
    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
  });

  it("attaches auth info to the request when the token is valid", async () => {
    (clerkBackend.verifyToken as jest.Mock).mockResolvedValue({
      sub: "user_123",
      publicMetadata: { role: "TRAINER" },
    });
    const ctx = makeContext({ authorization: "Bearer valid-token" });
    const result = await guard.canActivate(ctx);
    expect(result).toBe(true);
    const req = ctx.switchToHttp().getRequest();
    expect(req.auth).toEqual({ clerkUserId: "user_123", role: "TRAINER" });
  });

  it("throws UnauthorizedException when the token is invalid", async () => {
    (clerkBackend.verifyToken as jest.Mock).mockRejectedValue(new Error("bad token"));
    const ctx = makeContext({ authorization: "Bearer bad-token" });
    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
  });
});
```

- [ ] **Step 4: Run test to verify it fails**

Run: `pnpm --filter api exec jest auth.guard.spec.ts`
Expected: FAIL with "Cannot find module './auth.guard'"

- [ ] **Step 5: Implement AuthGuard**

`apps/api/src/auth/auth.guard.ts`:
```typescript
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { verifyToken } from "@clerk/backend";

export interface RequestAuth {
  clerkUserId: string;
  role: "TRAINER" | "CLIENT";
}

@Injectable()
export class AuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const header: string | undefined = request.headers?.authorization;

    if (!header || !header.startsWith("Bearer ")) {
      throw new UnauthorizedException("Missing bearer token");
    }

    const token = header.slice("Bearer ".length);

    try {
      const payload = await verifyToken(token, {
        secretKey: process.env.CLERK_SECRET_KEY,
      });
      const role = (payload as any).publicMetadata?.role;

      if (role !== "TRAINER" && role !== "CLIENT") {
        throw new UnauthorizedException("Missing role metadata");
      }

      request.auth = {
        clerkUserId: payload.sub,
        role,
      } satisfies RequestAuth;

      return true;
    } catch {
      throw new UnauthorizedException("Invalid token");
    }
  }
}
```

- [ ] **Step 6: Run test to verify it passes**

Run: `pnpm --filter api exec jest auth.guard.spec.ts`
Expected: PASS (3 tests)

- [ ] **Step 7: Implement Roles decorator and RolesGuard (no test — trivial metadata wiring, covered by Task 6 e2e)**

`apps/api/src/auth/roles.decorator.ts`:
```typescript
import { SetMetadata } from "@nestjs/common";
import { RequestAuth } from "./auth.guard";

export const ROLES_KEY = "roles";
export const Roles = (...roles: RequestAuth["role"][]) =>
  SetMetadata(ROLES_KEY, roles);
```

`apps/api/src/auth/roles.guard.ts`:
```typescript
import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ROLES_KEY } from "./roles.decorator";
import { RequestAuth } from "./auth.guard";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<RequestAuth["role"][]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const auth: RequestAuth | undefined = request.auth;

    if (!auth || !requiredRoles.includes(auth.role)) {
      throw new ForbiddenException("Insufficient role");
    }

    return true;
  }
}
```

- [ ] **Step 8: Implement global HttpExceptionFilter**

`apps/api/src/common/http-exception.filter.ts`:
```typescript
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { Response } from "express";
import { AppError } from "@trainflow/shared-types";

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();

    if (exception instanceof AppError) {
      const status = exception.code === "CLIENT_NOT_FOUND" ? 404 : 400;
      response.status(status).json({ code: exception.code, message: exception.message });
      return;
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();
      const message = typeof body === "string" ? body : (body as any).message;
      response.status(status).json({ code: "HTTP_ERROR", message });
      return;
    }

    response
      .status(HttpStatus.INTERNAL_SERVER_ERROR)
      .json({ code: "INTERNAL_ERROR", message: "Unexpected server error" });
  }
}
```

- [ ] **Step 9: Register the global filter in main.ts**

Modify `apps/api/src/main.ts` — add after `const app = await NestFactory.create(AppModule);`:
```typescript
  app.useGlobalFilters(new HttpExceptionFilter());
```
And add the import at the top:
```typescript
import { HttpExceptionFilter } from "./common/http-exception.filter";
```

- [ ] **Step 10: Commit**

```bash
git add apps/api
git commit -m "feat: scaffold NestJS api with Clerk auth guard and roles guard"
```

---

### Task 5: Trainer signup webhook + Client invite endpoints

**Files:**
- Create: `apps/api/src/trainers/trainers.module.ts`
- Create: `apps/api/src/trainers/trainers.controller.ts`
- Create: `apps/api/src/trainers/trainers.service.ts`
- Create: `apps/api/src/clients/clients.module.ts`
- Create: `apps/api/src/clients/clients.controller.ts`
- Create: `apps/api/src/clients/clients.service.ts`
- Create: `apps/api/src/clients/dto/invite-client.dto.ts`
- Modify: `apps/api/src/app.module.ts`
- Test: `apps/api/src/clients/clients.service.spec.ts`

**Interfaces:**
- Consumes: `AuthGuard`, `RequestAuth`, `Roles`, `RolesGuard` (Task 4); `prisma`, `ClientStatus` from `@trainflow/db` (Task 3); `InviteClientInputSchema`, `AppError` from `@trainflow/shared-types` (Task 2).
- Produces: `ClientsService.inviteClient(trainerId, input): Promise<ClientSummary>`, `ClientsService.listForTrainer(trainerId): Promise<ClientSummary[]>`, `ClientsService.acceptInvite(token, clerkUserId): Promise<void>` — consumed by Task 6's e2e test and Task 7's frontend.

- [ ] **Step 1: Write the failing unit test for ClientsService.inviteClient**

`apps/api/src/clients/clients.service.spec.ts`:
```typescript
import { ClientsService } from "./clients.service";
import { ClientStatus } from "@trainflow/db";

describe("ClientsService.inviteClient", () => {
  it("creates a PENDING client and an invite token", async () => {
    const created = { id: "client_1", name: "Jane", email: "jane@example.com", status: ClientStatus.PENDING, createdAt: new Date() };
    const prismaMock: any = {
      client: {
        create: jest.fn().mockResolvedValue(created),
      },
      inviteToken: {
        create: jest.fn().mockResolvedValue({ id: "token_1", token: "abc123" }),
      },
    };

    const service = new ClientsService(prismaMock);
    const result = await service.inviteClient("trainer_1", {
      name: "Jane",
      email: "jane@example.com",
    });

    expect(prismaMock.client.create).toHaveBeenCalledWith({
      data: {
        trainerId: "trainer_1",
        name: "Jane",
        email: "jane@example.com",
        status: ClientStatus.PENDING,
      },
    });
    expect(prismaMock.inviteToken.create).toHaveBeenCalled();
    expect(result).toEqual({
      id: "client_1",
      name: "Jane",
      email: "jane@example.com",
      status: ClientStatus.PENDING,
      createdAt: created.createdAt.toISOString(),
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter api exec jest clients.service.spec.ts`
Expected: FAIL with "Cannot find module './clients.service'"

- [ ] **Step 3: Add uuid/crypto-based token generator dependency**

No new dependency needed — use Node's built-in `crypto.randomUUID()`.

- [ ] **Step 4: Implement invite-client.dto.ts**

`apps/api/src/clients/dto/invite-client.dto.ts`:
```typescript
import { InviteClientInputSchema, InviteClientInput } from "@trainflow/shared-types";

export class InviteClientDto implements InviteClientInput {
  name!: string;
  email!: string;

  static parse(body: unknown): InviteClientInput {
    return InviteClientInputSchema.parse(body);
  }
}
```

- [ ] **Step 5: Implement ClientsService**

`apps/api/src/clients/clients.service.ts`:
```typescript
import { Injectable } from "@nestjs/common";
import { randomUUID } from "crypto";
import { prisma as defaultPrisma, ClientStatus } from "@trainflow/db";
import { AppError, ClientSummary, InviteClientInput } from "@trainflow/shared-types";

const INVITE_EXPIRY_DAYS = 7;

@Injectable()
export class ClientsService {
  constructor(private readonly prisma: typeof defaultPrisma = defaultPrisma) {}

  async inviteClient(trainerId: string, input: InviteClientInput): Promise<ClientSummary> {
    const client = await this.prisma.client.create({
      data: {
        trainerId,
        name: input.name,
        email: input.email,
        status: ClientStatus.PENDING,
      },
    });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + INVITE_EXPIRY_DAYS);

    await this.prisma.inviteToken.create({
      data: {
        clientId: client.id,
        token: randomUUID(),
        expiresAt,
      },
    });

    return this.toSummary(client);
  }

  async listForTrainer(trainerId: string): Promise<ClientSummary[]> {
    const clients = await this.prisma.client.findMany({
      where: { trainerId },
      orderBy: { createdAt: "desc" },
    });
    return clients.map((c) => this.toSummary(c));
  }

  async getForTrainer(trainerId: string, clientId: string): Promise<ClientSummary> {
    const client = await this.prisma.client.findUnique({ where: { id: clientId } });

    if (!client) {
      throw new AppError("CLIENT_NOT_FOUND", `Client ${clientId} not found`);
    }
    if (client.trainerId !== trainerId) {
      throw new AppError("FORBIDDEN_CROSS_TENANT", "Client belongs to a different trainer");
    }

    return this.toSummary(client);
  }

  async resendInvite(trainerId: string, clientId: string): Promise<void> {
    const client = await this.prisma.client.findUnique({ where: { id: clientId } });

    if (!client) {
      throw new AppError("CLIENT_NOT_FOUND", `Client ${clientId} not found`);
    }
    if (client.trainerId !== trainerId) {
      throw new AppError("FORBIDDEN_CROSS_TENANT", "Client belongs to a different trainer");
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + INVITE_EXPIRY_DAYS);

    await this.prisma.inviteToken.upsert({
      where: { clientId },
      create: { clientId, token: randomUUID(), expiresAt },
      update: { token: randomUUID(), expiresAt, usedAt: null },
    });
  }

  async acceptInvite(token: string, clerkUserId: string): Promise<void> {
    const inviteToken = await this.prisma.inviteToken.findUnique({
      where: { token },
      include: { client: true },
    });

    if (!inviteToken) {
      throw new AppError("INVITE_EXPIRED", "Invite token not found");
    }
    if (inviteToken.usedAt) {
      throw new AppError("INVITE_ALREADY_USED", "Invite token already used");
    }
    if (inviteToken.expiresAt < new Date()) {
      throw new AppError("INVITE_EXPIRED", "Invite token has expired");
    }

    await this.prisma.$transaction([
      this.prisma.client.update({
        where: { id: inviteToken.clientId },
        data: { clerkUserId, status: ClientStatus.ACTIVE },
      }),
      this.prisma.inviteToken.update({
        where: { token },
        data: { usedAt: new Date() },
      }),
    ]);
  }

  private toSummary(client: {
    id: string;
    name: string;
    email: string;
    status: ClientStatus;
    createdAt: Date;
  }): ClientSummary {
    return {
      id: client.id,
      name: client.name,
      email: client.email,
      status: client.status,
      createdAt: client.createdAt.toISOString(),
    };
  }
}
```

- [ ] **Step 6: Run test to verify it passes**

Run: `pnpm --filter api exec jest clients.service.spec.ts`
Expected: PASS (1 test)

- [ ] **Step 7: Implement ClientsController**

`apps/api/src/clients/clients.controller.ts`:
```typescript
import { Body, Controller, Get, Param, Post, Req, UseGuards } from "@nestjs/common";
import { AuthGuard, RequestAuth } from "../auth/auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";
import { ClientsService } from "./clients.service";
import { InviteClientDto } from "./dto/invite-client.dto";

@Controller()
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Post("clients/invite")
  @UseGuards(AuthGuard, RolesGuard)
  @Roles("TRAINER")
  async invite(@Req() req: { auth: RequestAuth }, @Body() body: unknown) {
    const input = InviteClientDto.parse(body);
    return this.clientsService.inviteClient(req.auth.clerkUserId, input);
  }

  @Get("clients")
  @UseGuards(AuthGuard, RolesGuard)
  @Roles("TRAINER")
  async list(@Req() req: { auth: RequestAuth }) {
    return this.clientsService.listForTrainer(req.auth.clerkUserId);
  }

  @Get("clients/:id")
  @UseGuards(AuthGuard, RolesGuard)
  @Roles("TRAINER")
  async getOne(@Req() req: { auth: RequestAuth }, @Param("id") id: string) {
    return this.clientsService.getForTrainer(req.auth.clerkUserId, id);
  }

  @Post("clients/:id/resend-invite")
  @UseGuards(AuthGuard, RolesGuard)
  @Roles("TRAINER")
  async resendInvite(@Req() req: { auth: RequestAuth }, @Param("id") id: string) {
    await this.clientsService.resendInvite(req.auth.clerkUserId, id);
    return { ok: true };
  }

  @Post("invites/accept")
  async acceptInvite(@Body() body: { token: string; clerkUserId: string }) {
    await this.clientsService.acceptInvite(body.token, body.clerkUserId);
    return { ok: true };
  }
}
```

Note: `req.auth.clerkUserId` stands in for `trainerId` here as a simplification — Task 5 wires the real trainer lookup in Step 9 below.

- [ ] **Step 8: Implement TrainersService and TrainersController (signup webhook)**

`apps/api/src/trainers/trainers.service.ts`:
```typescript
import { Injectable } from "@nestjs/common";
import { prisma as defaultPrisma } from "@trainflow/db";

@Injectable()
export class TrainersService {
  constructor(private readonly prisma: typeof defaultPrisma = defaultPrisma) {}

  async createFromClerk(clerkUserId: string, name: string, email: string) {
    return this.prisma.trainer.create({
      data: { clerkUserId, name, email },
    });
  }

  async findByClerkUserId(clerkUserId: string) {
    return this.prisma.trainer.findUnique({ where: { clerkUserId } });
  }
}
```

`apps/api/src/trainers/trainers.controller.ts`:
```typescript
import { Body, Controller, Post } from "@nestjs/common";
import { TrainersService } from "./trainers.service";

@Controller("trainers")
export class TrainersController {
  constructor(private readonly trainersService: TrainersService) {}

  @Post("signup-webhook")
  async signupWebhook(@Body() body: { data: { id: string; first_name: string; email_addresses: { email_address: string }[] } }) {
    const { id, first_name, email_addresses } = body.data;
    await this.trainersService.createFromClerk(id, first_name, email_addresses[0].email_address);
    return { ok: true };
  }
}
```

- [ ] **Step 9: Fix ClientsController to resolve the real trainerId from Clerk user id**

Modify `apps/api/src/clients/clients.controller.ts` — inject `TrainersService` and resolve trainer before delegating:
```typescript
import { Body, Controller, Get, Param, Post, Req, UseGuards } from "@nestjs/common";
import { AuthGuard, RequestAuth } from "../auth/auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";
import { ClientsService } from "./clients.service";
import { TrainersService } from "../trainers/trainers.service";
import { InviteClientDto } from "./dto/invite-client.dto";
import { AppError } from "@trainflow/shared-types";

@Controller()
export class ClientsController {
  constructor(
    private readonly clientsService: ClientsService,
    private readonly trainersService: TrainersService,
  ) {}

  private async resolveTrainerId(clerkUserId: string): Promise<string> {
    const trainer = await this.trainersService.findByClerkUserId(clerkUserId);
    if (!trainer) {
      throw new AppError("CLIENT_NOT_FOUND", "Trainer record not found for this user");
    }
    return trainer.id;
  }

  @Post("clients/invite")
  @UseGuards(AuthGuard, RolesGuard)
  @Roles("TRAINER")
  async invite(@Req() req: { auth: RequestAuth }, @Body() body: unknown) {
    const trainerId = await this.resolveTrainerId(req.auth.clerkUserId);
    const input = InviteClientDto.parse(body);
    return this.clientsService.inviteClient(trainerId, input);
  }

  @Get("clients")
  @UseGuards(AuthGuard, RolesGuard)
  @Roles("TRAINER")
  async list(@Req() req: { auth: RequestAuth }) {
    const trainerId = await this.resolveTrainerId(req.auth.clerkUserId);
    return this.clientsService.listForTrainer(trainerId);
  }

  @Get("clients/:id")
  @UseGuards(AuthGuard, RolesGuard)
  @Roles("TRAINER")
  async getOne(@Req() req: { auth: RequestAuth }, @Param("id") id: string) {
    const trainerId = await this.resolveTrainerId(req.auth.clerkUserId);
    return this.clientsService.getForTrainer(trainerId, id);
  }

  @Post("clients/:id/resend-invite")
  @UseGuards(AuthGuard, RolesGuard)
  @Roles("TRAINER")
  async resendInvite(@Req() req: { auth: RequestAuth }, @Param("id") id: string) {
    const trainerId = await this.resolveTrainerId(req.auth.clerkUserId);
    await this.clientsService.resendInvite(trainerId, id);
    return { ok: true };
  }

  @Post("invites/accept")
  async acceptInvite(@Body() body: { token: string; clerkUserId: string }) {
    await this.clientsService.acceptInvite(body.token, body.clerkUserId);
    return { ok: true };
  }
}
```

- [ ] **Step 10: Wire up modules**

`apps/api/src/clients/clients.module.ts`:
```typescript
import { Module } from "@nestjs/common";
import { ClientsController } from "./clients.controller";
import { ClientsService } from "./clients.service";
import { TrainersModule } from "../trainers/trainers.module";

@Module({
  imports: [TrainersModule],
  controllers: [ClientsController],
  providers: [ClientsService],
})
export class ClientsModule {}
```

`apps/api/src/trainers/trainers.module.ts`:
```typescript
import { Module } from "@nestjs/common";
import { TrainersController } from "./trainers.controller";
import { TrainersService } from "./trainers.service";

@Module({
  controllers: [TrainersController],
  providers: [TrainersService],
  exports: [TrainersService],
})
export class TrainersModule {}
```

Modify `apps/api/src/app.module.ts`:
```typescript
import { Module } from "@nestjs/common";
import { ClientsModule } from "./clients/clients.module";
import { TrainersModule } from "./trainers/trainers.module";

@Module({
  imports: [ClientsModule, TrainersModule],
})
export class AppModule {}
```

- [ ] **Step 11: Run full api test suite**

Run: `pnpm --filter api exec jest`
Expected: PASS (all tests from Task 4 and Task 5)

- [ ] **Step 12: Commit**

```bash
git add apps/api
git commit -m "feat: add trainer signup webhook and client invite endpoints"
```

---

### Task 6: End-to-end invite flow test

**Files:**
- Create: `apps/api/test/invite-flow.e2e-spec.ts`
- Create: `apps/api/test/jest-e2e.json`

**Interfaces:**
- Consumes: full app module from Task 5, `prisma` from `@trainflow/db` (Task 3) for direct test setup/teardown.

- [ ] **Step 1: Create jest-e2e.json**

`apps/api/test/jest-e2e.json`:
```json
{
  "moduleFileExtensions": ["js", "json", "ts"],
  "rootDir": ".",
  "testEnvironment": "node",
  "testRegex": ".e2e-spec.ts$",
  "transform": {
    "^.+\\.(t|j)s$": "ts-jest"
  }
}
```

- [ ] **Step 2: Write the failing e2e test**

`apps/api/test/invite-flow.e2e-spec.ts`:
```typescript
import { Test } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { AppModule } from "../src/app.module";
import { prisma } from "@trainflow/db";

describe("Invite flow (e2e)", () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await prisma.inviteToken.deleteMany();
    await prisma.client.deleteMany();
    await prisma.trainer.deleteMany();
    await app.close();
  });

  it("creates a trainer, invites a client, and rejects an expired token", async () => {
    await request(app.getHttpServer())
      .post("/trainers/signup-webhook")
      .send({
        data: {
          id: "clerk_trainer_e2e",
          first_name: "Alex",
          email_addresses: [{ email_address: "alex@example.com" }],
        },
      })
      .expect(201);

    const trainer = await prisma.trainer.findUnique({
      where: { clerkUserId: "clerk_trainer_e2e" },
    });
    expect(trainer).not.toBeNull();

    const inviteToken = await prisma.inviteToken.create({
      data: {
        expiresAt: new Date(Date.now() - 1000),
        token: "expired-token-e2e",
        client: {
          create: {
            trainerId: trainer!.id,
            name: "Expired Client",
            email: "expired@example.com",
          },
        },
      },
    });

    const response = await request(app.getHttpServer())
      .post("/invites/accept")
      .send({ token: inviteToken.token, clerkUserId: "clerk_client_e2e" })
      .expect(400);

    expect(response.body.code).toBe("INVITE_EXPIRED");
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `pnpm --filter api exec jest --config test/jest-e2e.json`
Expected: FAIL (DB not migrated in test env, or endpoints not returning 201 — confirms test exercises real code, not a false pass)

- [ ] **Step 4: Point test env at a real (local/dev) Postgres and re-run migrations**

Run:
```bash
cd packages/db
pnpm exec prisma migrate deploy
cd ../..
```

- [ ] **Step 5: Add test script to apps/api/package.json**

Modify `apps/api/package.json`, add to `"scripts"`:
```json
"test:e2e": "jest --config test/jest-e2e.json"
```

- [ ] **Step 6: Run test to verify it passes**

Run: `pnpm --filter api test:e2e`
Expected: PASS (1 test)

- [ ] **Step 7: Commit**

```bash
git add apps/api/test
git commit -m "test: add e2e invite flow test covering expired token path"
```

---

### Task 7: Next.js web scaffold with Clerk-protected trainer dashboard shell

**Files:**
- Create: `apps/web/` (generated via `create-next-app`)
- Create: `apps/web/middleware.ts`
- Create: `apps/web/app/(trainer)/dashboard/page.tsx`
- Create: `apps/web/app/(trainer)/clients/page.tsx`
- Create: `apps/web/app/(trainer)/clients/invite-client-form.tsx`
- Create: `apps/web/lib/api-client.ts`
- Create: `apps/web/.env.local.example`

**Interfaces:**
- Consumes: `InviteClientInputSchema` from `@trainflow/shared-types` (Task 2), `POST /clients/invite` and `GET /clients` endpoints (Task 5).
- Produces: `apiClient.post(path, body)` / `apiClient.get(path)` helpers that attach the Clerk session token — consumed by later sub-projects' frontend pages.

- [ ] **Step 1: Generate the Next.js app**

Run:
```bash
cd apps
pnpm dlx create-next-app@latest web --typescript --tailwind --app --src-dir=false --import-alias "@/*" --use-pnpm
cd ..
```

- [ ] **Step 2: Add Clerk and shadcn/ui dependencies**

Run:
```bash
pnpm --filter web add @clerk/nextjs @trainflow/shared-types
pnpm --filter web dlx shadcn@latest init -d
pnpm --filter web dlx shadcn@latest add button input card
```

- [ ] **Step 3: Create .env.local.example**

`apps/web/.env.local.example`:
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_API_URL=http://localhost:3001
```

Copy to a real `.env.local` for local dev (not committed).

- [ ] **Step 4: Wrap the app in ClerkProvider**

Modify `apps/web/app/layout.tsx`:
```typescript
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}
```

- [ ] **Step 5: Add Clerk middleware**

`apps/web/middleware.ts`:
```typescript
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher(["/", "/sign-in(.*)", "/sign-up(.*)"]);

export default clerkMiddleware((auth, req) => {
  if (!isPublicRoute(req)) {
    auth().protect();
  }
});

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)"],
};
```

- [ ] **Step 6: Create the API client helper**

`apps/web/lib/api-client.ts`:
```typescript
import { auth } from "@clerk/nextjs/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

async function authorizedFetch(path: string, init?: RequestInit) {
  const { getToken } = auth();
  const token = await getToken();

  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      ...init?.headers,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(body.message ?? "Request failed");
  }

  return response.json();
}

export const apiClient = {
  get: (path: string) => authorizedFetch(path, { method: "GET" }),
  post: (path: string, body: unknown) =>
    authorizedFetch(path, { method: "POST", body: JSON.stringify(body) }),
};
```

- [ ] **Step 7: Create the trainer dashboard shell page**

`apps/web/app/(trainer)/dashboard/page.tsx`:
```typescript
export default function DashboardPage() {
  return (
    <main className="p-8">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <p className="text-muted-foreground">
        Business metrics land here in a later sub-project.
      </p>
    </main>
  );
}
```

- [ ] **Step 8: Create the client list + invite page**

`apps/web/app/(trainer)/clients/page.tsx`:
```typescript
import { apiClient } from "@/lib/api-client";
import { InviteClientForm } from "./invite-client-form";
import type { ClientSummary } from "@trainflow/shared-types";

export default async function ClientsPage() {
  const clients: ClientSummary[] = await apiClient.get("/clients");

  return (
    <main className="p-8 space-y-6">
      <h1 className="text-2xl font-semibold">Clients</h1>
      <InviteClientForm />
      <ul className="space-y-2">
        {clients.map((client) => (
          <li key={client.id} className="border rounded p-3">
            <span className="font-medium">{client.name}</span>{" "}
            <span className="text-muted-foreground">({client.status})</span>
          </li>
        ))}
      </ul>
    </main>
  );
}
```

- [ ] **Step 9: Create the invite form client component**

`apps/web/app/(trainer)/clients/invite-client-form.tsx`:
```typescript
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { InviteClientInputSchema } from "@trainflow/shared-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function InviteClientForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const parsed = InviteClientInputSchema.safeParse({ name, email });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid input");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/clients/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      if (!response.ok) throw new Error("Failed to invite client");
      setName("");
      setEmail("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 items-start">
      <Input placeholder="Client name" value={name} onChange={(e) => setName(e.target.value)} />
      <Input placeholder="Client email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <Button type="submit" disabled={submitting}>
        {submitting ? "Inviting..." : "Invite client"}
      </Button>
      {error && <p className="text-red-500 text-sm">{error}</p>}
    </form>
  );
}
```

Note: this posts to a same-origin `/api/clients/invite` route rather than calling `apiClient` directly from a client component, since Clerk session tokens are read server-side. Step 10 adds that route.

- [ ] **Step 10: Add the API proxy route so the client form can reach the NestJS API with the session token attached**

Create `apps/web/app/api/clients/invite/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { apiClient } from "@/lib/api-client";

export async function POST(req: NextRequest) {
  const body = await req.json();
  try {
    const result = await apiClient.post("/clients/invite", body);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { message: err instanceof Error ? err.message : "Failed to invite client" },
      { status: 400 },
    );
  }
}
```

- [ ] **Step 11: Verify the web app builds**

Run: `pnpm --filter web build`
Expected: build succeeds with no type errors.

- [ ] **Step 12: Commit**

```bash
git add apps/web
git commit -m "feat: add trainer dashboard shell with client invite flow"
```

---

## Post-Plan Manual Setup (not automatable by an engineer without accounts)

- Create Clerk application, set `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` / `CLERK_SECRET_KEY` in `apps/web/.env.local` and `CLERK_SECRET_KEY` in `apps/api/.env`.
- Configure Clerk webhook endpoint pointing to `POST {api_url}/trainers/signup-webhook` for `user.created` events where role=TRAINER.
- Create Supabase project, set `DATABASE_URL` in `packages/db/.env` and `apps/api/.env`.
- These are infrastructure/account steps, not code — flagged here so nothing silently fails for a missing env var.
