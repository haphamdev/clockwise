# Implementation Plan

## User Stories

Stories are ordered by dependency — each story builds on the ones before it.

---

### Epic 0: DevOps & Test Infrastructure ✅

#### US-0a: GitHub Repository & CI Setup ✅
> As a **developer**, I want the local repo connected to GitHub with CI/CD pipelines via GitHub Actions, so that every push and PR is validated automatically.
> → _Detailed spec: `specs/github-ci-setup.md`_

#### US-0b: Test Infrastructure Setup ✅
> As a **developer**, I want Jest (backend + frontend non-UI), Playwright (frontend UI), and Testcontainers (Postgres for backend) configured, so that all features can be tested from the start.
> → _Detailed spec: `specs/test-setup.md`_

---

### Epic 1: Foundation ✅

#### US-1: Seed Organization & Admin Bootstrap ✅
> As a **system deployer**, I want the system to seed a default organization and an initial Admin user on first run, so that there is an entry point to configure the app.

#### US-2: Google OAuth Login ✅
> As a **user**, I want to sign in with my Google account, so that I can access the app without creating a separate password.

#### US-3: JWT Session Management ✅
> As an **authenticated user**, I want my session to persist via JWT tokens with auto-refresh, so that I don't have to re-login frequently.

#### US-4: Role-Based Access Guard ✅
> As the **system**, I want to enforce role-based permissions on all API endpoints, so that users can only perform actions they are authorized for.

---

### Epic 2: Organization & Team Management ✅

#### US-5: Invite Users ✅
> As an **Admin**, I want to invite users by email with pre-assigned team(s) and role(s), so that they can join the org on first login.

#### US-6: Accept Invitation ✅
> As an **invited user**, I want to click the invitation link and sign in with Google to activate my account with the pre-assigned teams and roles.

#### US-7: Manage Users ✅
> As an **Admin**, I want to list, view, deactivate, and reactivate users, so that I can control who has access to the system.

#### US-8: Manage Teams ✅
> As an **Admin**, I want to create, edit, and archive teams, and add/remove members with Manager or Member roles, so that the org structure is maintained.

#### US-9: Admin Panel — Org Settings ✅
> As an **Admin**, I want to configure org-level settings (expected hours/week, warning thresholds, date format, CSV max rows), so that the app behaves according to our policies.

---

### Epic 3: Project Management

#### US-10: Create & Manage Projects
> As a **Manager or Admin**, I want to create projects, edit their details, and archive them, so that work can be organized.

#### US-11: Assign Members to Projects
> As a **Project Owner or Admin**, I want to assign users from any team to a project and remove them, so that the right people can log time.

#### US-12: Transfer Project Ownership
> As a **Project Owner or Admin**, I want to transfer project ownership to another Admin or Manager, so that project management can be handed off.

---

### Epic 4: Time Logging

#### US-13: Log Time (Manual Entry)
> As a **Member**, I want to select a date, project, task (JIRA ID or text), hours, and notes to log my working time, so that my effort is tracked.

#### US-14: Auto-Create Tasks
> As the **system**, I want to auto-create a task when a user logs time with a new task identifier within a project, so that users don't need to pre-create tasks.

#### US-15: Task Autocomplete
> As a **user logging time**, I want to see autocomplete suggestions for existing tasks in the selected project, so that I can quickly select the right task.

#### US-16: Edit & Delete Time Logs
> As a **user**, I want to edit or delete my own time logs. As a **Manager**, I want to edit/delete my team members' logs. So that records stay accurate.

#### US-17: CSV Import
> As a **user**, I want to import time logs in bulk via CSV, so that I can log historical or batch data efficiently.

#### US-18: Soft Warnings
> As a **user**, I want to see a warning when my daily total exceeds 12h or weekly total exceeds 60h (configurable), so that I can catch potential mistakes.

---

### Epic 5: Task Management

#### US-19: Rename Task
> As a **Project Owner or Admin**, I want to rename a task's label, so that it is correctly displayed across all time logs and reports.

#### US-20: Merge Tasks
> As a **Project Owner or Admin**, I want to merge duplicate tasks (e.g. `JIRA-123` and `Jira 123`), so that reporting is clean.

---

### Epic 6: Reporting & Dashboard

#### US-21: Member Personal Dashboard
> As a **Member**, I want to see my hours this week/month, top projects, and recent activity, so that I have a quick overview of my work.

#### US-22: Manager Dashboard
> As a **Manager**, I want to see team hours, hours by project, weekly/monthly trends, utilization rates, and task breakdowns, so that I can monitor my team's workload.

