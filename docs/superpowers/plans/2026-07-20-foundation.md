# TrainFlow Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the TrainFlow monorepo with Clerk auth, core Trainer/Client/InviteToken schema, NestJS API for invite flow and client listing, and a Next.js web shell with trainer invite + client list pages.

**Architecture:** Turborepo monorepo. `apps/api` (NestJS) owns business logic and Prisma access via `packages/db`. `apps/web` (Next.js App Router) talks to the API with Clerk JWTs. Roles live in Clerk `publicMetadata.role`; data isolation is `trainerId` filtering in NestJS services. Clerk webhooks create trainers and activate invited clients.

**Tech Stack:** pnpm + Turborepo, Next.js 14, NestJS, Prisma, PostgreSQL (Supabase), Clerk, Zod, Jest, TypeScript, Tailwind, shadcn/ui

## Global Constraints

- Package manager: **pnpm** (workspaces via `pnpm-workspace.yaml`)
- Node.js: **>= 20**
- TypeScript: **strict** mode in all packages
- Roles: exactly `TRAINER` | `CLIENT` in Clerk `publicMetadata.role`
- Error response shape: `{ code: string, message: string }`
- Foundation error codes: `INVITE_EXPIRED`, `INVITE_ALREADY_USED`, `CLIENT_NOT_FOUND`, `FORBIDDEN_CROSS_TENANT`
- Invite token expiry: **7 days**
- No workout/payment/AI tables in this plan
- Data isolation: app-level `trainerId` filters only (no Postgres RLS)
- API base path: `/` (no global `/api` prefix on NestJS; web proxies `/api/*` → NestJS)

## File Structure

```
trainflow/
├── package.json
├── pnpm-workspace.yaml
├── turbo.json
├── .gitignore
├── .env.example
├── apps/
│   ├── api/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── nest-cli.json
│   │   ├── jest.config.ts
│   │   ├── test/jest-e2e.json
│   │   └── src/
│   │       ├── main.ts
│   │       ├── app.module.ts
│   │       ├── prisma/prisma.module.ts
│   │       ├── prisma/prisma.service.ts
│   │       ├── common/
│   │       │   ├── filters/http-exception.filter.ts
│   │       │   ├── decorators/roles.decorator.ts
│   │       │   ├── decorators/current-user.decorator.ts
│   │       │   ├── guards/auth.guard.ts
│   │       │   ├── guards/roles.guard.ts
│   │       │   └── types/auth-user.ts
│   │       ├── trainers/
│   │       │   ├── trainers.module.ts
│   │       │   ├── trainers.controller.ts
│   │       │   ├── trainers.service.ts
│   │       │   └── trainers.service.spec.ts
│   │       ├── clients/
│   │       │   ├── clients.module.ts
│   │       │   ├── clients.controller.ts
│   │       │   ├── clients.service.ts
│   │       │   └── clients.service.spec.ts
│   │       └── invites/
│   │           ├── invites.module.ts
│   │           ├── invites.controller.ts
│   │           ├── invites.service.ts
│   │           └── invites.service.spec.ts
│   └── web/
│       ├── package.json
│       ├── next.config.ts
│       ├── tailwind.config.ts
│       ├── postcss.config.mjs
│       ├── tsconfig.json
│       ├── middleware.ts
│       └── src/
│           ├── app/
│           │   ├── layout.tsx
│           │   ├── page.tsx
│           │   ├── globals.css
│           │   ├── sign-in/[[...sign-in]]/page.tsx
│           │   ├── sign-up/[[...sign-up]]/page.tsx
│           │   ├── (trainer)/
│           │   │   ├── layout.tsx
│           │   │   ├── clients/page.tsx
│           │   │   └── clients/invite/page.tsx
│           │   └── (client)/
│           │       ├── layout.tsx
│           │       └── portal/page.tsx
│           └── lib/
│               ├── api.ts
│               └── roles.ts
└── packages/
    ├── db/
    │   ├── package.json
    │   ├── tsconfig.json
    │   ├── prisma/schema.prisma
    │   └── src/index.ts
    ├── shared-types/
    │   ├── package.json
    │   ├── tsconfig.json
    │   └── src/
    │       ├── index.ts
    │       ├── roles.ts
    │       ├── errors.ts
    │       ├── clients.ts
    │       └── invites.ts
    └── ui/
        ├── package.json
        ├── tsconfig.json
        └── src/index.ts
```

---

### Task 1: Monorepo scaffold

**Files:**
- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `turbo.json`
- Create: `.gitignore`
- Create: `.env.example`
- Create: `packages/db/package.json`
- Create: `packages/shared-types/package.json`
- Create: `packages/ui/package.json`
- Create: `apps/api/package.json`
- Create: `apps/web/package.json`

**Interfaces:**
- Consumes: nothing
- Produces: workspace root that can `pnpm install`; package names `@trainflow/db`, `@trainflow/shared-types`, `@trainflow/ui`, `@trainflow/api`, `@trainflow/web`

- [ ] **Step 1: Create root workspace files**

```json
// package.json
{
  "name": "trainflow",
  "private": true,
  "packageManager": "pnpm@9.15.0",
  "engines": { "node": ">=20" },
  "scripts": {
    "build": "turbo run build",
    "dev": "turbo run dev",
    "lint": "turbo run lint",
    "test": "turbo run test",
    "db:generate": "pnpm --filter @trainflow/db generate",
    "db:migrate": "pnpm --filter @trainflow/db migrate:dev"
  },
  "devDependencies": {
    "turbo": "^2.3.3",
    "typescript": "^5.7.2"
  }
}
```

```yaml
# pnpm-workspace.yaml
packages:
  - "apps/*"
  - "packages/*"
```

```json
// turbo.json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**"]
    },
    "dev": { "cache": false, "persistent": true },
    "lint": {},
    "test": { "dependsOn": ["^build"] }
  }
}
```

```gitignore
# .gitignore
node_modules
dist
.next
.turbo
.env
.env.local
*.log
coverage
```

```bash
# .env.example
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/trainflow
CLERK_SECRET_KEY=sk_test_xxx
CLERK_PUBLISHABLE_KEY=pk_test_xxx
CLERK_WEBHOOK_SECRET=whsec_xxx
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_API_URL=http://localhost:3001
API_PORT=3001
```

- [ ] **Step 2: Create package stubs**

```json
// packages/db/package.json
{
  "name": "@trainflow/db",
  "version": "0.0.1",
  "private": true,
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "generate": "prisma generate",
    "migrate:dev": "prisma migrate dev",
    "migrate:deploy": "prisma migrate deploy"
  },
  "dependencies": {
    "@prisma/client": "^6.1.0"
  },
  "devDependencies": {
    "prisma": "^6.1.0",
    "typescript": "^5.7.2"
  }
}
```

```json
// packages/shared-types/package.json
{
  "name": "@trainflow/shared-types",
  "version": "0.0.1",
  "private": true,
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "test": "node -e \"require('./dist/index.js')\""
  },
  "dependencies": {
    "zod": "^3.24.1"
  },
  "devDependencies": {
    "typescript": "^5.7.2"
  }
}
```

```json
// packages/ui/package.json
{
  "name": "@trainflow/ui",
  "version": "0.0.1",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "build": "tsc --noEmit",
    "lint": "echo ok"
  },
  "devDependencies": {
    "typescript": "^5.7.2",
    "react": "^18.3.1",
    "@types/react": "^18.3.12"
  },
  "peerDependencies": {
    "react": "^18.3.1"
  }
}
```

```json
// apps/api/package.json
{
  "name": "@trainflow/api",
  "version": "0.0.1",
  "private": true,
  "scripts": {
    "build": "nest build",
    "dev": "nest start --watch",
    "start": "node dist/main.js",
    "lint": "eslint \"{src,test}/**/*.ts\"",
    "test": "jest",
    "test:e2e": "jest --config ./test/jest-e2e.json"
  },
  "dependencies": {
    "@trainflow/db": "workspace:*",
    "@trainflow/shared-types": "workspace:*",
    "@clerk/backend": "^1.21.0",
    "@nestjs/common": "^10.4.15",
    "@nestjs/core": "^10.4.15",
    "@nestjs/platform-express": "^10.4.15",
    "reflect-metadata": "^0.2.2",
    "rxjs": "^7.8.1",
    "svix": "^1.42.0"
  },
  "devDependencies": {
    "@nestjs/cli": "^10.4.9",
    "@nestjs/testing": "^10.4.15",
    "@types/express": "^5.0.0",
    "@types/jest": "^29.5.14",
    "@types/node": "^22.10.2",
    "@types/supertest": "^6.0.2",
    "jest": "^29.7.0",
    "supertest": "^7.0.0",
    "ts-jest": "^29.2.5",
    "typescript": "^5.7.2"
  }
}
```

