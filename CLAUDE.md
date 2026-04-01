# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Clockwise is a time-tracking application. Team members log working hours against tasks/projects, managers view reports. Single-tenant, containerized.

**Stack:** React (Vite) + shadcn/ui + Tailwind | NestJS REST API | PostgreSQL | Prisma | Docker

**Roles:** Admin (org-wide), Manager (per-team), Member (per-team). Roles are assigned per team — a user can be Manager in one team and Member in another.

## Docker

```bash
# Development (hot reload, exposed ports)
docker compose -f docker-compose.yml -f docker-compose.dev.yml up

# Production
docker compose up
```

## Domain Model

```
Organization → Teams → TeamMembers (user + role)
            → Projects → ProjectMembers, Tasks, TimeLogs
            → Invitations → InvitationTeamAssignments
```

Tasks are auto-created when a user logs time with a new identifier. Tasks are scoped per-project.

## Key Conventions

- Keep files small and single-purpose — aim for ~100 lines, hard max 300 lines.
- **Never delete data records** — mark them as deactivated, archived, revoked, etc. All records must be preserved for audit log integrity.
- All soft-deletes use `isDeleted` boolean (not actual deletion)
- Team archival uses `isArchived`, project archival uses `status: archived`
- Org settings stored as JSONB on the `organization` table
- No barrel imports — do not create `index.ts` re-export files. Always import directly from the source file.

## Specs

All feature specs live in `specs/`. Read `specs/overview.md` for the high-level picture. `specs/implementation-plan.md` has user stories and task breakdowns organized by phase.

## Environment

Copy `.env.example` to `.env`. Required vars: `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`, `FRONTEND_URL`.
