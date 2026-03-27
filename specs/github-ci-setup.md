# GitHub Repository & CI Setup

## Overview
Connect the local repository to GitHub, set up labels/milestones/issues for project tracking, and configure GitHub Actions for continuous integration.

---

## 1. Repository Setup

### Set Upstream Remote
```bash
git remote add origin https://github.com/haphamdev/clockwise.git
git push -u origin --all
```

---

## 2. GitHub Labels

Create labels for categorization. Run via `gh label create`.

### Epic Labels

| Label | Color | Description |
|-------|-------|-------------|
| `epic:devops` | `#E0E0E0` | DevOps & test infrastructure |
| `epic:foundation` | `#0052CC` | Seed, auth, sessions, guards |
| `epic:org-team` | `#1D76DB` | Invitations, users, teams, org settings |
| `epic:projects` | `#0E8A16` | Project CRUD, members, ownership |
| `epic:time-logging` | `#D93F0B` | Time entry, tasks, CSV import |
| `epic:tasks` | `#FBCA04` | Rename, merge tasks |
| `epic:reporting` | `#B60205` | Dashboards, reports, exports |

### Layer Labels

| Label | Color | Description |
|-------|-------|-------------|
| `backend` | `#5319E7` | Backend changes |
| `frontend` | `#006B75` | Frontend changes |
| `devops` | `#BFD4F2` | CI/CD, Docker, infra |

### Type Labels

| Label | Color | Description |
|-------|-------|-------------|
| `user-story` | `#C5DEF5` | User story (parent issue) |
| `bug` | `#D73A4A` | Bug fix |
| `enhancement` | `#A2EEEF` | Improvement to existing feature |

---

## 3. GitHub Milestones

One milestone per epic, used to track progress.

| Milestone | Description |
|-----------|-------------|
| Epic 0: DevOps & Test Infrastructure | GitHub setup, CI/CD, Jest, Testcontainers, Playwright |
| Epic 1: Foundation | Seed, OAuth, JWT, Guards |
| Epic 2: Organization & Team Management | Invitations, Users, Teams, Org Settings |
| Epic 3: Project Management | Project CRUD, Members, Ownership |
| Epic 4: Time Logging | Manual entry, Tasks, CSV import, Warnings |
| Epic 5: Task Management | Rename, Merge |
| Epic 6: Reporting & Dashboard | Dashboards, Report Builder, Exports |

---

## 4. GitHub Issues

Each user story (US-0a through US-25) becomes a GitHub issue with:
- **Title**: `US-{N}: {Story title}`
- **Labels**: `user-story` + epic label + layer labels
- **Milestone**: The corresponding epic milestone
- **Body**: The user story text + a task checklist

### Issue Creation Script

A shell script (`scripts/create-github-issues.sh`) automates this:

```bash
#!/usr/bin/env bash
set -euo pipefail

# 1. Create labels
gh label create "epic:devops"      --color "E0E0E0" --force
gh label create "epic:foundation"  --color "0052CC" --force
gh label create "epic:org-team"    --color "1D76DB" --force
gh label create "epic:projects"    --color "0E8A16" --force
gh label create "epic:time-logging" --color "D93F0B" --force
gh label create "epic:tasks"       --color "FBCA04" --force
gh label create "epic:reporting"   --color "B60205" --force
gh label create "backend"          --color "5319E7" --force
gh label create "frontend"         --color "006B75" --force
gh label create "devops"           --color "BFD4F2" --force
gh label create "user-story"       --color "C5DEF5" --force
gh label create "bug"              --color "D73A4A" --force
gh label create "enhancement"      --color "A2EEEF" --force

# 2. Create milestones
for i in \
  "Epic 0: DevOps & Test Infrastructure|GitHub setup, CI/CD, Jest, Testcontainers, Playwright" \
  "Epic 1: Foundation|Seed, OAuth, JWT, Guards" \
  "Epic 2: Organization & Team Management|Invitations, Users, Teams, Org Settings" \
  "Epic 3: Project Management|Project CRUD, Members, Ownership" \
  "Epic 4: Time Logging|Manual entry, Tasks, CSV import, Warnings" \
  "Epic 5: Task Management|Rename, Merge" \
  "Epic 6: Reporting & Dashboard|Dashboards, Report Builder, Exports"; do
  title="${i%%|*}"
  desc="${i##*|}"
  gh milestone create "$title" --description "$desc" 2>/dev/null || echo "Milestone '$title' already exists"
done

# 3. Create issues — helper function
create_issue() {
  local title="$1" labels="$2" milestone="$3" body="$4"
  gh issue create --title "$title" --label "$labels" --milestone "$milestone" --body "$body"
}

# --- Epic 0 ---

create_issue "US-0a: GitHub Repository & CI Setup" \
  "user-story,devops,epic:devops" \
  "Epic 0: DevOps & Test Infrastructure" \
  "$(cat <<'EOF'
As a **developer**, I want the local repo connected to GitHub with CI/CD pipelines via GitHub Actions, so that every push and PR is validated automatically.

## Tasks
- [ ] 0a.1 Set upstream remote
- [ ] 0a.2 Create GitHub labels
- [ ] 0a.3 Create GitHub milestones
- [ ] 0a.4 Bulk-create GitHub issues
- [ ] 0a.5 Create GitHub Actions CI workflow
- [ ] 0a.6 Add branch protection rules
EOF
)"

create_issue "US-0b: Test Infrastructure Setup" \
  "user-story,backend,frontend,epic:devops" \
  "Epic 0: DevOps & Test Infrastructure" \
  "$(cat <<'EOF'
As a **developer**, I want Jest + Testcontainers (backend), Jest (frontend non-UI), and Playwright (frontend UI) configured, so that all features can be tested from the start.

## Tasks
- [ ] 0b.1 Install Jest + Testcontainers for backend
- [ ] 0b.2 Create global test setup with Testcontainers
- [ ] 0b.3 Create test data seed utility
- [ ] 0b.4 Create Prisma test helper
- [ ] 0b.5 Add sample integration test
- [ ] 0b.6 Install Jest for frontend non-UI tests
- [ ] 0b.7 Add sample hook/util test
- [ ] 0b.8 Install and configure Playwright
- [ ] 0b.9 Add sample Playwright E2E test
- [ ] 0b.10 Add test scripts to package.json
EOF
)"

# --- Epic 1 ---

create_issue "US-1: Seed Organization & Admin Bootstrap" \
  "user-story,backend,epic:foundation" \
  "Epic 1: Foundation" \
  "$(cat <<'EOF'
As a **system deployer**, I want the system to seed a default organization and an initial Admin user on first run, so that there is an entry point to configure the app.

## Tasks
- [ ] 1.1 Create Prisma seed script
- [ ] 1.2 Configure prisma db seed in package.json
- [ ] 1.3 Create initial migration
EOF
)"

create_issue "US-2: Google OAuth Login" \
  "user-story,backend,frontend,epic:foundation" \
  "Epic 1: Foundation" \
  "$(cat <<'EOF'
As a **user**, I want to sign in with my Google account, so that I can access the app without creating a separate password.

## Tasks
- [ ] 2.1 Install auth dependencies
- [ ] 2.2 Create AuthModule
- [ ] 2.3 Implement Google OAuth Strategy
- [ ] 2.4 Create AuthController
- [ ] 2.5 Implement AuthService
- [ ] 2.6 Store refresh token (hashed)
- [ ] 2.7 Create login page (FE)
- [ ] 2.8 Handle OAuth redirect (FE)
EOF
)"

create_issue "US-3: JWT Session Management" \
  "user-story,backend,frontend,epic:foundation" \
  "Epic 1: Foundation" \
  "$(cat <<'EOF'
As an **authenticated user**, I want my session to persist via JWT tokens with auto-refresh, so that I don't have to re-login frequently.

## Tasks
- [ ] 3.1 Implement JWT Strategy
- [ ] 3.2 Implement POST /auth/refresh
- [ ] 3.3 Implement POST /auth/logout
- [ ] 3.4 Implement GET /auth/me
- [ ] 3.5 Create API client with interceptor (FE)
- [ ] 3.6 Create AuthProvider context (FE)
- [ ] 3.7 Add ProtectedRoute wrapper (FE)
EOF
)"

create_issue "US-4: Role-Based Access Guard" \
  "user-story,backend,epic:foundation" \
  "Epic 1: Foundation" \
  "$(cat <<'EOF'
As the **system**, I want to enforce role-based permissions on all API endpoints, so that users can only perform actions they are authorized for.

## Tasks
- [ ] 4.1 Create @Roles() decorator
- [ ] 4.2 Create RolesGuard
- [ ] 4.3 Create @IsAdmin() guard
- [ ] 4.4 Create @IsProjectOwner() guard
- [ ] 4.5 Create TeamMemberGuard
EOF
)"

# --- Epic 2 ---

create_issue "US-5: Invite Users" \
  "user-story,backend,frontend,epic:org-team" \
  "Epic 2: Organization & Team Management" \
  "$(cat <<'EOF'
As an **Admin**, I want to invite users by email with pre-assigned team(s) and role(s), so that they can join the org on first login.

## Tasks
- [ ] 5.1 Create InvitationsModule
- [ ] 5.2 Implement POST /invitations
- [ ] 5.3 Send invitation email
- [ ] 5.4 Implement GET /invitations
- [ ] 5.5 Implement DELETE /invitations/:id
- [ ] 5.6 Implement POST /invitations/:id/resend
- [ ] 5.7 Create invitation management UI (FE)
EOF
)"

create_issue "US-6: Accept Invitation" \
  "user-story,backend,frontend,epic:org-team" \
  "Epic 2: Organization & Team Management" \
  "$(cat <<'EOF'
As an **invited user**, I want to click the invitation link and sign in with Google to activate my account with the pre-assigned teams and roles.

## Tasks
- [ ] 6.1 Create invite landing page (FE)
- [ ] 6.2 Update Google OAuth callback for invite flow
- [ ] 6.3 Handle expired/revoked invitations
EOF
)"

create_issue "US-7: Manage Users" \
  "user-story,backend,frontend,epic:org-team" \
  "Epic 2: Organization & Team Management" \
  "$(cat <<'EOF'
As an **Admin**, I want to list, view, deactivate, and reactivate users, so that I can control who has access to the system.

## Tasks
- [ ] 7.1 Create UsersModule
- [ ] 7.2 Implement GET /users
- [ ] 7.3 Implement GET /users/:id
- [ ] 7.4 Implement PATCH /users/:id
- [ ] 7.5 Implement PATCH /users/:id/deactivate
- [ ] 7.6 Implement PATCH /users/:id/reactivate
- [ ] 7.7 Create user management UI (FE)
EOF
)"

create_issue "US-8: Manage Teams" \
  "user-story,backend,frontend,epic:org-team" \
  "Epic 2: Organization & Team Management" \
  "$(cat <<'EOF'
As an **Admin**, I want to create, edit, and archive teams, and add/remove members with Manager or Member roles, so that the org structure is maintained.

## Tasks
- [ ] 8.1 Create TeamsModule
- [ ] 8.2 Implement GET /teams
- [ ] 8.3 Implement POST /teams
- [ ] 8.4 Implement GET /teams/:id
- [ ] 8.5 Implement PATCH /teams/:id
- [ ] 8.6 Implement PATCH /teams/:id/archive
- [ ] 8.7 Implement POST /teams/:id/members
- [ ] 8.8 Implement PATCH /teams/:id/members/:userId
- [ ] 8.9 Implement DELETE /teams/:id/members/:userId
- [ ] 8.10 Create team management UI (FE)
EOF
)"

create_issue "US-9: Admin Panel — Org Settings" \
  "user-story,backend,frontend,epic:org-team" \
  "Epic 2: Organization & Team Management" \
  "$(cat <<'EOF'
As an **Admin**, I want to configure org-level settings (expected hours/week, warning thresholds, date format, CSV max rows), so that the app behaves according to our policies.

## Tasks
- [ ] 9.1 Implement GET /org/settings
- [ ] 9.2 Implement PATCH /org/settings
- [ ] 9.3 Create settings UI (FE)
EOF
)"

# --- Epic 3 ---

create_issue "US-10: Create & Manage Projects" \
  "user-story,backend,frontend,epic:projects" \
  "Epic 3: Project Management" \
  "$(cat <<'EOF'
As a **Manager or Admin**, I want to create projects, edit their details, and archive them, so that work can be organized.

## Tasks
- [ ] 10.1 Create ProjectsModule
- [ ] 10.2 Implement GET /projects
- [ ] 10.3 Implement POST /projects
- [ ] 10.4 Implement GET /projects/:id
- [ ] 10.5 Implement PATCH /projects/:id
- [ ] 10.6 Implement PATCH /projects/:id/archive
- [ ] 10.7 Create project list UI (FE)
- [ ] 10.8 Create project detail UI (FE)
EOF
)"

create_issue "US-11: Assign Members to Projects" \
  "user-story,backend,frontend,epic:projects" \
  "Epic 3: Project Management" \
  "$(cat <<'EOF'
As a **Project Owner or Admin**, I want to assign users from any team to a project and remove them, so that the right people can log time.

## Tasks
- [ ] 11.1 Implement POST /projects/:id/members
- [ ] 11.2 Implement DELETE /projects/:id/members/:userId
- [ ] 11.3 Add member assignment UI to project detail (FE)
EOF
)"

create_issue "US-12: Transfer Project Ownership" \
  "user-story,backend,frontend,epic:projects" \
  "Epic 3: Project Management" \
  "$(cat <<'EOF'
As a **Project Owner or Admin**, I want to transfer project ownership to another Admin or Manager, so that project management can be handed off.

## Tasks
- [ ] 12.1 Implement PATCH /projects/:id/transfer
- [ ] 12.2 Add transfer ownership UI (FE)
EOF
)"

# --- Epic 4 ---

create_issue "US-13: Log Time (Manual Entry)" \
  "user-story,backend,frontend,epic:time-logging" \
  "Epic 4: Time Logging" \
  "$(cat <<'EOF'
As a **Member**, I want to select a date, project, task (JIRA ID or text), hours, and notes to log my working time, so that my effort is tracked.

## Tasks
- [ ] 13.1 Create TimeLogsModule
- [ ] 13.2 Implement POST /time-logs
- [ ] 13.3 Implement GET /time-logs
- [ ] 13.4 Create time log entry form (FE)
- [ ] 13.5 Create time log list view (FE)
EOF
)"

create_issue "US-14: Auto-Create Tasks" \
  "user-story,backend,epic:time-logging" \
  "Epic 4: Time Logging" \
  "$(cat <<'EOF'
As the **system**, I want to auto-create a task when a user logs time with a new task identifier within a project, so that users don't need to pre-create tasks.

## Tasks
- [ ] 14.1 Create TasksModule
- [ ] 14.2 Implement findOrCreate in TasksService
- [ ] 14.3 Implement GET /projects/:projectId/tasks
EOF
)"

create_issue "US-15: Task Autocomplete" \
  "user-story,backend,frontend,epic:time-logging" \
  "Epic 4: Time Logging" \
  "$(cat <<'EOF'
As a **user logging time**, I want to see autocomplete suggestions for existing tasks in the selected project, so that I can quickly select the right task.

## Tasks
- [ ] 15.1 Add search param to GET /projects/:projectId/tasks
- [ ] 15.2 Create autocomplete component (FE)
EOF
)"

create_issue "US-16: Edit & Delete Time Logs" \
  "user-story,backend,frontend,epic:time-logging" \
  "Epic 4: Time Logging" \
  "$(cat <<'EOF'
As a **user**, I want to edit or delete my own time logs. As a **Manager**, I want to edit/delete my team members' logs. So that records stay accurate.

## Tasks
- [ ] 16.1 Implement PATCH /time-logs/:id
- [ ] 16.2 Implement DELETE /time-logs/:id
- [ ] 16.3 Add edit/delete to time log list (FE)
EOF
)"

create_issue "US-17: CSV Import" \
  "user-story,backend,frontend,epic:time-logging" \
  "Epic 4: Time Logging" \
  "$(cat <<'EOF'
As a **user**, I want to import time logs in bulk via CSV, so that I can log historical or batch data efficiently.

## Tasks
- [ ] 17.1 Implement POST /time-logs/import
- [ ] 17.2 Create CSV import UI (FE)
EOF
)"

create_issue "US-18: Soft Warnings" \
  "user-story,backend,frontend,epic:time-logging" \
  "Epic 4: Time Logging" \
  "$(cat <<'EOF'
As a **user**, I want to see a warning when my daily total exceeds 12h or weekly total exceeds 60h (configurable), so that I can catch potential mistakes.

## Tasks
- [ ] 18.1 Add warning check to POST /time-logs response
- [ ] 18.2 Display warnings in UI (FE)
EOF
)"

# --- Epic 5 ---

create_issue "US-19: Rename Task" \
  "user-story,backend,frontend,epic:tasks" \
  "Epic 5: Task Management" \
  "$(cat <<'EOF'
As a **Project Owner or Admin**, I want to rename a task's label, so that it is correctly displayed across all time logs and reports.

## Tasks
- [ ] 19.1 Implement PATCH /projects/:projectId/tasks/:id
- [ ] 19.2 Add rename action to task list UI (FE)
EOF
)"

create_issue "US-20: Merge Tasks" \
  "user-story,backend,frontend,epic:tasks" \
  "Epic 5: Task Management" \
  "$(cat <<'EOF'
As a **Project Owner or Admin**, I want to merge duplicate tasks, so that reporting is clean.

## Tasks
- [ ] 20.1 Implement POST /projects/:projectId/tasks/merge
- [ ] 20.2 Add merge action to task list UI (FE)
EOF
)"

# --- Epic 6 ---

create_issue "US-21: Member Personal Dashboard" \
  "user-story,backend,frontend,epic:reporting" \
  "Epic 6: Reporting & Dashboard" \
  "$(cat <<'EOF'
As a **Member**, I want to see my hours this week/month, top projects, and recent activity, so that I have a quick overview of my work.

## Tasks
- [ ] 21.1 Implement GET /reports/summary
- [ ] 21.2 Create dashboard page (FE)
EOF
)"

create_issue "US-22: Manager Dashboard" \
  "user-story,backend,frontend,epic:reporting" \
  "Epic 6: Reporting & Dashboard" \
  "$(cat <<'EOF'
As a **Manager**, I want to see team hours, hours by project, weekly/monthly trends, utilization rates, and task breakdowns, so that I can monitor my team's workload.

## Tasks
- [ ] 22.1 Implement GET /reports/by-user
- [ ] 22.2 Implement GET /reports/by-project
- [ ] 22.3 Implement GET /reports/trend
- [ ] 22.4 Implement GET /reports/utilization
- [ ] 22.5 Implement GET /reports/by-task
- [ ] 22.6 Create manager dashboard page (FE)
EOF
)"

create_issue "US-23: Admin Dashboard" \
  "user-story,backend,frontend,epic:reporting" \
  "Epic 6: Reporting & Dashboard" \
  "$(cat <<'EOF'
As an **Admin**, I want to see the same dashboards as Manager but across all teams, so that I have org-wide visibility.

## Tasks
- [ ] 23.1 Extend report endpoints for admin scope
- [ ] 23.2 Reuse manager dashboard with admin scope (FE)
EOF
)"

create_issue "US-24: Report Builder" \
  "user-story,backend,frontend,epic:reporting" \
  "Epic 6: Reporting & Dashboard" \
  "$(cat <<'EOF'
As a **Manager or Admin**, I want to build custom reports with grouping (user, project, task, date, team), filters, and metrics, so that I can do deeper analysis.

## Tasks
- [ ] 24.1 Implement GET /reports/by-team
- [ ] 24.2 Create report builder UI (FE)
- [ ] 24.3 Implement dynamic grouping on backend
EOF
)"

create_issue "US-25: Export Reports (CSV & PDF)" \
  "user-story,backend,frontend,epic:reporting" \
  "Epic 6: Reporting & Dashboard" \
  "$(cat <<'EOF'
As a **Manager or Admin**, I want to export reports to CSV and PDF, so that I can share them externally.

## Tasks
- [ ] 25.1 Implement GET /reports/export/csv
- [ ] 25.2 Implement GET /reports/export/pdf
- [ ] 25.3 Add export buttons to dashboard and report builder (FE)
EOF
)"

echo ""
echo "Done! All labels, milestones, and issues created."
```