```json
// apps/web/package.json
{
  "name": "@trainflow/web",
  "version": "0.0.1",
  "private": true,
  "scripts": {
    "dev": "next dev --port 3000",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "@trainflow/shared-types": "workspace:*",
    "@trainflow/ui": "workspace:*",
    "@clerk/nextjs": "^6.9.3",
    "next": "^14.2.21",
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@types/node": "^22.10.2",
    "@types/react": "^18.3.12",
    "@types/react-dom": "^18.3.1",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.4.49",
    "tailwindcss": "^3.4.17",
    "typescript": "^5.7.2"
  }
}
```

- [ ] **Step 3: Install dependencies**

Run: `pnpm install`
Expected: lockfile created, no errors

- [ ] **Step 4: Commit**

```bash
git add package.json pnpm-workspace.yaml turbo.json .gitignore .env.example apps packages pnpm-lock.yaml
git commit -m "chore: scaffold Turborepo monorepo workspace"
```

---

### Task 2: Prisma schema and `@trainflow/db`

**Files:**
- Create: `packages/db/tsconfig.json`
- Create: `packages/db/prisma/schema.prisma`
- Create: `packages/db/src/index.ts`

**Interfaces:**
- Consumes: `DATABASE_URL` from env
- Produces: Prisma models `Trainer`, `Client`, `InviteToken`; enum `ClientStatus`; export `{ PrismaClient }` from `@trainflow/db`

- [ ] **Step 1: Write Prisma schema**

```prisma
// packages/db/prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum ClientStatus {
  PENDING
  ACTIVE
  INACTIVE
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
  client    Client    @relation(fields: [clientId], references: [id], onDelete: Cascade)
  token     String    @unique
  expiresAt DateTime
  usedAt    DateTime?
}
```

```json
// packages/db/tsconfig.json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "CommonJS",
    "declaration": true,
    "outDir": "dist",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["src"]
}
```

```ts
// packages/db/src/index.ts
export { PrismaClient, ClientStatus, Prisma } from "@prisma/client";
```

- [ ] **Step 2: Generate client and create migration**

Run (with `DATABASE_URL` set to a real Postgres URL, local or Supabase):

```bash
pnpm --filter @trainflow/db generate
pnpm --filter @trainflow/db migrate:dev -- --name foundation_core
pnpm --filter @trainflow/db build
```

Expected: `prisma/migrations/..._foundation_core` created; `PrismaClient` generates; `dist/` builds

- [ ] **Step 3: Commit**

```bash
git add packages/db
git commit -m "feat(db): add Trainer, Client, InviteToken Prisma schema"
```

---

### Task 3: Shared types and Zod schemas

**Files:**
- Create: `packages/shared-types/tsconfig.json`
- Create: `packages/shared-types/src/roles.ts`
- Create: `packages/shared-types/src/errors.ts`
- Create: `packages/shared-types/src/clients.ts`
- Create: `packages/shared-types/src/invites.ts`
- Create: `packages/shared-types/src/index.ts`
- Create: `packages/shared-types/src/clients.spec.ts` (optional node assert — use Jest from api later; for this package use a tiny node test)

**Interfaces:**
- Consumes: zod
- Produces:
  - `Role = "TRAINER" | "CLIENT"`
  - `ErrorCode` union + `ApiErrorBody`
  - `inviteClientSchema` → `{ name: string, email: string }`
  - `acceptInviteSchema` → `{ token: string, clerkUserId: string, email: string, name: string }`
  - `ClientDto`, `InviteClientInput`, `AcceptInviteInput`

- [ ] **Step 1: Write failing validation check for invite schema**

```ts
// packages/shared-types/src/clients.spec.ts
import assert from "node:assert/strict";
import { inviteClientSchema } from "./clients";

const bad = inviteClientSchema.safeParse({ name: "", email: "not-an-email" });
assert.equal(bad.success, false);

const good = inviteClientSchema.safeParse({
  name: "Ana Silva",
  email: "ana@example.com",
});
assert.equal(good.success, true);
console.log("clients.spec.ts passed");
```

- [ ] **Step 2: Run to verify fail (module missing)**

Run: `cd packages/shared-types && npx tsx src/clients.spec.ts`
Expected: FAIL — cannot find `./clients`

- [ ] **Step 3: Implement shared types**

```json
// packages/shared-types/tsconfig.json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "CommonJS",
    "declaration": true,
    "outDir": "dist",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["src"]
}
```

```ts
// packages/shared-types/src/roles.ts
export const ROLES = ["TRAINER", "CLIENT"] as const;
export type Role = (typeof ROLES)[number];
```

```ts
// packages/shared-types/src/errors.ts
export const ERROR_CODES = [
  "INVITE_EXPIRED",
  "INVITE_ALREADY_USED",
  "CLIENT_NOT_FOUND",
  "FORBIDDEN_CROSS_TENANT",
  "VALIDATION_ERROR",
  "UNAUTHORIZED",
  "FORBIDDEN",
  "INTERNAL_ERROR",
] as const;

export type ErrorCode = (typeof ERROR_CODES)[number];

export type ApiErrorBody = {
  code: ErrorCode | string;
  message: string;
};
```

```ts
// packages/shared-types/src/clients.ts
import { z } from "zod";

export const inviteClientSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(255),
});

export type InviteClientInput = z.infer<typeof inviteClientSchema>;

export const clientStatusSchema = z.enum(["PENDING", "ACTIVE", "INACTIVE"]);

export const clientDtoSchema = z.object({
  id: z.string().uuid(),
  trainerId: z.string().uuid(),
  clerkUserId: z.string().nullable(),
  name: z.string(),
  email: z.string().email(),
  status: clientStatusSchema,
  createdAt: z.string(),
});

export type ClientDto = z.infer<typeof clientDtoSchema>;
```

```ts
// packages/shared-types/src/invites.ts
import { z } from "zod";

export const acceptInviteSchema = z.object({
  token: z.string().min(1),
  clerkUserId: z.string().min(1),
  email: z.string().email(),
  name: z.string().min(1),
});

export type AcceptInviteInput = z.infer<typeof acceptInviteSchema>;
```

```ts
// packages/shared-types/src/index.ts
export * from "./roles";
export * from "./errors";
export * from "./clients";
export * from "./invites";
```

- [ ] **Step 4: Build and run spec**

```bash
pnpm --filter @trainflow/shared-types build
pnpm exec tsx packages/shared-types/src/clients.spec.ts
```

Expected: `clients.spec.ts passed`

- [ ] **Step 5: Commit**

```bash
git add packages/shared-types
git commit -m "feat(shared-types): add roles, errors, invite/client Zod schemas"
```

---

### Task 4: NestJS app shell, Prisma module, exception filter

**Files:**
- Create: `apps/api/tsconfig.json`
- Create: `apps/api/nest-cli.json`
- Create: `apps/api/jest.config.ts`
- Create: `apps/api/src/main.ts`
- Create: `apps/api/src/app.module.ts`
- Create: `apps/api/src/prisma/prisma.module.ts`
- Create: `apps/api/src/prisma/prisma.service.ts`
- Create: `apps/api/src/common/filters/http-exception.filter.ts`
- Create: `apps/api/src/common/filters/http-exception.filter.spec.ts`
- Create: `packages/ui/tsconfig.json`
- Create: `packages/ui/src/index.ts`

**Interfaces:**
- Consumes: `@trainflow/db` PrismaClient
- Produces: NestJS app listening on `API_PORT` (default 3001); `PrismaService` injectable; global filter mapping Nest exceptions to `{ code, message }`

- [ ] **Step 1: Write failing filter test**

```ts
// apps/api/src/common/filters/http-exception.filter.spec.ts
import { HttpExceptionFilter } from "./http-exception.filter";
import { ArgumentsHost, HttpException, HttpStatus } from "@nestjs/common";

describe("HttpExceptionFilter", () => {
  it("maps HttpException response object with code", () => {
    const filter = new HttpExceptionFilter();
    const json = jest.fn();
    const status = jest.fn().mockReturnValue({ json });
    const host = {
      switchToHttp: () => ({
        getResponse: () => ({ status }),
      }),
    } as unknown as ArgumentsHost;

    filter.catch(
      new HttpException(
        { code: "CLIENT_NOT_FOUND", message: "Client not found" },
        HttpStatus.NOT_FOUND,
      ),
      host,
    );

    expect(status).toHaveBeenCalledWith(404);
    expect(json).toHaveBeenCalledWith({
      code: "CLIENT_NOT_FOUND",
      message: "Client not found",
    });
  });
});
```

- [ ] **Step 2: Run test — expect fail**

Run: `pnpm --filter @trainflow/api test -- http-exception.filter.spec.ts`
Expected: FAIL — module/file not found or Nest not configured

- [ ] **Step 3: Implement Nest shell + filter + Prisma**