#### US-23: Admin Dashboard
> As an **Admin**, I want to see the same dashboards as Manager but across all teams, so that I have org-wide visibility.

#### US-24: Report Builder
> As a **Manager or Admin**, I want to build custom reports with grouping (user, project, task, date, team), filters, and metrics, so that I can do deeper analysis.

#### US-25: Export Reports (CSV & PDF)
> As a **Manager or Admin**, I want to export reports to CSV and PDF, so that I can share them externally.

---

## Task Breakdown

### US-0a: GitHub Repository & CI Setup ✅

| # | Task | Layer | Details |
|---|------|-------|---------|
| 0a.1 | Set upstream remote | DevOps | `git remote add origin` + `git push -u origin --all`. |
| 0a.2 | Create GitHub labels | DevOps | Labels for epics (`epic:foundation`, `epic:org-team`, etc.), layers (`backend`, `frontend`), and type (`user-story`). Via `gh label create`. |
| 0a.3 | Create GitHub milestones | DevOps | One milestone per epic (Epic 0–6). Via `gh milestone create`. |
| 0a.4 | Bulk-create GitHub issues | DevOps | Script to create one issue per user story (US-0a through US-25) with task checklists in the body, correct labels, and milestone. Via `gh issue create`. |
| 0a.5 | Create GitHub Actions CI workflow | DevOps | `.github/workflows/ci.yml` — triggered on push to `main` and PRs. Jobs: backend lint + test, frontend lint + test (Jest), frontend E2E (Playwright), build. |
| 0a.6 | Add branch protection rules | DevOps | Require CI to pass before merging to `main`. Via `gh api` or GitHub UI. |

→ _Full details: `specs/github-ci-setup.md`_

---

### US-0b: Test Infrastructure Setup ✅

| # | Task | Layer | Details |
|---|------|-------|---------|
| 0b.1 | Install Jest + Testcontainers for backend | BE | `jest`, `ts-jest`, `@testcontainers/postgresql`. Configure `jest.config.ts` with `ts-jest` preset. |
| 0b.2 | Create global test setup with Testcontainers | BE | `test/setup/global-setup.ts` — start PostgreSQL container, run `prisma migrate deploy`, export `DATABASE_URL`. `global-teardown.ts` — stop container. |
| 0b.3 | Create test data seed utility | BE | `test/seed.ts` — creates a test org, admin user, teams, projects, sample time logs. Used by global setup and available per-test. |
| 0b.4 | Create Prisma test helper | BE | `test/helpers/prisma.ts` — provides a `PrismaClient` connected to the test DB. Includes `cleanDatabase()` to truncate tables between tests (respecting FK order). |
| 0b.5 | Add sample integration test | BE | `src/app.controller.spec.ts` — tests `GET /api/v1/health` returns `{ status: 'ok' }` against the real test DB. Validates the full setup works. |
| 0b.6 | Install Jest for frontend non-UI tests | FE | `jest`, `ts-jest`, `@testing-library/jest-dom`. Configure `jest.config.ts` for `.ts` files, exclude `.tsx` component files. |
| 0b.7 | Add sample hook/util test | FE | `src/lib/utils.test.ts` — tests `cn()` utility. Validates Jest setup works. |
| 0b.8 | Install and configure Playwright | FE | `@playwright/test`. `playwright.config.ts` — base URL, Chromium project, web server auto-start. |
| 0b.9 | Add sample Playwright E2E test | FE | `e2e/health.spec.ts` — navigates to the app, verifies it renders without crashing. |
| 0b.10 | Add test scripts to `package.json` | Both | BE: `"test"`, `"test:watch"`, `"test:cov"`. FE: `"test"` (Jest), `"test:e2e"` (Playwright). |

→ _Full details: `specs/test-setup.md`_

---

### US-1: Seed Organization & Admin Bootstrap ✅

| # | Task | Layer | Details |
|---|------|-------|---------|
| 1.1 | Create Prisma seed script | BE | `prisma/seed.ts` — creates a default Organization with default settings. Upsert so it's idempotent. |
| 1.2 | Configure `prisma db seed` in `package.json` | BE | Add `"prisma": { "seed": "ts-node prisma/seed.ts" }` to `package.json`. |
| 1.3 | Create initial migration | BE | Run `prisma migrate dev --name init` to generate the first migration from the schema. |

---

### US-2: Google OAuth Login ✅

