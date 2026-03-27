# Test Infrastructure Setup

## Overview
Test strategy for Clockwise. Backend uses Jest with Testcontainers for integration tests against a real PostgreSQL instance. Frontend uses Jest for non-UI logic (hooks, utils, services) and Playwright for E2E/UI tests.

---

## Backend Testing

### Stack

| Tool | Purpose |
|------|---------|
| Jest | Test runner and assertion library |
| ts-jest | TypeScript support for Jest |
| @testcontainers/postgresql | Spins up a real PostgreSQL container per test run |
| @nestjs/testing | NestJS test utilities (module compilation, app bootstrap) |
| supertest | HTTP assertions for integration tests |

### Testcontainers Setup

#### How It Works
1. **Global setup** (`test/setup/global-setup.ts`): Before all tests run, Testcontainers starts a PostgreSQL container and runs Prisma migrations against it. The `DATABASE_URL` is exported as an env var.
2. **Tests run**: Each test file gets a `PrismaClient` connected to the test database. Tests can seed specific data and clean up after.
3. **Global teardown** (`test/setup/global-teardown.ts`): After all tests, the container is stopped and removed.

#### Global Setup Script
```
global-setup.ts:
  1. Start PostgreSQL container (postgres:16, random port)
  2. Build DATABASE_URL from container's host + mapped port
  3. Run `prisma migrate deploy` against the test DB
  4. Run test seed (create base org, admin, teams, projects)
  5. Export DATABASE_URL to process.env (for all test workers)
```

#### Global Teardown Script
```
global-teardown.ts:
  1. Stop PostgreSQL container
```

### Test Data Seed

`test/seed.ts` creates a baseline dataset for tests:

| Entity | Seed Data |
|--------|-----------|
| Organization | 1 org: "Test Org" with default settings |
| Users | Admin user, 2 managers, 3 members |
| Teams | Team Alpha (1 manager, 2 members), Team Beta (1 manager, 1 member) |
| Projects | Project X (owned by manager, 3 members assigned), Project Y (archived) |
| Tasks | 3 tasks in Project X ("JIRA-001", "JIRA-002", "Code review") |
| Time Logs | 10 sample time logs across different users, dates, tasks |
| Invitations | 1 pending invitation with team assignments |

The seed exports all created entity IDs for use in tests (e.g. `SEED.adminUser.id`, `SEED.projectX.id`).

### Database Cleanup Between Tests

`test/helpers/prisma.ts` provides:
- `getTestPrismaClient()` — singleton PrismaClient for the test DB
- `cleanDatabase()` — truncates all tables in FK-safe order (time_log → task → project_member → project → team_member → invitation_team_assignment → invitation → team → user → organization), then re-runs the seed
- `cleanTable('time_log')` — truncate a single table for lighter cleanup

### Jest Configuration

```
backend/jest.config.ts:
  preset: 'ts-jest'
  testEnvironment: 'node'
  rootDir: '.'
  testMatch: ['**/*.spec.ts']
  globalSetup: './test/setup/global-setup.ts'
  globalTeardown: './test/setup/global-teardown.ts'
  setupFilesAfterSetup: ['./test/setup/jest-setup.ts']  // sets timeout, etc.
  moduleNameMapper: { '@/*': '<rootDir>/src/*' }
```

### Test File Conventions

| Pattern | Type | Example |
|---------|------|---------|
| `*.spec.ts` next to source | Unit tests | `src/modules/teams/teams.service.spec.ts` |
| `test/integration/*.spec.ts` | Integration tests | `test/integration/teams.spec.ts` |

### Sample Integration Test
```
test/integration/health.spec.ts:
  - Bootstrap NestJS app with Test.createTestingModule
  - GET /api/v1/health → expect 200, { status: 'ok' }
  - Verify PrismaService is connected to test DB
```

---

## Frontend Testing — Jest (Non-UI)

### Stack

| Tool | Purpose |
|------|---------|
| Jest | Test runner |
| ts-jest | TypeScript support |
| @testing-library/jest-dom | Custom matchers |

### What to Test with Jest
- **Utility functions**: `cn()`, date formatters, hour calculators, CSV parsers
- **Custom hooks**: `useAuth`, `useTimeLogs`, `useDebounce`, etc.
- **Service/API layer**: Request builders, response transformers, error handlers
- **State logic**: Reducers, store selectors, computed values

### What NOT to Test with Jest
- React component rendering (use Playwright instead)
- UI interactions (clicks, form fills)
- Visual layout and styling

### Jest Configuration
```
frontend/jest.config.ts:
  preset: 'ts-jest'
  testEnvironment: 'jsdom'
  rootDir: '.'
  testMatch: ['src/**/*.test.ts']   // .test.ts only, NOT .test.tsx
  moduleNameMapper: { '@/*': '<rootDir>/src/*' }
  setupFilesAfterSetup: ['./test/setup/jest-setup.ts']
```

### Test File Convention
- `src/lib/utils.test.ts` — tests for `src/lib/utils.ts`
- `src/hooks/useAuth.test.ts` — tests for `src/hooks/useAuth.ts`

---

## Frontend Testing — Playwright (UI / E2E)

### Stack

| Tool | Purpose |
|------|---------|
| @playwright/test | E2E test runner with browser automation |
| Chromium | Default browser for tests |

### What to Test with Playwright
- Page navigation and routing
- Full user flows (login → log time → view dashboard)
- Form interactions (fill, submit, validation errors)
- Component rendering with real data
- Permission-based UI (admin sees admin panel, member doesn't)
- Responsive layout (mobile/tablet breakpoints)

### Playwright Configuration
```
frontend/playwright.config.ts:
  testDir: './e2e'
  baseURL: 'http://localhost:5173'
  use:
    browserName: 'chromium'
    screenshot: 'only-on-failure'
    trace: 'on-first-retry'
  webServer:
    command: 'pnpm dev'
    port: 5173
    reuseExistingServer: true
  retries: 1 (CI only)
```

### Test File Convention
- `e2e/auth.spec.ts` — login/logout flows
- `e2e/time-logging.spec.ts` — time entry form, list view
- `e2e/admin.spec.ts` — admin panel operations

### E2E Test Data
Playwright tests run against the full stack (frontend + backend + DB). The backend uses the same Testcontainers setup. Test data is seeded before the suite and cleaned between tests via API calls.

---

## Package.json Scripts

### Backend
```json
{
  "test": "jest",
  "test:watch": "jest --watch",
  "test:cov": "jest --coverage"
}
```

### Frontend
```json
{
  "test": "jest",
  "test:watch": "jest --watch",
  "test:e2e": "playwright test",
  "test:e2e:ui": "playwright test --ui"
}
```

---

## Directory Structure

```
backend/
├── jest.config.ts
├── test/
│   ├── setup/
│   │   ├── global-setup.ts       # Testcontainers start + migrate + seed
│   │   ├── global-teardown.ts    # Testcontainers stop
│   │   └── jest-setup.ts         # Jest timeout, custom matchers
│   ├── helpers/
│   │   └── prisma.ts             # Test PrismaClient, cleanDatabase()
│   ├── seed.ts                   # Test data seed with exported IDs
│   └── integration/
│       └── health.spec.ts        # Sample integration test
└── src/
    └── modules/
        └── teams/
            └── teams.service.spec.ts  # Unit test example

frontend/
├── jest.config.ts
├── playwright.config.ts
├── test/
│   └── setup/
│       └── jest-setup.ts         # jest-dom matchers
├── e2e/
│   └── health.spec.ts            # Sample Playwright test
└── src/
    └── lib/
        └── utils.test.ts         # Sample Jest test
```