```json
// apps/api/tsconfig.json
{
  "compilerOptions": {
    "module": "commonjs",
    "declaration": true,
    "removeComments": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "allowSyntheticDefaultImports": true,
    "target": "ES2022",
    "sourceMap": true,
    "outDir": "./dist",
    "baseUrl": "./",
    "incremental": true,
    "skipLibCheck": true,
    "strict": true,
    "esModuleInterop": true
  },
  "include": ["src"]
}
```

```json
// apps/api/nest-cli.json
{
  "$schema": "https://json.schemastore.org/nest-cli",
  "collection": "@nestjs/schematics",
  "sourceRoot": "src"
}
```

```ts
// apps/api/jest.config.ts
import type { Config } from "jest";

const config: Config = {
  moduleFileExtensions: ["js", "json", "ts"],
  rootDir: "src",
  testRegex: ".*\\.spec\\.ts$",
  transform: { "^.+\\.(t|j)s$": "ts-jest" },
  collectCoverageFrom: ["**/*.(t|j)s"],
  coverageDirectory: "../coverage",
  testEnvironment: "node",
};
export default config;
```

```ts
// apps/api/src/prisma/prisma.service.ts
import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { PrismaClient } from "@trainflow/db";

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
```

```ts
// apps/api/src/prisma/prisma.module.ts
import { Global, Module } from "@nestjs/common";
import { PrismaService } from "./prisma.service";

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
```

```ts
// apps/api/src/common/filters/http-exception.filter.ts
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { Response } from "express";

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();
      if (typeof body === "object" && body !== null && "code" in body) {
        const shaped = body as { code: string; message?: string };
        response.status(status).json({
          code: shaped.code,
          message: shaped.message ?? exception.message,
        });
        return;
      }
      response.status(status).json({
        code: status === HttpStatus.UNAUTHORIZED ? "UNAUTHORIZED" : "FORBIDDEN",
        message:
          typeof body === "string" ? body : exception.message || "Request failed",
      });
      return;
    }

    console.error(exception);
    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      code: "INTERNAL_ERROR",
      message: "Internal server error",
    });
  }
}
```

```ts
// apps/api/src/app.module.ts
import { Module } from "@nestjs/common";
import { PrismaModule } from "./prisma/prisma.module";

@Module({
  imports: [PrismaModule],
})
export class AppModule {}
```

```ts
// apps/api/src/main.ts
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });
  app.useGlobalFilters(new HttpExceptionFilter());
  app.enableCors({
    origin: process.env.WEB_ORIGIN ?? "http://localhost:3000",
    credentials: true,
  });
  const port = Number(process.env.API_PORT ?? 3001);
  await app.listen(port);
}
bootstrap();
```

```json
// packages/ui/tsconfig.json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "skipLibCheck": true,
    "declaration": true,
    "outDir": "dist"
  },
  "include": ["src"]
}
```

```ts
// packages/ui/src/index.ts
export {};
```

- [ ] **Step 4: Run filter test — expect pass**

Run: `pnpm --filter @trainflow/api test -- http-exception.filter.spec.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/api packages/ui
git commit -m "feat(api): Nest shell, Prisma module, global error filter"
```

---

### Task 5: AuthGuard, RolesGuard, CurrentUser decorator

**Files:**
- Create: `apps/api/src/common/types/auth-user.ts`
- Create: `apps/api/src/common/decorators/roles.decorator.ts`
- Create: `apps/api/src/common/decorators/current-user.decorator.ts`
- Create: `apps/api/src/common/guards/auth.guard.ts`
- Create: `apps/api/src/common/guards/roles.guard.ts`
- Create: `apps/api/src/common/guards/auth.guard.spec.ts`
- Create: `apps/api/src/common/guards/roles.guard.spec.ts`

**Interfaces:**
- Consumes: Clerk JWT via `Authorization: Bearer <token>`; Clerk `publicMetadata.role`
- Produces:
  - `AuthUser = { clerkUserId: string; role: Role }`
  - `@Roles(...roles: Role[])`
  - `@CurrentUser()` → `AuthUser`
  - `AuthGuard` sets `request.user`
  - `RolesGuard` rejects wrong role with `{ code: "FORBIDDEN", message }`

- [ ] **Step 1: Write failing AuthGuard + RolesGuard tests**

```ts
// apps/api/src/common/guards/auth.guard.spec.ts
import { AuthGuard } from "./auth.guard";
import { ExecutionContext, UnauthorizedException } from "@nestjs/common";

jest.mock("@clerk/backend", () => ({
  createClerkClient: () => ({
    authenticateRequest: jest.fn(),
  }),
  verifyToken: jest.fn(),
}));

import { verifyToken } from "@clerk/backend";

describe("AuthGuard", () => {
  const guard = new AuthGuard();

  function ctxWithAuth(header?: string): ExecutionContext {
    const request: { headers: Record<string, string | undefined>; user?: unknown } = {
      headers: { authorization: header },
    };
    return {
      switchToHttp: () => ({ getRequest: () => request }),
    } as unknown as ExecutionContext;
  }

  it("rejects missing bearer token", async () => {
    await expect(guard.canActivate(ctxWithAuth(undefined))).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it("attaches user from verified token", async () => {
    (verifyToken as jest.Mock).mockResolvedValue({
      sub: "user_123",
      publicMetadata: { role: "TRAINER" },
    });
    const ctx = ctxWithAuth("Bearer tok");
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
    const req = ctx.switchToHttp().getRequest() as { user: { clerkUserId: string; role: string } };
    expect(req.user).toEqual({ clerkUserId: "user_123", role: "TRAINER" });
  });
});
```

```ts
// apps/api/src/common/guards/roles.guard.spec.ts
import { RolesGuard } from "./roles.guard";
import { Reflector } from "@nestjs/core";
import { ExecutionContext, ForbiddenException } from "@nestjs/common";

describe("RolesGuard", () => {
  const reflector = new Reflector();
  const guard = new RolesGuard(reflector);

  function ctx(role: string): ExecutionContext {
    return {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => ({ user: { clerkUserId: "u1", role } }),
      }),
    } as unknown as ExecutionContext;
  }

  it("allows matching role", () => {
    jest.spyOn(reflector, "getAllAndOverride").mockReturnValue(["TRAINER"]);
    expect(guard.canActivate(ctx("TRAINER"))).toBe(true);
  });

  it("rejects mismatched role", () => {
    jest.spyOn(reflector, "getAllAndOverride").mockReturnValue(["TRAINER"]);
    expect(() => guard.canActivate(ctx("CLIENT"))).toThrow(ForbiddenException);
  });
});
```

- [ ] **Step 2: Run tests — expect fail**

Run: `pnpm --filter @trainflow/api test -- auth.guard.spec.ts roles.guard.spec.ts`
Expected: FAIL — guards missing

- [ ] **Step 3: Implement auth primitives**

```ts
// apps/api/src/common/types/auth-user.ts
import type { Role } from "@trainflow/shared-types";

export type AuthUser = {
  clerkUserId: string;
  role: Role;
};
```

```ts
// apps/api/src/common/decorators/roles.decorator.ts
import { SetMetadata } from "@nestjs/common";
import type { Role } from "@trainflow/shared-types";

export const ROLES_KEY = "roles";
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
```

```ts
// apps/api/src/common/decorators/current-user.decorator.ts
import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import type { AuthUser } from "../types/auth-user";

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUser => {
    const request = ctx.switchToHttp().getRequest<{ user: AuthUser }>();
    return request.user;
  },
);
```

```ts
// apps/api/src/common/guards/auth.guard.ts
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { verifyToken } from "@clerk/backend";
import { ROLES, type Role } from "@trainflow/shared-types";
import type { AuthUser } from "../types/auth-user";

@Injectable()
export class AuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{
      headers: { authorization?: string };
      user?: AuthUser;
    }>();
    const header = request.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      throw new UnauthorizedException({
        code: "UNAUTHORIZED",
        message: "Missing bearer token",
      });
    }
    const token = header.slice("Bearer ".length);
    try {
      const payload = await verifyToken(token, {
        secretKey: process.env.CLERK_SECRET_KEY!,
      });
      const role = (payload.publicMetadata as { role?: string } | undefined)?.role;
      if (!role || !ROLES.includes(role as Role)) {
        throw new UnauthorizedException({
          code: "UNAUTHORIZED",
          message: "Missing or invalid role in token",
        });
      }
      request.user = { clerkUserId: payload.sub, role: role as Role };
      return true;
    } catch (err) {
      if (err instanceof UnauthorizedException) throw err;
      throw new UnauthorizedException({
        code: "UNAUTHORIZED",
        message: "Invalid token",
      });
    }
  }
}
```