| # | Task | Layer | Details |
|---|------|-------|---------|
| 2.1 | Install auth dependencies | BE | `@nestjs/passport`, `passport`, `passport-google-oauth20`, `@nestjs/jwt`, `passport-jwt`, types. |
| 2.2 | Create `AuthModule` | BE | Module with `PassportModule`, `JwtModule` (async config from `ConfigService`). |
| 2.3 | Implement Google OAuth Strategy | BE | `GoogleStrategy` extending `PassportStrategy`. Validates callback, looks up user by email, rejects if not invited. |
| 2.4 | Create `AuthController` | BE | `GET /auth/google` — initiates OAuth. `GET /auth/google/callback` — handles callback, sets tokens, redirects to frontend. |
| 2.5 | Implement `AuthService` | BE | `validateOAuthUser()` — finds or activates user, rejects unknown emails. `login()` — generates access + refresh JWT pair. |
| 2.6 | Store refresh token | BE | Add `refreshToken` (hashed) column to User or a separate `RefreshToken` table. Hash before storing. |
| 2.7 | Create login page | FE | `/login` route with "Sign in with Google" button linking to `GET /api/v1/auth/google`. |
| 2.8 | Handle OAuth redirect | FE | `/auth/callback` route that receives tokens from backend redirect, stores access token in memory, refresh token in HTTP-only cookie. |

---

### US-3: JWT Session Management ✅

| # | Task | Layer | Details |
|---|------|-------|---------|
| 3.1 | Implement JWT Strategy | BE | `JwtStrategy` extending `PassportStrategy` — validates access token, attaches user to request. |
| 3.2 | Implement `POST /auth/refresh` | BE | Accepts refresh token (from cookie), validates, issues new access + refresh pair. Rotates refresh token. |
| 3.3 | Implement `POST /auth/logout` | BE | Invalidates refresh token in DB. Clears cookie. |
| 3.4 | Implement `GET /auth/me` | BE | Returns current user profile (id, email, name, avatar, teams with roles, admin status). |
| 3.5 | Create API client with interceptor | FE | Axios/fetch wrapper that attaches `Authorization: Bearer` header, intercepts 401, calls `/auth/refresh`, retries original request. |
| 3.6 | Create `AuthProvider` context | FE | React context providing `user`, `isAuthenticated`, `login()`, `logout()`. Calls `/auth/me` on app load. |
| 3.7 | Add `ProtectedRoute` wrapper | FE | Route guard that redirects to `/login` if not authenticated. |

---

### US-4: Role-Based Access Guard ✅

| # | Task | Layer | Details |
|---|------|-------|---------|
| 4.1 | Create `@Roles()` decorator | BE | Custom decorator to annotate endpoints with required roles. |
| 4.2 | Create `RolesGuard` | BE | NestJS guard that checks the user's role against the required roles. For team-scoped endpoints, resolve the user's role in the relevant team. |
| 4.3 | Create `@IsAdmin()` guard | BE | Shorthand guard for admin-only endpoints (checks `user.isAdmin`). |
| 4.4 | Create `@IsProjectOwner()` guard | BE | Guard that checks if the current user is the owner of the target project. |
| 4.5 | Create `TeamMemberGuard` | BE | Guard that checks if user has the required role within a specific team. Resolves `teamId` from route param or resource. |

---

### US-5: Invite Users

| # | Task | Layer | Details |
|---|------|-------|---------|
| 5.1 | Create `InvitationsModule` | BE | Module, controller, service. |
| 5.2 | Implement `POST /invitations` | BE | Admin-only. Accepts `{ email, teamAssignments: [{ teamId, role }] }`. Generates secure random token, sets expiry (7 days), creates `Invitation` + `InvitationTeamAssignment` rows. |
| 5.3 | Send invitation email | BE | Integrate a mailer (e.g. `@nestjs-modules/mailer` or simple SMTP). Send email with invite link: `{FRONTEND_URL}/invite/{token}`. |
| 5.4 | Implement `GET /invitations` | BE | Admin-only. List invitations with status, email, expiry, team assignments. Paginated. |
| 5.5 | Implement `DELETE /invitations/:id` | BE | Admin-only. Revoke a pending invitation (set status to `revoked`). |
| 5.6 | Implement `POST /invitations/:id/resend` | BE | Admin-only. Resets expiry and resends email. |
| 5.7 | Create invitation management UI | FE | Admin page: list of invitations, "Invite User" form (email + team/role picker), revoke & resend buttons. |

---

### US-6: Accept Invitation

