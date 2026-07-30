# Security, Authorization & Data Integrity

Rules that protect access, secrets, and the audit trail. Non-negotiable.

## Authorization (backend)

- Enforce access with the auth decorators, never ad-hoc checks:
  - `@Auth()` — JWT required.
  - `@AdminOnly()` — JWT + `IsAdminGuard`.
  - `@TeamRole('manager')` — JWT + `RolesGuard` + `@Roles()`.
  - `@TeamMember()` — JWT + `TeamMemberGuard`.
- Admins bypass team guards. `@CurrentUser()` injects the JWT-decoded user.
- **Authorize server-side only** — never trust role/permission claims from the
  client. Permission checks belong in services.
- **`*ForImport` service methods bypass normal guards** — each MUST carry JSDoc
  listing the skipped validations, and may be called ONLY by import processors.

## Secrets & Environment (backend / ops)

- No secrets, credentials, or PII hardcoded. All secrets come from env via
  `ConfigService` — never raw `process.env` in application code.
- `.env` is git-ignored; copy `.env.example` → `.env`.
- **Required env vars:** `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`,
  `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`,
  `ADMIN_EMAIL`, `FRONTEND_URL`, `REDIS_HOST/PORT/PASSWORD`,
  `POSTGRES_USER/PASSWORD/DB`. Optional: `SMTP_*`, `LOG_*`.

## Tokens (frontend)

- Frontend Bearer token is held in a module variable in `lib/api-client.ts`,
  **never in `localStorage`**; it auto-refreshes on 401 via
  `/api/v1/auth/refresh`. Do not persist access/refresh tokens to web storage.

## Data Integrity & Audit Trail (backend)

- **Never delete records** — soft-delete only, for audit integrity:
  - Users use `status` (`pending | active | deactivated`).
  - Time logs / projects use `status` (`active | archived`).
  - Teams use `isArchived`.
  - (`ProjectTeam.isDeleted` is the lone boolean-flag exception.)
- **Every mutation calls `auditLogService.log()` / `logMany()`** with
  `{ before, after, source? }` metadata.
- User-facing error messages must not leak internals; the global
  `AppExceptionFilter` returns `{ code, message, statusCode }`.