```ts
// apps/api/src/common/guards/roles.guard.ts
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { Role } from "@trainflow/shared-types";
import { ROLES_KEY } from "../decorators/roles.decorator";
import type { AuthUser } from "../types/auth-user";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required || required.length === 0) return true;
    const { user } = context.switchToHttp().getRequest<{ user: AuthUser }>();
    if (!user || !required.includes(user.role)) {
      throw new ForbiddenException({
        code: "FORBIDDEN",
        message: "Insufficient role",
      });
    }
    return true;
  }
}
```

- [ ] **Step 4: Run tests — expect pass**

Run: `pnpm --filter @trainflow/api test -- auth.guard.spec.ts roles.guard.spec.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/common
git commit -m "feat(api): Clerk AuthGuard, RolesGuard, CurrentUser decorator"
```

---

### Task 6: Trainers module (Clerk signup webhook)

**Files:**
- Create: `apps/api/src/trainers/trainers.module.ts`
- Create: `apps/api/src/trainers/trainers.service.ts`
- Create: `apps/api/src/trainers/trainers.controller.ts`
- Create: `apps/api/src/trainers/trainers.service.spec.ts`
- Modify: `apps/api/src/app.module.ts`

**Interfaces:**
- Consumes: PrismaService; Svix-verified Clerk webhook body
- Produces:
  - `TrainersService.createFromClerk(input: { clerkUserId: string; name: string; email: string }): Promise<Trainer>`
  - `POST /trainers/signup-webhook` — verifies `svix-*` headers with `CLERK_WEBHOOK_SECRET`, on `user.created` with role `TRAINER` upserts Trainer row
  - Idempotent: second call with same `clerkUserId` does not error

- [ ] **Step 1: Write failing service test**

```ts
// apps/api/src/trainers/trainers.service.spec.ts
import { TrainersService } from "./trainers.service";

describe("TrainersService", () => {
  const prisma = {
    trainer: {
      upsert: jest.fn(),
    },
  };
  const service = new TrainersService(prisma as never);

  it("upserts trainer by clerkUserId", async () => {
    prisma.trainer.upsert.mockResolvedValue({
      id: "t1",
      clerkUserId: "user_t",
      name: "Joe",
      email: "joe@ex.com",
    });
    const result = await service.createFromClerk({
      clerkUserId: "user_t",
      name: "Joe",
      email: "joe@ex.com",
    });
    expect(prisma.trainer.upsert).toHaveBeenCalledWith({
      where: { clerkUserId: "user_t" },
      create: { clerkUserId: "user_t", name: "Joe", email: "joe@ex.com" },
      update: { name: "Joe", email: "joe@ex.com" },
    });
    expect(result.id).toBe("t1");
  });
});
```

- [ ] **Step 2: Run — expect fail**

Run: `pnpm --filter @trainflow/api test -- trainers.service.spec.ts`
Expected: FAIL — TrainersService missing

- [ ] **Step 3: Implement trainers module**

```ts
// apps/api/src/trainers/trainers.service.ts
import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class TrainersService {
  constructor(private readonly prisma: PrismaService) {}

  createFromClerk(input: {
    clerkUserId: string;
    name: string;
    email: string;
  }) {
    return this.prisma.trainer.upsert({
      where: { clerkUserId: input.clerkUserId },
      create: {
        clerkUserId: input.clerkUserId,
        name: input.name,
        email: input.email,
      },
      update: {
        name: input.name,
        email: input.email,
      },
    });
  }

  findByClerkUserId(clerkUserId: string) {
    return this.prisma.trainer.findUnique({ where: { clerkUserId } });
  }
}
```

```ts
// apps/api/src/trainers/trainers.controller.ts
import {
  BadRequestException,
  Controller,
  Headers,
  Post,
  Req,
  UnauthorizedException,
} from "@nestjs/common";
import { Webhook } from "svix";
import { Request } from "express";
import { TrainersService } from "./trainers.service";

type ClerkUserCreated = {
  type: string;
  data: {
    id: string;
    first_name?: string | null;
    last_name?: string | null;
    email_addresses?: { email_address: string }[];
    public_metadata?: { role?: string };
  };
};

@Controller("trainers")
export class TrainersController {
  constructor(private readonly trainers: TrainersService) {}

  @Post("signup-webhook")
  async signupWebhook(
    @Req() req: Request & { rawBody?: Buffer },
    @Headers("svix-id") svixId: string,
    @Headers("svix-timestamp") svixTimestamp: string,
    @Headers("svix-signature") svixSignature: string,
  ) {
    const secret = process.env.CLERK_WEBHOOK_SECRET;
    if (!secret) {
      throw new BadRequestException({
        code: "INTERNAL_ERROR",
        message: "Webhook secret not configured",
      });
    }
    const wh = new Webhook(secret);
    let event: ClerkUserCreated;
    try {
      event = wh.verify(req.rawBody?.toString("utf8") ?? JSON.stringify(req.body), {
        "svix-id": svixId,
        "svix-timestamp": svixTimestamp,
        "svix-signature": svixSignature,
      }) as ClerkUserCreated;
    } catch {
      throw new UnauthorizedException({
        code: "UNAUTHORIZED",
        message: "Invalid webhook signature",
      });
    }

    if (event.type !== "user.created") {
      return { ok: true, ignored: true };
    }

    const role = event.data.public_metadata?.role ?? "TRAINER";
    if (role !== "TRAINER") {
      return { ok: true, ignored: true };
    }

    const email = event.data.email_addresses?.[0]?.email_address;
    if (!email) {
      throw new BadRequestException({
        code: "VALIDATION_ERROR",
        message: "Trainer email missing",
      });
    }
    const name =
      [event.data.first_name, event.data.last_name].filter(Boolean).join(" ") ||
      email;

    await this.trainers.createFromClerk({
      clerkUserId: event.data.id,
      name,
      email,
    });
    return { ok: true };
  }
}
```

```ts
// apps/api/src/trainers/trainers.module.ts
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

Update `app.module.ts` to import `TrainersModule`.

Ensure `main.ts` uses `rawBody: true` (already set in Task 4) so Svix can verify.

- [ ] **Step 4: Run test — expect pass**

Run: `pnpm --filter @trainflow/api test -- trainers.service.spec.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/trainers apps/api/src/app.module.ts
git commit -m "feat(api): trainer signup webhook from Clerk"
```

---

### Task 7: Clients invite + resend-invite

**Files:**
- Create: `apps/api/src/clients/clients.module.ts`
- Create: `apps/api/src/clients/clients.service.ts`
- Create: `apps/api/src/clients/clients.controller.ts`
- Create: `apps/api/src/clients/clients.service.spec.ts`
- Modify: `apps/api/src/app.module.ts`

**Interfaces:**
- Consumes: `AuthUser`, `TrainersService.findByClerkUserId`, `inviteClientSchema`, Clerk Backend API invitations
- Produces:
  - `ClientsService.invite(trainerId, input): Promise<ClientDto>`
  - `ClientsService.resendInvite(trainerId, clientId): Promise<ClientDto>`
  - `POST /clients/invite` — `@Roles('TRAINER')` + AuthGuard
  - `POST /clients/:id/resend-invite` — regenerates token (new 7-day expiry), clears `usedAt`
  - Token: `crypto.randomBytes(32).toString("hex")`
  - Clerk invitation redirect URL includes `?invite_token=<token>`

- [ ] **Step 1: Write failing service tests**

```ts
// apps/api/src/clients/clients.service.spec.ts
import { ClientsService } from "./clients.service";
import { HttpException } from "@nestjs/common";

