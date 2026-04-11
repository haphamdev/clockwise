# Clockwise

A time-tracking application where team members log working hours against tasks and projects, and managers view reports with charts and export capabilities. Single-tenant, containerized.

## Features

- **Google OAuth login** with role-based access control (Admin, Manager, Member)
- **Team management** — create teams, assign managers, add/remove members
- **Project management** — create projects linked to teams, with optional hour limits
- **Time logging** — manual entry by date/project/task/hours, or CSV bulk import
- **Auto-created tasks** — tasks are created implicitly when a user first logs time against them
- **CSV import** — bulk import for time logs, teams, projects, and invitations with preview/validation
- **User invitations** — invite users by email, assign to teams, track acceptance
- **Audit logging** — all entity changes are tracked with before/after metadata
- **Reporting & dashboard** — time per user, per project, weekly/monthly trends (in progress)

Roles are per-team: a user can be a Manager in one team and a Member in another.

## Tech Stack

| Layer          | Technology                                  |
| -------------- | ------------------------------------------- |
| Frontend       | React (Vite) + shadcn/ui + Tailwind CSS     |
| Backend        | NestJS REST API                             |
| Database       | PostgreSQL + Prisma ORM                     |
| Auth           | Google OAuth 2.0, JWT access/refresh tokens |
| Queue          | BullMQ + Redis (email sending, import jobs) |
| Infrastructure | Docker Compose                              |

## Prerequisites

- Docker and Docker Compose
- Node.js 22+ and pnpm (for local development without Docker)
- A Google OAuth app ([console.cloud.google.com](https://console.cloud.google.com/apis/credentials))

## Getting Started

### 1. Environment setup

```bash
cp .env.example .env
```

Edit `.env` and fill in:

- `ADMIN_EMAIL` — your Google account email (becomes the first admin)
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — from Google Cloud Console
- `JWT_SECRET` / `JWT_REFRESH_SECRET` — generate with `openssl rand -base64 32`

### 2. Start with Docker Compose

```bash
# Development (hot reload, ports exposed)
docker compose -f docker-compose.yml -f docker-compose.dev.yml up

# Production
docker compose up
```

Development mode exposes:

- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- PostgreSQL: localhost:5432
- Redis: localhost:6379

### 3. Run database migrations and seed

```bash
cd backend
pnpm install
pnpm prisma migrate deploy   # Apply migrations
pnpm prisma db seed           # Create org + admin user
```

### 4. Sign in

Open http://localhost:5173 and sign in with the Google account matching `ADMIN_EMAIL`.

## Seeding Test Data

After the base seed, you can populate the database with realistic test data (50 users, 10 teams, invitations, audit logs):

```bash
cd backend
DATABASE_URL="postgresql://clockwise:clockwise@localhost:5432/clockwise" ADMIN_EMAIL=<admin_email> pnpm seed:users
```

This creates:

- 10 teams (Engineering, Design, Marketing, Sales, Customer Support, Product, QA, DevOps, Data Science, HR)
- 50 users with `@clockwise.test` emails — 40 active (accepted invitations), 10 pending (expired)
- ~57 team memberships with managers and cross-team assignments
- ~204 audit log entries tracking the full invitation lifecycle

The seed is idempotent — running it again skips if `@clockwise.test` users already exist.

## API Testing with Bruno

The `bruno/clockwise/` directory contains a [Bruno](https://www.usebruno.com/) collection for manual API testing. Collections are organized by domain:

```
bruno/clockwise/
  import/          # CSV import: preview, execute, download templates
  projects/        # Project CRUD, team assignments
  tasks/           # Task listing
  time-logs/       # Time log CRUD
  user-preferences/
```

Open Bruno, select "Open Collection", and point it to `bruno/clockwise/`.

## Example Import CSV Files

The `resources/example-import-data/` directory contains ready-to-use CSV files for testing the import feature:

```
resources/example-import-data/
  teams/
    happy-path-5-teams.csv          # 5 valid teams with seeded user emails
    mixed-valid-and-errors.csv      # Valid rows + missing names, duplicates, bad emails
  projects/
    happy-path-10-projects.csv      # 10 projects linked to seeded teams
    mixed-valid-and-errors.csv      # Valid rows + missing names, invalid status, bad teams
  timelog/
    happy-path-25-rows.csv          # 25 valid time log entries
    happy-path-200-rows.csv         # 200 valid entries across 20 users, 10 projects
    mixed-valid-and-errors.csv      # Valid + errors (bad dates, hours, duplicates, etc.)
    error-*.csv                     # Targeted error scenarios
```

These CSV files reference the seeded test data (`@clockwise.test` users and team names), so run `pnpm seed:users` and import the projects CSV before testing time log imports.

## Project Structure

```
clockwise/
  frontend/         # React + Vite app
  backend/          # NestJS API
    prisma/          # Schema, migrations, seed scripts
    src/modules/     # Feature modules (auth, teams, projects, import, etc.)
  bruno/             # Bruno API collection
  resources/         # Example import CSVs
  specs/             # Feature specifications
```

## Running Without Docker

```bash
# Backend (requires local PostgreSQL + Redis)
cd backend
pnpm install
pnpm prisma migrate deploy
pnpm start:dev

# Frontend
cd frontend
pnpm install
pnpm dev
```

Update `DATABASE_URL` and `REDIS_HOST` in `.env` to use `localhost` instead of Docker service names.

## Demo

Please check the demo screenshots in [demo](./demo) directory
