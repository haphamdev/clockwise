# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Clockwise is a time-tracking application. Team members log working hours against tasks/projects, managers view reports. Single-tenant, containerized.

**Stack:** React (Vite) + shadcn/ui + Tailwind | NestJS REST API | PostgreSQL | Prisma | Docker

**Roles:** Admin (org-wide), Manager (per-team), Member (per-team). Roles are assigned per team — a user can be Manager in one team and Member in another.

## Commands

### Backend (`cd backend`)

```bash
pnpm install                    # Install dependencies
pnpm build                      # Compile NestJS
pnpm start:dev                  # Dev server with hot reload (port 3000)
pnpm lint                       # ESLint
pnpm test                       # Jest (uses Testcontainers — needs Docker running)
pnpm test:watch                 # Jest watch mode
pnpm test:cov                   # Jest with coverage
pnpm prisma:generate            # Regenerate Prisma client after schema changes
pnpm prisma:migrate             # Create + apply migration (dev)
pnpm prisma:migrate:deploy      # Apply migrations (prod/CI)
pnpm prisma:studio              # Prisma GUI on port 5555
```

### Frontend (`cd frontend`)

```bash
pnpm install                    # Install dependencies
pnpm dev                        # Vite dev server (port 5173)
pnpm build                      # TypeScript check + Vite production build
pnpm lint                       # ESLint
pnpm test                       # Jest (hooks, utils, services — no .tsx)
pnpm test:e2e                   # Playwright (UI/E2E tests)
```

### Docker

```bash
# Development (hot reload, exposed ports)
docker compose -f docker-compose.yml -f docker-compose.dev.yml up

# Production
docker compose up
```

## Architecture

### Backend

- **Entry:** `src/main.ts` — global prefix `/api/v1`, ValidationPipe (whitelist + transform), CORS, Swagger at `/api/docs` (dev only)
- **Modules:** `src/modules/{auth,users,teams,projects,tasks,time-logs,reports,org}/` — each is a NestJS module with controller + service
- **Database:** `src/prisma/` — PrismaModule is global, PrismaService extends PrismaClient
- **Guards & decorators:** `src/common/` — `@Roles()`, `RolesGuard`, `@IsAdmin()`, `@IsProjectOwner()`, `TeamMemberGuard`
- **Schema:** `prisma/schema.prisma` — all models use `@@map()` for snake_case table names, `@map()` for column names, UUID PKs

### Frontend

- **Entry:** `src/main.tsx` → `src/App.tsx` (React Router)
- **Routes:** `/login`, `/dashboard`, `/time-logs`, `/projects`, `/reports`, `/admin`
- **UI:** shadcn/ui components (configured in `components.json`), Tailwind CSS
- **Path aliases:** `@/` → `src/`, `@/components`, `@/ui`, `@/lib`, `@/hooks`
- **API proxy:** Vite dev server proxies `/api` → `http://localhost:3000`

### Domain Model

```
Organization → Teams → TeamMembers (user + role)
            → Projects → ProjectMembers, Tasks, TimeLogs
            → Invitations → InvitationTeamAssignments
```

Tasks are auto-created when a user logs time with a new identifier. Tasks are scoped per-project.

### Backend Type Layering

The backend enforces strict separation between three type layers:

- **Entity** (`modules/<mod>/entities/`) — Plain TypeScript interfaces that represent domain objects. Used everywhere: services, controllers, guards. No library-specific imports.
- **DTO** (`modules/<mod>/dto/`) — Classes used in controllers for API request/response shapes. Decorated with `@ApiProperty()` and class-validator decorators.
- **Model** (Prisma) — Prisma-generated types from `@prisma/client`. Only ever imported inside `*.repository.ts` files and `src/prisma/`.

**Rule:** `@prisma/client` must never be imported outside of repository and prisma files. Repositories convert Prisma models to entities via transformer methods before returning them. Services and controllers work exclusively with entities and DTOs.

### File Size & Single Responsibility

Keep files small and single-purpose — aim for ~100 lines, hard max 300 lines. Split code by responsibility:

- **API client functions** (`lib/<domain>/<domain>-api.ts`) — plain async functions, no React
- **Query keys** (`lib/<domain>/<domain>-keys.ts`) — query key factories
- **Hooks** (`lib/<domain>/use-<name>.ts`) — one hook per file, wraps useQuery/useMutation
- **Types** (`lib/<domain>/types.ts`) — shared interfaces/types for a domain
- **UI components** — one component per file, no data-fetching logic

### Key Conventions

- Backend column mapping: Prisma fields are camelCase, DB columns are snake_case (via `@map`)
- All soft-deletes use `isDeleted` boolean (not actual deletion)
- Team archival uses `isArchived`, project archival uses `status: archived`
- Org settings stored as JSONB on the `organization` table
- API errors use `AppException` with machine-readable codes: `{ statusCode, error, code, message }`. Error codes are defined in `src/common/exceptions/error-codes.ts`, namespaced by module (e.g. `AUTH_NO_INVITATION`, `TEAM_INSUFFICIENT_ROLE`). Always throw `new AppException(ErrorCode.X.Y, 'message', HttpStatus.Z)` instead of raw NestJS exceptions.

## Specs

All feature specs live in `specs/`. Read `specs/overview.md` for the high-level picture. `specs/implementation-plan.md` has user stories and task breakdowns organized by phase.

## Environment

Copy `.env.example` to `.env`. Required vars: `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`, `FRONTEND_URL`.