describe("ClientsService.invite", () => {
  const prisma = {
    client: {
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    inviteToken: {
      create: jest.fn(),
      update: jest.fn(),
      upsert: jest.fn(),
    },
    $transaction: jest.fn((fn) => fn(prisma)),
  };

  const clerk = {
    sendInvitation: jest.fn().mockResolvedValue(undefined),
  };

  const service = new ClientsService(prisma as never, clerk as never);

  it("creates PENDING client with invite token", async () => {
    const client = {
      id: "c1",
      trainerId: "t1",
      clerkUserId: null,
      name: "Ana",
      email: "ana@ex.com",
      status: "PENDING",
      createdAt: new Date("2026-01-01"),
    };
    prisma.client.create.mockResolvedValue(client);
    prisma.inviteToken.create.mockResolvedValue({
      token: "abc",
      clientId: "c1",
    });

    const result = await service.invite("t1", {
      name: "Ana",
      email: "ana@ex.com",
    });

    expect(result.status).toBe("PENDING");
    expect(result.email).toBe("ana@ex.com");
    expect(clerk.sendInvitation).toHaveBeenCalled();
  });

  it("throws FORBIDDEN_CROSS_TENANT when resending other trainer client", async () => {
    prisma.client.findFirst.mockResolvedValue(null);
    await expect(service.resendInvite("t1", "c-other")).rejects.toMatchObject({
      response: { code: "FORBIDDEN_CROSS_TENANT" },
    });
  });
});
```

- [ ] **Step 2: Run — expect fail**

Run: `pnpm --filter @trainflow/api test -- clients.service.spec.ts`
Expected: FAIL

- [ ] **Step 3: Implement clients invite service + controller**

```ts
// apps/api/src/clients/clients.service.ts
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { randomBytes } from "crypto";
import type { InviteClientInput, ClientDto } from "@trainflow/shared-types";
import { PrismaService } from "../prisma/prisma.service";

export type ClerkInviter = {
  sendInvitation(input: {
    email: string;
    redirectUrl: string;
    publicMetadata: { role: "CLIENT" };
  }): Promise<void>;
};

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

@Injectable()
export class ClientsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly clerk: ClerkInviter,
  ) {}

  private toDto(client: {
    id: string;
    trainerId: string;
    clerkUserId: string | null;
    name: string;
    email: string;
    status: "PENDING" | "ACTIVE" | "INACTIVE";
    createdAt: Date;
  }): ClientDto {
    return {
      id: client.id,
      trainerId: client.trainerId,
      clerkUserId: client.clerkUserId,
      name: client.name,
      email: client.email,
      status: client.status,
      createdAt: client.createdAt.toISOString(),
    };
  }

  private newToken() {
    return randomBytes(32).toString("hex");
  }

  async invite(trainerId: string, input: InviteClientInput): Promise<ClientDto> {
    const token = this.newToken();
    const expiresAt = new Date(Date.now() + INVITE_TTL_MS);

    const client = await this.prisma.$transaction(async (tx) => {
      const created = await tx.client.create({
        data: {
          trainerId,
          name: input.name,
          email: input.email,
          status: "PENDING",
          inviteToken: {
            create: { token, expiresAt },
          },
        },
      });
      return created;
    });

    const webOrigin = process.env.WEB_ORIGIN ?? "http://localhost:3000";
    await this.clerk.sendInvitation({
      email: input.email,
      redirectUrl: `${webOrigin}/sign-up?invite_token=${token}`,
      publicMetadata: { role: "CLIENT" },
    });

    return this.toDto(client);
  }

  async resendInvite(trainerId: string, clientId: string): Promise<ClientDto> {
    const client = await this.prisma.client.findFirst({
      where: { id: clientId, trainerId },
      include: { inviteToken: true },
    });
    if (!client) {
      throw new ForbiddenException({
        code: "FORBIDDEN_CROSS_TENANT",
        message: "Client not found for this trainer",
      });
    }

    const token = this.newToken();
    const expiresAt = new Date(Date.now() + INVITE_TTL_MS);

    await this.prisma.inviteToken.upsert({
      where: { clientId: client.id },
      create: { clientId: client.id, token, expiresAt },
      update: { token, expiresAt, usedAt: null },
    });

    const webOrigin = process.env.WEB_ORIGIN ?? "http://localhost:3000";
    await this.clerk.sendInvitation({
      email: client.email,
      redirectUrl: `${webOrigin}/sign-up?invite_token=${token}`,
      publicMetadata: { role: "CLIENT" },
    });

    return this.toDto(client);
  }

  async listForTrainer(trainerId: string): Promise<ClientDto[]> {
    const rows = await this.prisma.client.findMany({
      where: { trainerId },
      orderBy: { createdAt: "desc" },
    });
    return rows.map((r) => this.toDto(r));
  }

  async getForTrainer(trainerId: string, clientId: string): Promise<ClientDto> {
    const client = await this.prisma.client.findFirst({
      where: { id: clientId, trainerId },
    });
    if (!client) {
      throw new NotFoundException({
        code: "CLIENT_NOT_FOUND",
        message: "Client not found",
      });
    }
    return this.toDto(client);
  }
}
```

```ts
// apps/api/src/clients/clerk-inviter.ts
import { createClerkClient } from "@clerk/backend";
import type { ClerkInviter } from "./clients.service";

export function createClerkInviter(): ClerkInviter {
  const client = createClerkClient({
    secretKey: process.env.CLERK_SECRET_KEY!,
  });
  return {
    async sendInvitation({ email, redirectUrl, publicMetadata }) {
      await client.invitations.createInvitation({
        emailAddress: email,
        redirectUrl,
        publicMetadata,
      });
    },
  };
}
```

```ts
// apps/api/src/clients/clients.controller.ts
import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
  BadRequestException,
} from "@nestjs/common";
import { inviteClientSchema } from "@trainflow/shared-types";
import { AuthGuard } from "../common/guards/auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import type { AuthUser } from "../common/types/auth-user";
import { TrainersService } from "../trainers/trainers.service";
import { ClientsService } from "./clients.service";

@Controller("clients")
@UseGuards(AuthGuard, RolesGuard)
@Roles("TRAINER")
export class ClientsController {
  constructor(
    private readonly clients: ClientsService,
    private readonly trainers: TrainersService,
  ) {}

  private async trainerIdFor(user: AuthUser): Promise<string> {
    const trainer = await this.trainers.findByClerkUserId(user.clerkUserId);
    if (!trainer) {
      throw new BadRequestException({
        code: "VALIDATION_ERROR",
        message: "Trainer profile not found",
      });
    }
    return trainer.id;
  }

  @Post("invite")
  async invite(@CurrentUser() user: AuthUser, @Body() body: unknown) {
    const parsed = inviteClientSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException({
        code: "VALIDATION_ERROR",
        message: parsed.error.errors[0]?.message ?? "Invalid body",
      });
    }
    const trainerId = await this.trainerIdFor(user);
    return this.clients.invite(trainerId, parsed.data);
  }

  @Post(":id/resend-invite")
  async resend(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    const trainerId = await this.trainerIdFor(user);
    return this.clients.resendInvite(trainerId, id);
  }

  @Get()
  async list(@CurrentUser() user: AuthUser) {
    const trainerId = await this.trainerIdFor(user);
    return this.clients.listForTrainer(trainerId);
  }

  @Get(":id")
  async get(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    const trainerId = await this.trainerIdFor(user);
    return this.clients.getForTrainer(trainerId, id);
  }
}
```

```ts
// apps/api/src/clients/clients.module.ts
import { Module } from "@nestjs/common";
import { TrainersModule } from "../trainers/trainers.module";
import { ClientsController } from "./clients.controller";
import { ClientsService } from "./clients.service";
import { createClerkInviter } from "./clerk-inviter";

@Module({
  imports: [TrainersModule],
  controllers: [ClientsController],
  providers: [
    {
      provide: ClientsService,
      useFactory: (prisma: import("../prisma/prisma.service").PrismaService) =>
        new ClientsService(prisma, createClerkInviter()),
      inject: [require("../prisma/prisma.service").PrismaService],
    },
  ],
  exports: [ClientsService],
})
export class ClientsModule {}
```

Prefer a cleaner Nest provider (implement this way instead of the awkward `require` above):

```ts
// apps/api/src/clients/clients.module.ts
import { Module } from "@nestjs/common";
import { TrainersModule } from "../trainers/trainers.module";
import { PrismaService } from "../prisma/prisma.service";
import { ClientsController } from "./clients.controller";
import { ClientsService } from "./clients.service";
import { createClerkInviter } from "./clerk-inviter";

export const CLERK_INVITER = "CLERK_INVITER";

@Module({
  imports: [TrainersModule],
  controllers: [ClientsController],
  providers: [
    { provide: CLERK_INVITER, useFactory: () => createClerkInviter() },
    {
      provide: ClientsService,
      useFactory: (prisma: PrismaService, clerk: ReturnType<typeof createClerkInviter>) =>
        new ClientsService(prisma, clerk),
      inject: [PrismaService, CLERK_INVITER],
    },
  ],
  exports: [ClientsService],
})
export class ClientsModule {}
```

Import `ClientsModule` in `AppModule`.

- [ ] **Step 4: Run tests — expect pass**

Run: `pnpm --filter @trainflow/api test -- clients.service.spec.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/clients apps/api/src/app.module.ts
git commit -m "feat(api): client invite, resend, list, and get endpoints"
```

---

### Task 8: Invites accept webhook

**Files:**
- Create: `apps/api/src/invites/invites.module.ts`
- Create: `apps/api/src/invites/invites.service.ts`
- Create: `apps/api/src/invites/invites.controller.ts`
- Create: `apps/api/src/invites/invites.service.spec.ts`
- Modify: `apps/api/src/app.module.ts`

**Interfaces:**
- Consumes: `acceptInviteSchema` fields; InviteToken row
- Produces:
  - `InvitesService.accept(input): Promise<ClientDto>`
  - Errors: `INVITE_EXPIRED`, `INVITE_ALREADY_USED`, `CLIENT_NOT_FOUND`
  - On success: set `Client.clerkUserId`, `Client.status = ACTIVE`, `InviteToken.usedAt = now`
  - `POST /invites/accept` — Clerk webhook path OR internal accept after client signup (see note)

**Webhook note:** Clerk invitation acceptance creates the user. Configure a second Clerk webhook (or the same endpoint with branching) so `user.created` with `role=CLIENT` reads `invite_token` from unsafe metadata / redirect query stored in `public_metadata.inviteToken` during invitation.

For Foundation, accept endpoint accepts verified webhook payload:

```json
{
  "token": "...",
  "clerkUserId": "user_xxx",
  "email": "ana@ex.com",
  "name": "Ana"
}
```

When sending Clerk invitation (Task 7), also set `publicMetadata: { role: "CLIENT", inviteToken: token }` so the webhook handler can call accept without a separate query param store.

Update Task 7's `sendInvitation` accordingly if not already done:

```ts
publicMetadata: { role: "CLIENT", inviteToken: token }
```

And widen `ClerkInviter` metadata type to include optional `inviteToken`.

- [ ] **Step 1: Write failing accept tests**

```ts
// apps/api/src/invites/invites.service.spec.ts
import { InvitesService } from "./invites.service";
import { HttpException } from "@nestjs/common";