| # | Task | Layer | Details |
|---|------|-------|---------|
| 6.1 | Create invite landing page | FE | `/invite/:token` route — shows org name and invite details, "Accept & Sign in with Google" button. |
| 6.2 | Update Google OAuth callback | BE | If login is via invite link, validate token, create `User` (status: active), create `TeamMember` rows from `InvitationTeamAssignment`, mark invitation as `accepted`. |
| 6.3 | Handle expired/revoked invitations | BE+FE | Backend rejects invalid tokens with clear error. Frontend shows appropriate message. |

---

### US-7: Manage Users

| # | Task | Layer | Details |
|---|------|-------|---------|
| 7.1 | Create `UsersModule` | BE | Module, controller, service. |
| 7.2 | Implement `GET /users` | BE | Admin-only. Paginated list with filters (team, role, status) and search (name, email). Includes team memberships. |
| 7.3 | Implement `GET /users/:id` | BE | Admin-only. User detail with all team memberships and project assignments. |
| 7.4 | Implement `PATCH /users/:id` | BE | Admin-only. Update team assignments and admin status. |
| 7.5 | Implement `PATCH /users/:id/deactivate` | BE | Admin-only. Set status to `deactivated`, remove from active project assignments. Prevent deactivating last admin. |
| 7.6 | Implement `PATCH /users/:id/reactivate` | BE | Admin-only. Set status to `active`. User must be re-assigned to projects manually. |
| 7.7 | Create user management UI | FE | Admin page: user table with filters/search, detail drawer, deactivate/reactivate actions, role editing. |

---

### US-8: Manage Teams

| # | Task | Layer | Details |
|---|------|-------|---------|
| 8.1 | Create `TeamsModule` | BE | Module, controller, service. |
| 8.2 | Implement `GET /teams` | BE | Admin sees all teams. Manager/Member sees only own teams. Returns name, member count, manager names. |
| 8.3 | Implement `POST /teams` | BE | Admin-only. Creates team with name and description. Validates unique name per org. |
| 8.4 | Implement `GET /teams/:id` | BE | Team detail with member list (name, email, role). Admin or team member. |
| 8.5 | Implement `PATCH /teams/:id` | BE | Admin-only. Update name, description. |
| 8.6 | Implement `PATCH /teams/:id/archive` | BE | Admin-only. Soft-archive team. |
| 8.7 | Implement `POST /teams/:id/members` | BE | Admin-only. Add user to team with role. |
| 8.8 | Implement `PATCH /teams/:id/members/:userId` | BE | Admin-only. Change member's role in team. Prevent removing last manager. |
| 8.9 | Implement `DELETE /teams/:id/members/:userId` | BE | Admin-only. Remove member from team. |
| 8.10 | Create team management UI | FE | Admin page: team list, create/edit team, member list with add/remove/role-change. |

---

### US-9: Admin Panel — Org Settings

| # | Task | Layer | Details |
|---|------|-------|---------|
| 9.1 | Implement `GET /org/settings` | BE | Admin-only. Returns org settings from `organization.settings` JSON column. |
| 9.2 | Implement `PATCH /org/settings` | BE | Admin-only. Merges updates into settings JSON. Validates value types and ranges. |
| 9.3 | Create settings UI | FE | Admin page: form with expected hours/week, warning thresholds, date format dropdown, CSV max rows. Save button. |

---

### US-10: Create & Manage Projects

| # | Task | Layer | Details |
|---|------|-------|---------|
| 10.1 | Create `ProjectsModule` | BE | Module, controller, service. |
| 10.2 | Implement `GET /projects` | BE | Scoped: Admin sees all, Manager sees owned + team-related, Member sees assigned only. Filterable by status. |
| 10.3 | Implement `POST /projects` | BE | Admin or Manager. Creates project with name, description. Creator is set as owner. |
| 10.4 | Implement `GET /projects/:id` | BE | Project detail with member list and team affiliation. Accessible by project member or Admin. |
| 10.5 | Implement `PATCH /projects/:id` | BE | Admin or Owner. Update name, description. |
| 10.6 | Implement `PATCH /projects/:id/archive` | BE | Admin or Owner. Set status to `archived`. |
| 10.7 | Create project list UI | FE | Project list page with status filter, create project dialog. |
| 10.8 | Create project detail UI | FE | Detail page showing project info, member list, edit/archive actions (for Owner/Admin). |

---

### US-11: Assign Members to Projects

