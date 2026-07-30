# Repository Guidelines

Detailed conventions are modular and live under `.omp/rules/`. They are
auto-expanded into this file via the `@` imports in the **Detailed Rules**
section at the bottom, so you always have them in context:

- `.omp/rules/coding-conventions.md` — code style & implementation patterns
- `.omp/rules/testing.md` — how to test (Jest, Vitest, Testcontainers, TDD)
- `.omp/rules/security.md` — authorization, secrets, data integrity, audit

Per-app specifics have their own entry points: **`backend/AGENTS.md`** and
**`frontend/AGENTS.md`** (each routes to the relevant backend/frontend sections
of the shared rules). They load automatically when you work in those folders.

## Project Overview

Clockwise is a single-tenant, containerized **time-tracking application**. Team members log working hours against projects/tasks; managers and admins view reports and dashboards. Roles are **per-team** — a user can be Manager in one team and Member in another; Admin is org-wide.

**Stack:** React (Vite) + shadcn/ui + Tailwind v4 · NestJS REST API · PostgreSQL + Prisma · Google OAuth + JWT · BullMQ + Redis (email & CSV import jobs) · Docker Compose.

## Architecture & Data Flow

Monorepo with two apps: `backend/` (NestJS) and `frontend/` (Vite/React), plus `specs/`, `bruno/`, `resources/`, `scripts/`.

**Domain model:**
```
Organization → Teams → TeamMembers (user + role: manager|member)
             → Projects → ProjectTeams, Tasks, TimeLogs → TimeLogTasks
             → Invitations → InvitationTeamAssignments
             → AuditLog, ImportJob
```
Tasks are auto-created when a user logs time against a new identifier (scoped per-project via `label` + `labelNormalized`).

**Backend request flow** (`Controller → Service → Repository → Prisma`):
- **Controller** (`*.controller.ts`): route + auth decorators, `@CurrentUser()`, DTO validation; delegates to service.
- **Service** (`*.service.ts`): business logic, permission checks, calls repository + `AuditLogService`.
- **Repository** (`*.repository.ts`): the ONLY layer that imports `@prisma/client`; runs queries, transforms Prisma models → Entities, catches DB errors (e.g. `P2002` → domain exception).
- **Entity** (`entities/*.entity.ts`): plain TS interfaces, no Prisma imports — used everywhere else.
- **DTO** (`dto/*.dto.ts`): request/response shapes with `class-validator` + `@ApiProperty`.

**Async jobs (BullMQ + Redis):** services enqueue to a queue (`INVITATION_EMAIL_QUEUE`, `IMPORT_QUEUE`); processors (`*.processor.ts` extending `WorkerHost`) consume. Invitation email uses a compare-and-swap (CAS) status transition (`initiated → sending → sent`). CSV import: `preview` (parse/validate, cache to Redis with TTL) → `execute` (create `ImportJob`, enqueue) → `ImportJobProcessor` (concurrency 1) dispatches type-specific processors and updates progress.

**Frontend data flow:** API function (`*-api.ts`, wraps `apiClient`) → React Query hook (`use-*.ts`) → component. Server state = TanStack Query; auth state = React Context; UI state = component `useState`.

## Key Directories

| Path | Purpose |
|------|---------|
| `backend/src/main.ts` | Bootstrap: `/api/v1` prefix, global `ValidationPipe`, `AppExceptionFilter`, CORS, Swagger at `/api/docs` (dev) |
| `backend/src/app.module.ts` | Root module; wires 15 feature modules + global Prisma/Config/BullMQ |
| `backend/src/modules/<name>/` | Feature modules: `auth, users, teams, projects, tasks, time-logs, invitations, import, reports, dashboard, org, audit-log, user-preferences, mail` |
| `backend/src/common/` | `exceptions/`, `guards/`, `decorators/`, `interceptors/` (cross-cutting) |
| `backend/prisma/` | `schema.prisma`, `migrations/`, `seed.ts`, `seed-users.ts` |
| `frontend/src/lib/<domain>/` | Per-domain `*-api.ts`, `use-*.ts` hooks, `*-keys.ts` query keys, `types.ts` |
| `frontend/src/components/ui/` | shadcn/ui primitives (+ stories) |
| `frontend/src/components/<domain>/`, `pages/` | Feature components & route pages |
| `specs/` | Feature specs — start at `specs/overview.md`; `specs/implementation-plan.md` has user stories |
| `bruno/clockwise/` | Bruno API collection for manual testing |
| `resources/example-import-data/` | Example CSVs for import testing |

