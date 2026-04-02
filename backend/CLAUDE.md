# Backend — CLAUDE.md

## Commands

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

## Architecture

- **Entry:** `src/main.ts` — global prefix `/api/v1`, ValidationPipe (whitelist + transform), CORS, Swagger at `/api/docs` (dev only)
- **Modules:** `src/modules/{auth,users,teams,projects,tasks,time-logs,reports,org}/` — each is a NestJS module with controller + service
- **Database:** `src/prisma/` — PrismaModule is global, PrismaService extends PrismaClient
- **Guards & decorators:** `src/common/` — `@Roles()`, `RolesGuard`, `@IsAdmin()`, `@IsProjectOwner()`, `TeamMemberGuard`
- **Schema:** `prisma/schema.prisma` — all models use `@@map()` for snake_case table names, `@map()` for column names, UUID PKs

## Type Layering

The backend enforces strict separation between three type layers:

- **Entity** (`modules/<mod>/entities/`) — Plain TypeScript interfaces that represent domain objects. Used everywhere: services, controllers, guards. No library-specific imports.
- **DTO** (`modules/<mod>/dto/`) — Classes used in controllers for API request/response shapes. Decorated with `@ApiProperty()` and class-validator decorators.
- **Model** (Prisma) — Prisma-generated types from `@prisma/client`. Only ever imported inside `*.repository.ts` files and `src/prisma/`.

**Rule:** `@prisma/client` must never be imported outside of repository and prisma files. Repositories convert Prisma models to entities via transformer methods before returning them. Services and controllers work exclusively with entities and DTOs.

## Development Workflow (TDD)

Apply TDD workflow for all backend tasks.
Use the `/tdd` skill for test-driven development. It handles the red-green-refactor loop automatically.

### Test structure

- Tests live next to the source file: `foo.service.ts` → `foo.service.spec.ts`
- Unit tests mock dependencies using `@nestjs/testing` `Test.createTestingModule` or plain mock objects
- Use `jest.Mocked<T>` for typed mocks, cast with `as unknown as T` (not `as any`)
- Focus on critical paths: happy path, auth/permission failures, edge cases, error codes

## Conventions

- Column mapping: Prisma fields are camelCase, DB columns are snake_case (via `@map`)
- API errors use `AppException` with machine-readable codes: `{ statusCode, error, code, message }`. Error codes are defined in `src/common/exceptions/error-codes.ts`, namespaced by module (e.g. `AUTH_NO_INVITATION`, `TEAM_INSUFFICIENT_ROLE`). Always throw `new AppException(ErrorCode.X.Y, 'message', HttpStatus.Z)` instead of raw NestJS exceptions.
- No barrel imports — do not create `index.ts` re-export files. Always import directly from the source file (e.g. `from './exceptions/app.exception'` not `from './exceptions'`).

## Gotchas

- **Seed file must match schema** — When Prisma schema changes (adding/removing columns, creating join tables), `prisma/seed.ts` must be updated too or Docker startup fails during seeding. E.g., removing `taskId` FK from `TimeLog` and adding `TimeLogTask` join table required updating the seed to create join records separately.
- **Audit log controller response mapping** — The `data.map()` in `src/modules/audit-log/audit-log.controller.ts` manually maps entity fields to the response DTO. When adding new fields to `AuditLogEntity` and `AuditLogResponseDto` (e.g., `reason`), the mapping must also be updated or TypeScript errors appear.