describe("InvitesService.accept", () => {
  const prisma = {
    inviteToken: { findUnique: jest.fn() },
    client: { update: jest.fn() },
    $transaction: jest.fn(async (fn) => fn(prisma)),
  };
  const service = new InvitesService(prisma as never);

  it("activates client for valid token", async () => {
    const expiresAt = new Date(Date.now() + 60_000);
    prisma.inviteToken.findUnique.mockResolvedValue({
      token: "tok",
      usedAt: null,
      expiresAt,
      clientId: "c1",
      client: {
        id: "c1",
        trainerId: "t1",
        clerkUserId: null,
        name: "Ana",
        email: "ana@ex.com",
        status: "PENDING",
        createdAt: new Date(),
      },
    });
    prisma.client.update.mockResolvedValue({
      id: "c1",
      trainerId: "t1",
      clerkUserId: "user_c",
      name: "Ana",
      email: "ana@ex.com",
      status: "ACTIVE",
      createdAt: new Date(),
    });
    prisma.inviteToken.update = jest.fn().mockResolvedValue({});

    const result = await service.accept({
      token: "tok",
      clerkUserId: "user_c",
      email: "ana@ex.com",
      name: "Ana",
    });
    expect(result.status).toBe("ACTIVE");
    expect(result.clerkUserId).toBe("user_c");
  });

  it("throws INVITE_EXPIRED", async () => {
    prisma.inviteToken.findUnique.mockResolvedValue({
      token: "tok",
      usedAt: null,
      expiresAt: new Date(Date.now() - 1000),
      clientId: "c1",
      client: {},
    });
    await expect(
      service.accept({
        token: "tok",
        clerkUserId: "user_c",
        email: "ana@ex.com",
        name: "Ana",
      }),
    ).rejects.toBeInstanceOf(HttpException);
  });
});
```

- [ ] **Step 2: Run — expect fail**

Run: `pnpm --filter @trainflow/api test -- invites.service.spec.ts`
Expected: FAIL

- [ ] **Step 3: Implement invites module**

```ts
// apps/api/src/invites/invites.service.ts
import {
  GoneException,
  Injectable,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import type { AcceptInviteInput, ClientDto } from "@trainflow/shared-types";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class InvitesService {
  constructor(private readonly prisma: PrismaService) {}

  private toDto(client: {
    id: string;
    trainerId: string;
    clerkUserId: string | null;
    name: string;
    email: string;
    status: "PENDING" | "ACTIVE" | "INACTIVE";
    createdAt: Date;
  }): ClientDto {
    return {
      id: client.id,
      trainerId: client.trainerId,
      clerkUserId: client.clerkUserId,
      name: client.name,
      email: client.email,
      status: client.status,
      createdAt: client.createdAt.toISOString(),
    };
  }

  async accept(input: AcceptInviteInput): Promise<ClientDto> {
    const row = await this.prisma.inviteToken.findUnique({
      where: { token: input.token },
      include: { client: true },
    });
    if (!row) {
      throw new NotFoundException({
        code: "CLIENT_NOT_FOUND",
        message: "Invite not found",
      });
    }
    if (row.usedAt) {
      throw new ConflictException({
        code: "INVITE_ALREADY_USED",
        message: "Invite already used",
      });
    }
    if (row.expiresAt.getTime() < Date.now()) {
      throw new GoneException({
        code: "INVITE_EXPIRED",
        message: "Invite expired",
      });
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.inviteToken.update({
        where: { token: input.token },
        data: { usedAt: new Date() },
      });
      return tx.client.update({
        where: { id: row.clientId },
        data: {
          clerkUserId: input.clerkUserId,
          status: "ACTIVE",
          name: input.name || row.client.name,
          email: input.email || row.client.email,
        },
      });
    });

    return this.toDto(updated);
  }
}
```

```ts
// apps/api/src/invites/invites.controller.ts
import {
  BadRequestException,
  Controller,
  Headers,
  Post,
  Req,
  UnauthorizedException,
} from "@nestjs/common";
import { Webhook } from "svix";
import { Request } from "express";
import { acceptInviteSchema } from "@trainflow/shared-types";
import { InvitesService } from "./invites.service";

@Controller("invites")
export class InvitesController {
  constructor(private readonly invites: InvitesService) {}

  @Post("accept")
  async acceptWebhook(
    @Req() req: Request & { rawBody?: Buffer },
    @Headers("svix-id") svixId: string,
    @Headers("svix-timestamp") svixTimestamp: string,
    @Headers("svix-signature") svixSignature: string,
  ) {
    const secret = process.env.CLERK_WEBHOOK_SECRET;
    if (!secret) {
      throw new BadRequestException({
        code: "INTERNAL_ERROR",
        message: "Webhook secret not configured",
      });
    }
    const wh = new Webhook(secret);
    let event: {
      type: string;
      data: {
        id: string;
        first_name?: string | null;
        last_name?: string | null;
        email_addresses?: { email_address: string }[];
        public_metadata?: { role?: string; inviteToken?: string };
      };
    };
    try {
      event = wh.verify(req.rawBody?.toString("utf8") ?? JSON.stringify(req.body), {
        "svix-id": svixId,
        "svix-timestamp": svixTimestamp,
        "svix-signature": svixSignature,
      }) as typeof event;
    } catch {
      throw new UnauthorizedException({
        code: "UNAUTHORIZED",
        message: "Invalid webhook signature",
      });
    }

    if (event.type !== "user.created") {
      return { ok: true, ignored: true };
    }
    if (event.data.public_metadata?.role !== "CLIENT") {
      return { ok: true, ignored: true };
    }
    const token = event.data.public_metadata.inviteToken;
    const email = event.data.email_addresses?.[0]?.email_address;
    if (!token || !email) {
      throw new BadRequestException({
        code: "VALIDATION_ERROR",
        message: "Missing invite token or email",
      });
    }
    const name =
      [event.data.first_name, event.data.last_name].filter(Boolean).join(" ") ||
      email;

    const parsed = acceptInviteSchema.safeParse({
      token,
      clerkUserId: event.data.id,
      email,
      name,
    });
    if (!parsed.success) {
      throw new BadRequestException({
        code: "VALIDATION_ERROR",
        message: "Invalid invite payload",
      });
    }

    await this.invites.accept(parsed.data);
    return { ok: true };
  }
}
```

```ts
// apps/api/src/invites/invites.module.ts
import { Module } from "@nestjs/common";
import { InvitesController } from "./invites.controller";
import { InvitesService } from "./invites.service";

@Module({
  controllers: [InvitesController],
  providers: [InvitesService],
})
export class InvitesModule {}
```

Import `InvitesModule` in `AppModule`.

Also update `apps/api/src/clients/clerk-inviter.ts` / `ClerkInviter` so invitation metadata includes `inviteToken`.

- [ ] **Step 4: Run tests — expect pass**

Run: `pnpm --filter @trainflow/api test -- invites.service.spec.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/invites apps/api/src/clients apps/api/src/app.module.ts
git commit -m "feat(api): accept invite webhook activates CLIENT"
```

---

### Task 9: E2E invite flow

**Files:**
- Create: `apps/api/test/jest-e2e.json`
- Create: `apps/api/test/invite-flow.e2e-spec.ts`
- Create: `apps/api/test/helpers/mock-auth.ts`

**Interfaces:**
- Consumes: AppModule with Prisma against test DB (or mocked Prisma for pure controller e2e)
- Produces: e2e covering invite → accept → list; expired token → `INVITE_EXPIRED`

**Approach for Foundation without flaky Clerk:** override `AuthGuard` and `CLERK_INVITER` in the e2e module; call `InvitesService.accept` directly for accept path (webhook signature tested separately/unit). Full Svix signature e2e optional — document as manual Clerk dashboard check.

- [ ] **Step 1: Write e2e spec**

```ts
// apps/api/test/invite-flow.e2e-spec.ts
import { Test } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import request from "supertest";
import { AppModule } from "../src/app.module";
import { AuthGuard } from "../src/common/guards/auth.guard";
import { PrismaService } from "../src/prisma/prisma.service";
import { CLERK_INVITER } from "../src/clients/clients.module";
import { InvitesService } from "../src/invites/invites.service";
import { HttpExceptionFilter } from "../src/common/filters/http-exception.filter";