| # | Task | Layer | Details |
|---|------|-------|---------|
| 11.1 | Implement `POST /projects/:id/members` | BE | Admin or Owner. Add user to project. Validate user exists and is active. |
| 11.2 | Implement `DELETE /projects/:id/members/:userId` | BE | Admin or Owner. Remove user from project. Existing time logs remain. |
| 11.3 | Add member assignment UI to project detail | FE | User picker to add members, remove button per member row. |

---

### US-12: Transfer Project Ownership

| # | Task | Layer | Details |
|---|------|-------|---------|
| 12.1 | Implement `PATCH /projects/:id/transfer` | BE | Admin or current Owner. Accept `{ newOwnerId }`. Validate target is Admin or Manager. |
| 12.2 | Add transfer ownership UI | FE | Button on project detail page, user picker for new owner. |

---

### US-13: Log Time (Manual Entry)

| # | Task | Layer | Details |
|---|------|-------|---------|
| 13.1 | Create `TimeLogsModule` | BE | Module, controller, service. |
| 13.2 | Implement `POST /time-logs` | BE | Create time log. Accept `{ projectId, taskLabel, date, hours, notes }`. Validate project assignment, date not future, hours range. Auto-create task if new (calls TasksService). |
| 13.3 | Implement `GET /time-logs` | BE | Paginated, filtered list. Scoped by role: member sees own, manager sees team, admin sees all. Filters: userId, projectId, taskId, dateFrom, dateTo, teamId. |
| 13.4 | Create time log entry form | FE | Form: date picker (default today), project dropdown, task input (with autocomplete — US-15), hours input, notes textarea. Submit button. |
| 13.5 | Create time log list view | FE | Table with date, project, task, hours, notes, edit/delete actions. Date range filter, project filter. Summary row with total hours. |

---

### US-14: Auto-Create Tasks

| # | Task | Layer | Details |
|---|------|-------|---------|
| 14.1 | Create `TasksModule` | BE | Module, controller, service. |
| 14.2 | Implement `findOrCreate` in `TasksService` | BE | Find task by `labelNormalized` (lowercased) in project. If not found, create it. Return task entity. Called from `TimeLogsService.create()`. |
| 14.3 | Implement `GET /projects/:projectId/tasks` | BE | List tasks in a project. Returns id, label, time log count. For project members. |

---

### US-15: Task Autocomplete

| # | Task | Layer | Details |
|---|------|-------|---------|
| 15.1 | Add search param to `GET /projects/:projectId/tasks` | BE | Accept `?q=` query param. Filter by label (case-insensitive `LIKE`). Order: recently used by current user first, then by others. Limit 10. |
| 15.2 | Create autocomplete component | FE | Debounced input that calls the tasks endpoint on type. Show dropdown of suggestions. Allow free-text entry for new tasks. |

---

### US-16: Edit & Delete Time Logs

| # | Task | Layer | Details |
|---|------|-------|---------|
| 16.1 | Implement `PATCH /time-logs/:id` | BE | Update time log fields. Validate ownership or manager/owner/admin permission. If task label changed, call `findOrCreate`. If project changed, validate assignment. |
| 16.2 | Implement `DELETE /time-logs/:id` | BE | Soft-delete (set `isDeleted = true`). Same permission check. |
| 16.3 | Add edit/delete to time log list | FE | Edit button opens inline edit or modal with pre-filled form. Delete button with confirmation dialog. |

---

### US-17: CSV Import

| # | Task | Layer | Details |
|---|------|-------|---------|
| 17.1 | Implement `POST /time-logs/import` | BE | Accept `multipart/form-data` CSV file. Parse rows, validate each (project match, date format, hours range, max rows). Return `{ totalRows, imported, errors: [{ row, field, message }] }`. Auto-create tasks. For managers: accept optional `user_email` column. |
| 17.2 | Create CSV import UI | FE | "Import CSV" button on time log page. File upload, preview valid/invalid rows, confirm import, show results. Download CSV template link. |

---

### US-18: Soft Warnings

| # | Task | Layer | Details |
|---|------|-------|---------|
| 18.1 | Add warning check to `POST /time-logs` response | BE | After creating time log, calculate daily and weekly totals. If exceeding thresholds (from org settings), include `warnings: []` in response. |
| 18.2 | Display warnings in UI | FE | Show yellow alert banner when response includes warnings. E.g. "Your total for March 25 is 13.5h (exceeds 12h daily threshold)." Allow dismissal. |

---

### US-19: Rename Task