---

## 5. GitHub Actions CI Workflow

### `.github/workflows/ci.yml`

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  backend:
    name: Backend — Lint, Test, Build
    runs-on: ubuntu-latest
    services:
      # Testcontainers manages its own Postgres, no service needed here.
      # Docker-in-Docker is available by default on ubuntu-latest.
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm
          cache-dependency-path: backend/pnpm-lock.yaml
      - run: pnpm install --frozen-lockfile
        working-directory: backend
      - run: pnpm lint
        working-directory: backend
      - run: pnpm test
        working-directory: backend
      - run: pnpm build
        working-directory: backend

  frontend-unit:
    name: Frontend — Lint, Jest
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm
          cache-dependency-path: frontend/pnpm-lock.yaml
      - run: pnpm install --frozen-lockfile
        working-directory: frontend
      - run: pnpm lint
        working-directory: frontend
      - run: pnpm test
        working-directory: frontend
      - run: pnpm build
        working-directory: frontend

  frontend-e2e:
    name: Frontend — Playwright E2E
    runs-on: ubuntu-latest
    needs: [backend, frontend-unit]
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm
          cache-dependency-path: frontend/pnpm-lock.yaml
      - run: pnpm install --frozen-lockfile
        working-directory: frontend
      - run: pnpm exec playwright install --with-deps chromium
        working-directory: frontend
      - run: pnpm test:e2e
        working-directory: frontend
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: frontend/playwright-report/
          retention-days: 7
```

### Key Design Decisions
- **Testcontainers in CI**: Works on `ubuntu-latest` which has Docker available. No need for a `services` block — Testcontainers manages the container lifecycle.
- **Playwright runs after unit tests**: Uses `needs: [backend, frontend-unit]` to avoid wasting CI minutes on E2E if unit tests fail.
- **Playwright artifacts**: Test report and traces are uploaded on failure for debugging.
- **pnpm caching**: Uses `actions/setup-node` cache with lockfile path for fast installs.

---

## 6. Branch Protection

After CI is green, configure branch protection on `main`:

```bash
gh api repos/haphamdev/clockwise/branches/main/protection \
  --method PUT \
  --field required_status_checks='{"strict":true,"contexts":["Backend — Lint, Test, Build","Frontend — Lint, Jest","Frontend — Playwright E2E"]}' \
  --field enforce_admins=false \
  --field required_pull_request_reviews='{"required_approving_review_count":0}' \
  --field restrictions=null
```

This enforces:
- All 3 CI jobs must pass before merging
- Branch must be up to date with `main` before merging
- PRs are required (but no approvals needed for solo dev)
