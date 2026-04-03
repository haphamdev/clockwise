# NestJS Code Review Checklist

## Module Structure

- [ ] Feature is encapsulated in its own module (not everything dumped in AppModule)
- [ ] Module imports are minimal — only what this feature needs
- [ ] Circular dependency risk is assessed; use `forwardRef` only as last resort
- [ ] Providers are scoped correctly (`DEFAULT`, `REQUEST`, `TRANSIENT`) for the use case

## Controllers

- [ ] Routes follow REST conventions (plural nouns, correct HTTP verbs)
- [ ] Route parameters and query params are typed and validated (via DTOs / ParseIntPipe etc.)
- [ ] Controllers are thin — no business logic, just orchestrate service calls
- [ ] Response status codes are explicit and correct (`@HttpCode`, `@HttpException`)
- [ ] Swagger decorators (`@ApiOperation`, `@ApiResponse`, `@ApiTags`) present for public APIs

## DTOs & Validation

- [ ] All incoming data uses a DTO class (not raw `body: any`)
- [ ] `class-validator` decorators are applied (`@IsString`, `@IsEmail`, `@IsOptional`, etc.)
- [ ] `ValidationPipe` is applied globally or at the controller level
- [ ] `transform: true` is enabled so primitives are coerced correctly
- [ ] `whitelist: true` is enabled to strip unknown properties
- [ ] No sensitive fields (passwords, tokens) are returned in response DTOs

## Services

- [ ] Services contain all business logic — not controllers, not repositories
- [ ] Services are stateless (no shared mutable state between requests)
- [ ] External dependencies (DB, HTTP, queues) are injected, not instantiated directly
- [ ] Error cases throw appropriate `HttpException` subclasses or custom domain exceptions
- [ ] Transactions are used where multiple writes must be atomic

## Database / TypeORM / Prisma

- [ ] Queries use parameterized inputs — no raw string interpolation (SQL injection risk)
- [ ] Relations are loaded explicitly (`relations: [...]` or `include: {...}`) — not via uncontrolled eager loading
- [ ] N+1 query patterns are avoided (use joins or DataLoader)
- [ ] Migrations exist for schema changes — no `synchronize: true` in production config
- [ ] Sensitive data (passwords, tokens) is hashed before persistence
- [ ] Soft deletes are used where data retention is required

## Authentication & Authorization

- [ ] All protected routes have an `@UseGuards(AuthGuard(...))` or equivalent
- [ ] JWT validation happens in a Guard, not a service method
- [ ] `@Roles()` or equivalent decorator is used for RBAC — roles are checked server-side
- [ ] Unauthenticated routes are explicitly marked `@Public()` (allowlist, not denylist)
- [ ] Token expiration, refresh logic, and revocation strategy are accounted for

## Guards, Pipes, Interceptors, Filters

- [ ] Guards return boolean or throw — never modify request data
- [ ] Pipes transform or validate — not perform business logic
- [ ] Interceptors used for cross-cutting concerns (logging, caching, response mapping)
- [ ] Exception filters catch domain exceptions and map to HTTP responses uniformly
- [ ] Global vs. route-scoped usage is intentional and documented

## Configuration & Environment

- [ ] All env vars accessed via `ConfigService` — no raw `process.env` in application code
- [ ] Config is validated at startup with a schema (e.g., `Joi`, `zod`)
- [ ] No secrets committed to source — `.env` is in `.gitignore`
- [ ] Different configs per environment (dev / staging / prod)

## Error Handling

- [ ] All async service methods have try/catch or propagate typed exceptions
- [ ] Errors are logged with context (request ID, user ID, resource ID)
- [ ] `InternalServerErrorException` is used as fallback, not exposed stack traces
- [ ] Validation errors return 400 with field-level messages

## Logging

- [ ] NestJS `Logger` is used (not `console.log`)
- [ ] Logger is instantiated with the class name for context
- [ ] Sensitive data (passwords, tokens, PII) is never logged
- [ ] Log levels are appropriate (debug in dev, warn/error in prod)

## Performance

- [ ] Long-running tasks are offloaded to a queue (BullMQ, etc.) — not awaited in request lifecycle
- [ ] Caching is applied to expensive, stable reads (e.g., `@nestjs/cache-manager`)
- [ ] Pagination is implemented for list endpoints (no unbounded queries)
- [ ] Database indexes exist for frequently-filtered columns

## Testing

- [ ] Services have unit tests with mocked dependencies
- [ ] Controllers have integration tests via `supertest` + `Test.createTestingModule`
- [ ] Guards and pipes have isolated unit tests
- [ ] Test DB is separate from dev/prod; seeding is deterministic

## Common NestJS Anti-Patterns to Flag

| Anti-pattern | Issue |
|---|---|
| Business logic in controllers | Hard to test, poor separation |
| `process.env` directly in service | Bypasses validation, untestable |
| `synchronize: true` in production | Risk of data loss on deploy |
| Missing `whitelist: true` on ValidationPipe | Allows extra properties through |
| `any` on DTO or service params | Silent contract violations |
| Circular module imports | Runtime DI errors |
| No pagination on list endpoints | Memory / timeout risk at scale |
| Raw SQL with string interpolation | SQL injection |