| # | Task | Layer | Details |
|---|------|-------|---------|
| 19.1 | Implement `PATCH /projects/:projectId/tasks/:id` | BE | Admin or Owner. Update label and labelNormalized. Validate no conflict with existing tasks in same project. |
| 19.2 | Add rename action to task list UI | FE | Inline edit or modal on task list. Owner/Admin only. |

---

### US-20: Merge Tasks

| # | Task | Layer | Details |
|---|------|-------|---------|
| 20.1 | Implement `POST /projects/:projectId/tasks/merge` | BE | Admin or Owner. Accept `{ sourceTaskId, targetTaskId }`. Reassign all time logs from source to target. Delete source task. Validate both tasks are in same project. |
| 20.2 | Add merge action to task list UI | FE | Select source task, pick target from dropdown, confirm merge. Show count of affected time logs. |

---

### US-21: Member Personal Dashboard

| # | Task | Layer | Details |
|---|------|-------|---------|
| 21.1 | Implement `GET /reports/summary` | BE | Returns: this week's total hours + daily breakdown, this month's total, top projects (hours per project, current month), last 10 time log entries. Scoped to current user for members. |
| 21.2 | Create dashboard page | FE | Home page for members. Cards: weekly hours with daily bar chart, monthly hours, top projects pie chart, recent activity list. |

---

### US-22: Manager Dashboard

| # | Task | Layer | Details |
|---|------|-------|---------|
| 22.1 | Implement `GET /reports/by-user` | BE | Manager+. Hours per user for a date range, filtered by team. |
| 22.2 | Implement `GET /reports/by-project` | BE | Manager+. Hours per project for a date range. |
| 22.3 | Implement `GET /reports/trend` | BE | Manager+. Time series: weekly or monthly totals over a range. |
| 22.4 | Implement `GET /reports/utilization` | BE | Manager+. Per-user utilization = logged hours / expected hours. Uses org settings for expected hours/week. |
| 22.5 | Implement `GET /reports/by-task` | BE | Manager+. Hours per task within a project + date range. |
| 22.6 | Create manager dashboard page | FE | Dashboard with chart widgets: team hours (stacked bar), hours by project (pie), trend (line), utilization (bar), task breakdown (bar). Date range picker. Team filter. |

---

### US-23: Admin Dashboard

| # | Task | Layer | Details |
|---|------|-------|---------|
| 23.1 | Extend report endpoints for admin scope | BE | Admin users bypass team filter — see all data. No new endpoints needed, just scope logic. |
| 23.2 | Reuse manager dashboard with admin scope | FE | Same dashboard component. Admin sees all-teams selector, no default team filter. |

---

### US-24: Report Builder

| # | Task | Layer | Details |
|---|------|-------|---------|
| 24.1 | Implement `GET /reports/by-team` | BE | Manager+. Hours grouped by team for a date range. |
| 24.2 | Create report builder UI | FE | Page with: group-by dimension pickers (multi-level nesting), filter controls, results table with the selected metrics, chart type selector. |
| 24.3 | Implement dynamic grouping on backend | BE | Accept `group_by` as a list of dimensions. Return nested aggregation results. |

---

### US-25: Export Reports (CSV & PDF)

| # | Task | Layer | Details |
|---|------|-------|---------|
| 25.1 | Implement `GET /reports/export/csv` | BE | Accept same filters as report endpoints. Stream CSV response with headers + data rows. |
| 25.2 | Implement `GET /reports/export/pdf` | BE | Accept same filters. Generate styled PDF with charts (server-side rendering or table-only). Use a library like `pdfkit` or `puppeteer`. |
| 25.3 | Add export buttons to dashboard and report builder | FE | "Export CSV" and "Export PDF" buttons. Download file on click. |

---

## Implementation Order Summary

```
Phase 0 — DevOps & Test Infrastructure (US-0a → US-0b) ✅
  GitHub setup, CI/CD, Jest + Testcontainers, Playwright.

Phase 1 — Foundation (US-1 → US-4) ✅
  Seed DB, Google OAuth, JWT sessions, role guards.

Phase 2 — Admin & Teams (US-5 → US-9) ✅
  Invitations, user/team management, org settings.

Phase 3 — Projects (US-10 → US-12)
  Project CRUD, member assignment, ownership transfer.

Phase 4 — Time Logging (US-13 → US-18)
  Core time logging, tasks, CSV import, warnings.

Phase 5 — Task Management (US-19 → US-20)
  Rename and merge tasks.

Phase 6 — Reporting (US-21 → US-25)
  Dashboards, report builder, exports.
```
