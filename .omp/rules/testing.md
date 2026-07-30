# Testing & QA

How to test Clockwise. Commands live in `AGENTS.md` (Development Commands).

## Backend — Jest

- `ts-jest`; tests live beside source as `*.spec.ts` under `backend/src/`
  (`testRegex: .*\.spec\.ts$`).
- **Integration tests use Testcontainers** (auto-spins PostgreSQL — Docker must
  be running).
- Run `pnpm test` / `pnpm test:cov`.
- **TDD (red-green-refactor) is the norm.** Mock repositories in unit tests;
  cover the happy path, auth/permission failures, edge cases, and error codes.

## Frontend — Vitest

- Two projects: `unit` (`src/**/*.test.ts`, node env) and `storybook`
  (Playwright headless chromium via `@storybook/addon-vitest`).
- Run `pnpm test`; `pnpm test:e2e` is currently a placeholder.

## Manual & Import Testing

- **Manual API testing:** open the `bruno/clockwise/` collection in Bruno
  (folders: `import`, `projects`, `tasks`, `time-logs`, `user-preferences`).
- **Import testing:** run `pnpm seed:users`, then use CSVs in
  `resources/example-import-data/` (happy-path and mixed-valid/error fixtures
  reference seeded `@clockwise.test` users).
