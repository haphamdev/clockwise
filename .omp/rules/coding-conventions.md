# Coding Conventions & Common Patterns

Code-style and implementation patterns for Clockwise. Authz, secrets, and
data-integrity rules live in `.omp/rules/security.md`; test rules live in
`.omp/rules/testing.md`.

## Tooling & Imports

- **Formatter/linter: Biome 2.4.11** (root `biome.json`, extended by each app).
  Double quotes, trailing commas, space indent, auto import organization.
  `.prettierrc` exists but Biome is authoritative. `*.spec.ts` relax
  `noExplicitAny` / `noNonNullAssertion`.
- **No barrel imports** — never create `index.ts` re-export files; import
  directly from source.
- **Path alias `@/*`** → `src/*` (backend) / `./src/*` (frontend).
- **File size:** keep files small & single-purpose (~100 lines, hard max 300).

## Backend Patterns

- **Layering:** `Controller → Service → Repository → Prisma`. Controllers are
  thin (routing, auth decorators, DTO validation); services own business logic
  and permission checks; the repository is the ONLY layer that imports
  `@prisma/client`. Entities are plain TS interfaces with no Prisma imports.
- **Errors:** throw `AppException(ErrorCode.<NS>.<CODE>, message, HttpStatus)`
  from services (never raw Nest exceptions); repositories catch Prisma `P2002`
  and convert to a domain exception. Error codes are namespaced
  (`ErrorCode.TEAM.NOT_FOUND`). The global `AppExceptionFilter` shapes responses
  as `{ code, message, statusCode }`.
- **DB naming:** tables/columns are `snake_case` via `@@map`/`@map`; Prisma
  fields stay `camelCase`; PKs are UUIDs; org settings stored as JSONB on
  `organization`.
- **DI:** constructor injection via `@Injectable()`; modules `export` services
  only (not repositories/processors); `PrismaModule` & `ConfigModule` are
  `@Global()` — do not re-import.
- **Async:** async/await throughout; parallelize with `await Promise.all([...])`
  in repositories.

## Frontend Patterns

- **Data flow:** API function (`*-api.ts`, wraps `apiClient`) → React Query hook
  (`use-*.ts`) → component. Server state = TanStack Query; auth state = React
  Context; UI state = component `useState`.
- **Naming:** components `PascalCase`; hooks `use-*.ts`; per-domain query-key
  factories (`timeLogsKeys.list(params)`); mutations invalidate keys `onSuccess`
  and toast via `sonner` / `showErrorToast`.
- **Forms:** `react-hook-form` + `zod` (`zodResolver`). Use shadcn `<FormField>`
  for standard inputs, `<Controller>` + `<Label>` for custom inputs (Combobox).
  Avoid `z.coerce.number()` (breaks inference — use `z.string()` + `parseFloat`);
  avoid `type="number"` (locale issues — use `type="text"` +
  `inputMode="decimal"`); prefer `mode:"onSubmit"`, `reValidateMode:"onBlur"`.
- **HTTP client:** `apiClient<T>()` in `lib/api-client.ts` auto-refreshes on 401
  via `/api/v1/auth/refresh`; `ApiError` carries `.status` / `.code` /
  `.serverMessage`. (Token storage rules: see `.omp/rules/security.md`.)
- **Styling:** Tailwind v4 (`@theme` in `src/index.css`, no config file); merge
  classes with `cn()` (`clsx` + `tailwind-merge`); theme via `next-themes`
  (dark default).