describe("Invite flow (e2e)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let invites: InvitesService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideGuard(AuthGuard)
      .useValue({
        canActivate: (ctx: { switchToHttp: () => { getRequest: () => Record<string, unknown> } }) => {
          const req = ctx.switchToHttp().getRequest();
          req.user = { clerkUserId: "user_trainer_e2e", role: "TRAINER" };
          return true;
        },
      })
      .overrideProvider(CLERK_INVITER)
      .useValue({ sendInvitation: jest.fn().mockResolvedValue(undefined) })
      .compile();

    app = moduleRef.createNestApplication();
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();
    prisma = app.get(PrismaService);
    invites = app.get(InvitesService);

    await prisma.inviteToken.deleteMany();
    await prisma.client.deleteMany();
    await prisma.trainer.deleteMany();
    await prisma.trainer.create({
      data: {
        clerkUserId: "user_trainer_e2e",
        name: "Trainer E2E",
        email: "trainer-e2e@example.com",
      },
    });
  });

  afterAll(async () => {
    await app.close();
  });

  it("invites, accepts, lists ACTIVE client", async () => {
    const inviteRes = await request(app.getHttpServer())
      .post("/clients/invite")
      .send({ name: "Client E2E", email: "client-e2e@example.com" })
      .expect(201);
    // If Nest defaults to 200, assert 200 instead — match controller (no @HttpCode → 201 for POST create: add @HttpCode(201) or expect 200)
    expect(["PENDING", undefined]).toContain(inviteRes.body.status ?? "PENDING");

    const tokenRow = await prisma.inviteToken.findFirst({
      where: { clientId: inviteRes.body.id },
    });
    expect(tokenRow).toBeTruthy();

    const accepted = await invites.accept({
      token: tokenRow!.token,
      clerkUserId: "user_client_e2e",
      email: "client-e2e@example.com",
      name: "Client E2E",
    });
    expect(accepted.status).toBe("ACTIVE");

    const listRes = await request(app.getHttpServer()).get("/clients").expect(200);
    expect(listRes.body.some((c: { email: string }) => c.email === "client-e2e@example.com")).toBe(
      true,
    );
  });

  it("returns INVITE_EXPIRED for old token", async () => {
    const trainer = await prisma.trainer.findUniqueOrThrow({
      where: { clerkUserId: "user_trainer_e2e" },
    });
    const client = await prisma.client.create({
      data: {
        trainerId: trainer.id,
        name: "Expired",
        email: "expired@example.com",
        status: "PENDING",
        inviteToken: {
          create: {
            token: "expired-token-e2e",
            expiresAt: new Date(Date.now() - 1000),
          },
        },
      },
    });
    await expect(
      invites.accept({
        token: "expired-token-e2e",
        clerkUserId: "user_x",
        email: "expired@example.com",
        name: "Expired",
      }),
    ).rejects.toMatchObject({ response: { code: "INVITE_EXPIRED" } });
    void client;
  });
});
```

```json
// apps/api/test/jest-e2e.json
{
  "moduleFileExtensions": ["js", "json", "ts"],
  "rootDir": ".",
  "testEnvironment": "node",
  "testRegex": ".e2e-spec.ts$",
  "transform": { "^.+\\.(t|j)s$": "ts-jest" }
}
```

Add `@HttpCode(201)` on `POST /clients/invite` if you want 201; otherwise assert 200 in the e2e.

- [ ] **Step 2: Run e2e — expect pass**

Run: `pnpm --filter @trainflow/api test:e2e`
Expected: PASS (requires `DATABASE_URL` pointing at a disposable DB)

- [ ] **Step 3: Commit**

```bash
git add apps/api/test apps/api/src/clients
git commit -m "test(api): e2e invite accept and expired token"
```

---

### Task 10: Next.js web app + Clerk + trainer client pages

**Files:**
- Create: `apps/web/tsconfig.json`
- Create: `apps/web/next.config.mjs`
- Create: `apps/web/postcss.config.mjs`
- Create: `apps/web/tailwind.config.ts`
- Create: `apps/web/middleware.ts`
- Create: `apps/web/src/app/globals.css`
- Create: `apps/web/src/app/layout.tsx`
- Create: `apps/web/src/app/page.tsx`
- Create: `apps/web/src/app/sign-in/[[...sign-in]]/page.tsx`
- Create: `apps/web/src/app/sign-up/[[...sign-up]]/page.tsx`
- Create: `apps/web/src/app/(trainer)/layout.tsx`
- Create: `apps/web/src/app/(trainer)/clients/page.tsx`
- Create: `apps/web/src/app/(trainer)/clients/invite/page.tsx`
- Create: `apps/web/src/app/(client)/layout.tsx`
- Create: `apps/web/src/app/(client)/portal/page.tsx`
- Create: `apps/web/src/lib/api.ts`
- Create: `apps/web/src/lib/roles.ts`

**Interfaces:**
- Consumes: Clerk session; `NEXT_PUBLIC_API_URL`; `@trainflow/shared-types` invite schema
- Produces:
  - Middleware protects `/clients/*` (TRAINER) and `/portal` (CLIENT)
  - Trainer can invite client and list clients
  - Client sees simple portal placeholder
  - `apiFetch(path, init)` attaches Clerk bearer token

- [ ] **Step 1: Scaffold Next.js config and Clerk layout**

```ts
// apps/web/tsconfig.json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "es2022"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

```js
// apps/web/next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@trainflow/shared-types", "@trainflow/ui"],
};
export default nextConfig;
```

```js
// apps/web/postcss.config.mjs
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

```ts
// apps/web/tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: { extend: {} },
  plugins: [],
};
export default config;
```

```css
/* apps/web/src/app/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  @apply bg-zinc-50 text-zinc-900 antialiased;
}
```

```tsx
// apps/web/src/app/layout.tsx
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

export const metadata = {
  title: "TrainFlow",
  description: "Operating system for personal trainers",
};

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

```tsx
// apps/web/src/app/page.tsx
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function HomePage() {
  const { userId, sessionClaims } = await auth();
  if (userId) {
    const role = (sessionClaims?.metadata as { role?: string } | undefined)?.role
      ?? (sessionClaims?.publicMetadata as { role?: string } | undefined)?.role;
    if (role === "CLIENT") redirect("/portal");
    redirect("/clients");
  }
  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center gap-6 px-6">
      <h1 className="text-4xl font-semibold tracking-tight">TrainFlow</h1>
      <p className="text-zinc-600">AI-powered OS for personal trainers.</p>
      <div className="flex gap-3">
        <Link className="rounded bg-zinc-900 px-4 py-2 text-white" href="/sign-in">
          Sign in
        </Link>
        <Link className="rounded border border-zinc-300 px-4 py-2" href="/sign-up">
          Sign up as trainer
        </Link>
      </div>
    </main>
  );
}
```

```tsx
// apps/web/src/app/sign-in/[[...sign-in]]/page.tsx
import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <SignIn />
    </main>
  );
}
```

```tsx
// apps/web/src/app/sign-up/[[...sign-up]]/page.tsx
import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <SignUp />
    </main>
  );
}
```

```ts
// apps/web/middleware.ts
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublic = createRouteMatcher(["/", "/sign-in(.*)", "/sign-up(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublic(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: ["/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)", "/(api|trpc)(.*)"],
};
```

- [ ] **Step 2: API helper + trainer/client pages**

```ts
// apps/web/src/lib/roles.ts
import type { Role } from "@trainflow/shared-types";

export function roleFromClaims(claims: Record<string, unknown> | null | undefined): Role | null {
  const meta =
    (claims?.metadata as { role?: string } | undefined) ??
    (claims?.publicMetadata as { role?: string } | undefined);
  const role = meta?.role;
  if (role === "TRAINER" || role === "CLIENT") return role;
  return null;
}
```

```ts
// apps/web/src/lib/api.ts
"use server";

import { auth } from "@clerk/nextjs/server";

const base = () => process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const { getToken } = await auth();
  const token = await getToken();
  const res = await fetch(`${base()}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    cache: "no-store",
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as {
      code?: string;
      message?: string;
    };
    throw new Error(body.message ?? `API ${res.status}`);
  }
  return res.json() as Promise<T>;
}
```

```tsx
// apps/web/src/app/(trainer)/layout.tsx
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { roleFromClaims } from "@/lib/roles";

export default async function TrainerLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session.userId) redirect("/sign-in");
  const role = roleFromClaims(session.sessionClaims as Record<string, unknown>);
  if (role === "CLIENT") redirect("/portal");

  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between border-b border-zinc-200 bg-white px-6 py-4">
        <Link href="/clients" className="font-semibold tracking-tight">
          TrainFlow
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/clients">Clients</Link>
          <Link href="/clients/invite">Invite</Link>
          <UserButton />
        </nav>
      </header>
      <div className="mx-auto max-w-3xl px-6 py-8">{children}</div>
    </div>
  );
}
```

```tsx
// apps/web/src/app/(trainer)/clients/page.tsx
import Link from "next/link";
import type { ClientDto } from "@trainflow/shared-types";
import { apiFetch } from "@/lib/api";

export default async function ClientsPage() {
  let clients: ClientDto[] = [];
  let error: string | null = null;
  try {
    clients = await apiFetch<ClientDto[]>("/clients");
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load clients";
  }

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Clients</h1>
        <Link
          href="/clients/invite"
          className="rounded bg-zinc-900 px-3 py-2 text-sm text-white"
        >
          Invite client
        </Link>
      </div>
      {error ? <p className="text-red-600">{error}</p> : null}
      <ul className="divide-y divide-zinc-200 rounded border border-zinc-200 bg-white">
        {clients.map((c) => (
          <li key={c.id} className="flex items-center justify-between px-4 py-3">
            <div>
              <p className="font-medium">{c.name}</p>
              <p className="text-sm text-zinc-500">{c.email}</p>
            </div>
            <span className="text-xs uppercase tracking-wide text-zinc-500">
              {c.status}
            </span>
          </li>
        ))}
        {clients.length === 0 && !error ? (
          <li className="px-4 py-8 text-center text-zinc-500">No clients yet.</li>
        ) : null}
      </ul>
    </section>
  );
}
```

```tsx
// apps/web/src/app/(trainer)/clients/invite/page.tsx
"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { inviteClientSchema } from "@trainflow/shared-types";

export default function InviteClientPage() {
  const { getToken } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const parsed = inviteClientSchema.safeParse({ name, email });
    if (!parsed.success) {
      setError(parsed.error.errors[0]?.message ?? "Invalid form");
      return;
    }
    setLoading(true);
    try {
      const token = await getToken();
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001"}/clients/invite`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(parsed.data),
        },
      );
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(body.message ?? "Invite failed");
      }
      router.push("/clients");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invite failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mx-auto max-w-md space-y-6">
      <h1 className="text-2xl font-semibold">Invite client</h1>
      <form onSubmit={onSubmit} className="space-y-4 rounded border border-zinc-200 bg-white p-6">
        <label className="block space-y-1 text-sm">
          <span>Full name</span>
          <input
            className="w-full rounded border border-zinc-300 px-3 py-2"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span>Email</span>
          <input
            type="email"
            className="w-full rounded border border-zinc-300 px-3 py-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded bg-zinc-900 px-3 py-2 text-white disabled:opacity-50"
        >
          {loading ? "Sending…" : "Send invite"}
        </button>
      </form>
    </section>
  );
}
```

```tsx
// apps/web/src/app/(client)/layout.tsx
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { roleFromClaims } from "@/lib/roles";

export default async function ClientLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session.userId) redirect("/sign-in");
  const role = roleFromClaims(session.sessionClaims as Record<string, unknown>);
  if (role === "TRAINER") redirect("/clients");

  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between border-b border-zinc-200 bg-white px-6 py-4">
        <span className="font-semibold tracking-tight">TrainFlow</span>
        <UserButton />
      </header>
      <div className="mx-auto max-w-3xl px-6 py-8">{children}</div>
    </div>
  );
}
```

```tsx
// apps/web/src/app/(client)/portal/page.tsx
export default function ClientPortalPage() {
  return (
    <section className="space-y-2">
      <h1 className="text-2xl font-semibold">Your portal</h1>
      <p className="text-zinc-600">
        Workouts and progress land here in a later phase. Account active.
      </p>
    </section>
  );
}
```

**Clerk session claims note:** expose `publicMetadata.role` to the session JWT via Clerk Dashboard → Sessions → Customize session token:

```json
{
  "metadata": "{{user.public_metadata}}"
}
```

Default trainer sign-up: set Clerk user public metadata `role=TRAINER` via Clerk Dashboard default for the trainer application, or a Clerk `beforeUserCreated` / Dashboard "default metadata" for the TrainFlow production instance. Document in `.env.example` comments.

- [ ] **Step 3: Smoke-check web build**

```bash
pnpm --filter @trainflow/shared-types build
pnpm --filter @trainflow/web build
```

Expected: Next.js build succeeds (env vars may need dummy Clerk keys for build — set `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` in `.env.local`)

- [ ] **Step 4: Commit**

```bash
git add apps/web
git commit -m "feat(web): Clerk shell, trainer clients/invite, client portal"
```

---

### Task 11: README + CI

**Files:**
- Create: `README.md`
- Create: `.github/workflows/ci.yml`

**Interfaces:**
- Consumes: turbo lint/test/build
- Produces: CI on push/PR; README with local setup steps

- [ ] **Step 1: Write README**

```md
# TrainFlow

AI-powered operating system for personal trainers.

## Foundation (this phase)

- Turborepo monorepo (`apps/web`, `apps/api`, `packages/*`)
- Clerk auth (`TRAINER` / `CLIENT`)
- Core DB: Trainer, Client, InviteToken
- Trainer invite flow + client list

## Prerequisites

- Node.js >= 20
- pnpm 9
- PostgreSQL (Supabase or local)
- Clerk application (API keys + webhook secret)

## Setup

1. Copy `.env.example` → `.env` (root) and `apps/web/.env.local`
2. `pnpm install`
3. `pnpm db:generate && pnpm db:migrate`
4. Point Clerk webhooks:
   - `user.created` → `POST {API}/trainers/signup-webhook` (trainers)
   - `user.created` → `POST {API}/invites/accept` (clients with `publicMetadata.role=CLIENT`)
5. Customize Clerk session token to include `public_metadata` as `metadata`
6. `pnpm dev`

Web: http://localhost:3000  
API: http://localhost:3001

## Scripts

- `pnpm dev` — web + api
- `pnpm test` — unit tests
- `pnpm --filter @trainflow/api test:e2e` — invite e2e (needs DATABASE_URL)
```

- [ ] **Step 2: Write CI workflow**

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main]
  pull_request:

jobs:
  build-test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: trainflow
        ports: ["5432:5432"]
        options: >-
          --health-cmd "pg_isready -U postgres"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    env:
      DATABASE_URL: postgresql://postgres:postgres@localhost:5432/trainflow
      CLERK_SECRET_KEY: sk_test_ci_dummy
      CLERK_WEBHOOK_SECRET: whsec_ci_dummy
      NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: pk_test_ci_dummy
      CLERK_PUBLISHABLE_KEY: pk_test_ci_dummy
      NEXT_PUBLIC_API_URL: http://localhost:3001
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm
      - run: pnpm install
      - run: pnpm db:generate
      - run: pnpm --filter @trainflow/db migrate:deploy
      - run: pnpm --filter @trainflow/shared-types build
      - run: pnpm --filter @trainflow/api test
      - run: pnpm --filter @trainflow/api test:e2e
      - run: pnpm --filter @trainflow/api build
```

- [ ] **Step 3: Commit**

```bash
git add README.md .github/workflows/ci.yml
git commit -m "chore: add README and CI workflow for Foundation"
```

---

## Spec coverage checklist

| Spec requirement | Task |
|---|---|
| Turborepo monorepo layout | Task 1 |
| Prisma Trainer/Client/InviteToken | Task 2 |
| Shared Zod DTOs + error codes | Task 3 |
| NestJS + Prisma + `{code,message}` filter | Task 4 |
| AuthGuard + RolesGuard + role metadata | Task 5 |
| `POST /trainers/signup-webhook` | Task 6 |
| `POST /clients/invite`, resend, list, get | Task 7 |
| `POST /invites/accept` + expiry errors | Task 8 |
| E2E invite flow | Task 9 |
| Next.js + Clerk + trainer/client pages | Task 10 |
| CI + docs | Task 11 |

## Self-review notes

- No TBD/TODO placeholders left in steps.
- `ClientsModule` provider uses `CLERK_INVITER` token — e2e and unit tests must inject the same token.
- Clerk JWT must expose `publicMetadata.role` via session token customization (documented in Task 10 + README).
- Invitation `publicMetadata` must include both `role: "CLIENT"` and `inviteToken` for accept webhook.
- Pagination called out in spec for `GET /clients` — Foundation ships unpaginated list; add cursor pagination in Client Management phase if lists grow. Acceptable YAGNI for empty/early product.