## Development Commands

Package manager is **pnpm**; run inside `backend/` or `frontend/`.

**Full stack (Docker):**
```bash
# Dev (hot reload, ports exposed: FE 5173, API 3000, PG 5432, Redis 6379)
docker compose -f docker-compose.yml -f docker-compose.dev.yml up
# Prod
docker compose up
```

**Backend (`backend/`):**
```bash
pnpm start:dev              # nest start --watch (port 3000)
pnpm build                  # nest build → dist/
pnpm lint                   # biome check --write src prisma
pnpm format                 # biome format --write src prisma
pnpm test                   # jest --passWithNoTests
pnpm test:cov               # jest --coverage
pnpm prisma:migrate         # prisma migrate dev (create + apply + seed)
pnpm prisma:migrate:deploy  # prisma migrate deploy (CI/prod)
pnpm prisma:generate        # regenerate client after schema edits
pnpm prisma:studio          # Prisma GUI
pnpm prisma db seed         # run prisma/seed.ts (org + admin from ADMIN_EMAIL)
pnpm seed:users             # ts-node prisma/seed-users.ts (50 test users, idempotent)
```

**Frontend (`frontend/`):**
```bash
pnpm dev                    # vite dev server (0.0.0.0:5173, proxies /api → :3000)
pnpm build                  # tsc -b && vite build
pnpm lint                   # biome check --write src
pnpm test                   # vitest run --project unit
pnpm storybook              # storybook dev -p 6006
```

## Runtime / Tooling Preferences

- **Node 20** (CI + Docker `node:20-alpine`; README states 22+ for bare-metal dev). **pnpm** is the exclusive package manager (Docker uses corepack `pnpm@10.33.0`, CI `PNPM_VERSION=9.15`). **Bun is not used.**
- Backend compiles to CommonJS (ES2021) via `nest build`; frontend targets ES2020 via `tsc -b && vite build`.
- `enable-pre-post-scripts=true` in `.npmrc`; backend `postinstall` runs `prisma generate`.
- CI (`.github/workflows/ci.yml`, push/PR to `master`): two jobs — `backend` and `frontend-unit`, each `lint → test → build`. Frontend E2E (Playwright) is scaffolded but commented out.

## Important Files

- `backend/src/main.ts`, `backend/src/app.module.ts` — backend entry/wiring
- `backend/prisma/schema.prisma` — single source of DB truth
- `backend/src/common/exceptions/{app.exception.ts,error-codes.ts,app-exception.filter.ts}` — error model
- `backend/src/common/decorators/auth.decorators.ts`, `backend/src/common/guards/` — authz (see `.omp/rules/security.md`)
- `frontend/src/main.tsx`, `frontend/src/App.tsx` — FE entry, providers, routes (code-split via `React.lazy`)
- `frontend/src/lib/api-client.ts`, `frontend/src/lib/query-client.ts`, `frontend/src/contexts/AuthContext.tsx`
- Config: root/`backend`/`frontend` `biome.json`, `backend/nest-cli.json`, `frontend/vite.config.ts`, `frontend/components.json`, `docker-compose*.yml`
- `.env.example` — copy to `.env` (required vars listed in `.omp/rules/security.md`)

## Communication & Asking Questions

When you ask me a question with options to choose from, make each option
understandable on its own. For **every** question:

- **Explain the question** in plain language — what is being decided and why it
  matters — before listing options. Don't assume I know the jargon.
- **Give a concrete example** of what each option looks like in practice.
- **List pros and cons for each option**, so the trade-off is explicit.
- **Recommend a default** and say why, so I can just accept it if unsure.

Example of the expected shape:
> **Question:** Should error responses include a stack trace in dev?
> - **Option A — Include stack in dev only.** Example: `{ code, message, stack }`
>   when `NODE_ENV=development`. *Pros:* faster debugging. *Cons:* easy to leak
>   into prod if the env check is wrong.
> - **Option B — Never include stack.** Example: always `{ code, message }`.
>   *Pros:* safe by default. *Cons:* slower local debugging.
> - **Recommended:** A — the dev-only guard is standard and the speed-up is worth it.

## Detailed Rules

The following modular rules are auto-expanded here from `.omp/rules/`:

@.omp/rules/coding-conventions.md

@.omp/rules/testing.md

@.omp/rules/security.md
