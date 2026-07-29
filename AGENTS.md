# Repository Guidelines

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

## Code Conventions & Common Patterns

- **Formatter/linter: Biome 2.4.11** (root `biome.json`, extended by each app). Double quotes, trailing commas, space indent, auto import organization. `.prettierrc` exists but Biome is authoritative. `*.spec.ts` relax `noExplicitAny`/`noNonNullAssertion`.
- **No barrel imports** — never create `index.ts` re-export files; import directly from source.
- **Path alias `@/*`** → `src/*` (backend) / `./src/*` (frontend).
- **File size:** keep files small & single-purpose (~100 lines, hard max 300).
- **Never delete records** — soft-delete only for audit integrity. Users use `status` (`pending|active|deactivated`); time logs/projects use `status` (`active|archived`); teams use `isArchived`. (`ProjectTeam.isDeleted` is the lone boolean-flag exception.)
- **DB naming:** tables/columns are `snake_case` via `@@map`/`@map`; Prisma fields stay `camelCase`; PKs are UUIDs; org settings stored as JSONB on `organization`.
- **Backend errors:** throw `AppException(ErrorCode.<NS>.<CODE>, message, HttpStatus)` from services (never raw Nest exceptions); repositories catch Prisma `P2002` and convert. Error codes are namespaced (`ErrorCode.TEAM.NOT_FOUND`). Global `AppExceptionFilter` shapes responses `{ code, message, statusCode }`.
- **Auth decorators (backend):** `@Auth()` (JWT), `@AdminOnly()` (JWT + `IsAdminGuard`), `@TeamRole('manager')` (JWT + `RolesGuard` + `@Roles()`), `@TeamMember()` (JWT + `TeamMemberGuard`). Admins bypass team guards. `@CurrentUser()` injects the JWT-decoded user.
- **DI:** constructor injection via `@Injectable()`; modules `export` services only (not repositories/processors); `PrismaModule` & `ConfigModule` are `@Global()` — do not re-import.
- **Async:** async/await throughout; parallelize with `await Promise.all([...])` in repositories.
- **Audit logging:** every mutation calls `auditLogService.log()`/`logMany()` with `{ before, after, source? }` metadata.
- **`*ForImport` service methods** bypass normal guards — must carry JSDoc listing skipped validations; called only by import processors.
- **Frontend naming:** components `PascalCase`; hooks `use-*.ts`; per-domain query-key factories (`timeLogsKeys.list(params)`); mutations invalidate keys `onSuccess` and toast via `sonner` / `showErrorToast`.
- **Frontend forms:** `react-hook-form` + `zod` (`zodResolver`). Use shadcn `<FormField>` for standard inputs, `<Controller>` + `<Label>` for custom inputs (Combobox). Avoid `z.coerce.number()` (breaks inference — use `z.string()` + `parseFloat`); avoid `type="number"` (locale issues — use `type="text"` + `inputMode="decimal"`); prefer `mode:"onSubmit"`, `reValidateMode:"onBlur"`.
- **Frontend auth/HTTP:** `apiClient<T>()` in `lib/api-client.ts` — Bearer token held in a module variable (not localStorage), auto-refreshes on 401 via `/api/v1/auth/refresh`; `ApiError` carries `.status`/`.code`/`.serverMessage`.
- **Styling:** Tailwind v4 (`@theme` in `src/index.css`, no config file); merge classes with `cn()` (`clsx` + `tailwind-merge`); theme via `next-themes` (dark default).

## Important Files

- `backend/src/main.ts`, `backend/src/app.module.ts` — backend entry/wiring
- `backend/prisma/schema.prisma` — single source of DB truth
- `backend/src/common/exceptions/{app.exception.ts,error-codes.ts,app-exception.filter.ts}` — error model
- `backend/src/common/decorators/auth.decorators.ts`, `backend/src/common/guards/` — authz
- `frontend/src/main.tsx`, `frontend/src/App.tsx` — FE entry, providers, routes (code-split via `React.lazy`)
- `frontend/src/lib/api-client.ts`, `frontend/src/lib/query-client.ts`, `frontend/src/contexts/AuthContext.tsx`
- Config: root/`backend`/`frontend` `biome.json`, `backend/nest-cli.json`, `frontend/vite.config.ts`, `frontend/components.json`, `docker-compose*.yml`
- `.env.example` — copy to `.env`. Required: `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`, `ADMIN_EMAIL`, `FRONTEND_URL`, `REDIS_HOST/PORT/PASSWORD`, `POSTGRES_USER/PASSWORD/DB`; optional `SMTP_*`, `LOG_*`.

## Runtime / Tooling Preferences

- **Node 20** (CI + Docker `node:20-alpine`; README states 22+ for bare-metal dev). **pnpm** is the exclusive package manager (Docker uses corepack `pnpm@10.33.0`, CI `PNPM_VERSION=9.15`). **Bun is not used.**
- Backend compiles to CommonJS (ES2021) via `nest build`; frontend targets ES2020 via `tsc -b && vite build`.
- `enable-pre-post-scripts=true` in `.npmrc`; backend `postinstall` runs `prisma generate`.
- CI (`.github/workflows/ci.yml`, push/PR to `master`): two jobs — `backend` and `frontend-unit`, each `lint → test → build`. Frontend E2E (Playwright) is scaffolded but commented out.

## Testing & QA

- **Backend: Jest** (`ts-jest`). Tests live beside source as `*.spec.ts` under `backend/src/`; `testRegex: .*\.spec\.ts$`. Integration tests use **Testcontainers** (auto-spins PostgreSQL). Run `pnpm test` / `pnpm test:cov`. TDD (red-green-refactor) is the norm — mock repositories in unit tests; cover happy path, auth/permission failures, edge cases, and error codes.
- **Frontend: Vitest** — two projects: `unit` (`src/**/*.test.ts`, node env) and `storybook` (Playwright headless chromium via `@storybook/addon-vitest`). Run `pnpm test`; `pnpm test:e2e` is currently a placeholder.
- **Manual API testing:** open the `bruno/clockwise/` collection in Bruno (folders: `import`, `projects`, `tasks`, `time-logs`, `user-preferences`).
- **Import testing:** run `pnpm seed:users`, then use CSVs in `resources/example-import-data/` (happy-path and mixed-valid/error fixtures reference seeded `@clockwise.test` users).
