# API Design

## Overview
RESTful API built with NestJS. All endpoints return JSON. Authentication via JWT Bearer token (except auth endpoints).

---

## Conventions
- Base URL: `/api/v1`
- Resource naming: plural nouns (`/users`, `/teams`, `/projects`)
- HTTP methods: GET (read), POST (create), PATCH (update), DELETE (soft-delete)
- Pagination: `?page=1&limit=20` (default limit: 20, max: 100)
- Sorting: `?sort=created_at&order=desc`
- Filtering: query params per field (e.g. `?status=active`)
- Errors: `{ statusCode, message, error }` format (NestJS default)
- Dates in responses: ISO 8601

---

## Endpoints

### Auth

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/auth/google` | Initiate Google OAuth flow | No |
| GET | `/auth/google/callback` | Google OAuth callback | No |
| POST | `/auth/refresh` | Refresh access token | Refresh token |
| POST | `/auth/logout` | Invalidate refresh token | Yes |
| GET | `/auth/me` | Get current user profile | Yes |

### Users (Admin)

| Method | Path | Description | Role |
|--------|------|-------------|------|
| GET | `/users` | List all users (paginated, filterable) | Admin |
| GET | `/users/:id` | Get user detail | Admin |
| PATCH | `/users/:id` | Update user (team assignments, admin status) | Admin |
| PATCH | `/users/:id/deactivate` | Deactivate user | Admin |
| PATCH | `/users/:id/reactivate` | Reactivate user | Admin |

### Invitations (Admin)

| Method | Path | Description | Role |
|--------|------|-------------|------|
| POST | `/invitations` | Send invitation | Admin |
| GET | `/invitations` | List all invitations | Admin |
| DELETE | `/invitations/:id` | Revoke invitation | Admin |
| POST | `/invitations/:id/resend` | Resend invitation email | Admin |

### Teams

| Method | Path | Description | Role |
|--------|------|-------------|------|
| GET | `/teams` | List teams (Admin: all, Manager/Member: own teams) | Any |
| POST | `/teams` | Create team | Admin |
| GET | `/teams/:id` | Get team detail with members | Admin, team member |
| PATCH | `/teams/:id` | Update team (name, description) | Admin |
| PATCH | `/teams/:id/archive` | Archive team | Admin |
| POST | `/teams/:id/members` | Add member to team | Admin |
| PATCH | `/teams/:id/members/:userId` | Change member role | Admin |
| DELETE | `/teams/:id/members/:userId` | Remove member from team | Admin |

### Projects

| Method | Path | Description | Role |
|--------|------|-------------|------|
| GET | `/projects` | List projects (scoped by role) | Any |
| POST | `/projects` | Create project | Admin, Manager |
| GET | `/projects/:id` | Get project detail with members | Project member, Admin |
| PATCH | `/projects/:id` | Update project | Admin, Owner |
| PATCH | `/projects/:id/archive` | Archive project | Admin, Owner |
| PATCH | `/projects/:id/transfer` | Transfer ownership | Admin, Owner |
| POST | `/projects/:id/members` | Add member to project | Admin, Owner |
| DELETE | `/projects/:id/members/:userId` | Remove member from project | Admin, Owner |

### Tasks

| Method | Path | Description | Role |
|--------|------|-------------|------|
| GET | `/projects/:projectId/tasks` | List tasks in project | Project member |
| PATCH | `/projects/:projectId/tasks/:id` | Rename task | Admin, Owner |
| POST | `/projects/:projectId/tasks/merge` | Merge two tasks | Admin, Owner |

_Note: Tasks are auto-created via time log creation. No explicit POST endpoint._

### Time Logs

| Method | Path | Description | Role |
|--------|------|-------------|------|
| GET | `/time-logs` | List time logs (filtered, paginated) | Any (scoped) |
| POST | `/time-logs` | Create time log | Any |
| PATCH | `/time-logs/:id` | Update time log | Owner, Manager, Admin |
| DELETE | `/time-logs/:id` | Soft-delete time log | Owner, Manager, Admin |
| POST | `/time-logs/import` | CSV bulk import | Any |

**Query params for GET `/time-logs`:**
- `user_id` — filter by user (Manager/Admin only)
- `project_id` — filter by project
- `task_id` — filter by task
- `date_from`, `date_to` — date range
- `team_id` — filter by team (Manager/Admin only)

### Reports

| Method | Path | Description | Role |
|--------|------|-------------|------|
| GET | `/reports/summary` | Dashboard summary (hours this week/month) | Any (scoped) |
| GET | `/reports/by-user` | Hours grouped by user | Manager, Admin |
| GET | `/reports/by-project` | Hours grouped by project | Manager, Admin |
| GET | `/reports/by-task` | Hours grouped by task within a project | Manager, Admin |
| GET | `/reports/by-team` | Hours grouped by team | Manager, Admin |
| GET | `/reports/trend` | Time series (weekly/monthly totals) | Manager, Admin |
| GET | `/reports/utilization` | Utilization rates per user | Manager, Admin |
| GET | `/reports/export/csv` | Export report as CSV | Manager, Admin |
| GET | `/reports/export/pdf` | Export report as PDF | Manager, Admin |

**Common query params for all report endpoints:**
- `date_from`, `date_to` — required date range
- `team_id` — filter by team
- `project_id` — filter by project
- `user_id` — filter by user
- `group_by` — grouping dimension (where applicable)

### Organization Settings (Admin)

| Method | Path | Description | Role |
|--------|------|-------------|------|
| GET | `/org/settings` | Get organization settings | Admin |
| PATCH | `/org/settings` | Update organization settings | Admin |

---

## Request/Response Examples

### Create Time Log
```
POST /api/v1/time-logs
{
  "project_id": "uuid",
  "task_label": "JIRA-123",
  "date": "2026-03-25",
  "hours": 2.5,
  "notes": "Implemented login flow"
}

Response 201:
{
  "id": "uuid",
  "user_id": "uuid",
  "project_id": "uuid",
  "task": {
    "id": "uuid",
    "label": "JIRA-123"
  },
  "date": "2026-03-25",
  "hours": 2.5,
  "notes": "Implemented login flow",
  "created_at": "2026-03-25T10:30:00Z"
}
```

### CSV Import
```
POST /api/v1/time-logs/import
Content-Type: multipart/form-data
Body: file=<csv-file>

Response 200:
{
  "total_rows": 10,
  "imported": 8,
  "errors": [
    { "row": 3, "field": "project", "message": "Project 'Unknown' not found" },
    { "row": 7, "field": "hours", "message": "Invalid value: 'abc'" }
  ]
}
```

### Report Summary
```
GET /api/v1/reports/summary

Response 200:
{
  "this_week": { "total_hours": 32.5, "entry_count": 12 },
  "this_month": { "total_hours": 120.0, "entry_count": 48 },
  "top_projects": [
    { "project_id": "uuid", "name": "Alpha", "hours": 60.0 },
    { "project_id": "uuid", "name": "Beta", "hours": 40.0 }
  ]
}
```

---

## Error Codes

| Status | Usage |
|--------|-------|
| 400 | Validation errors (bad input) |
| 401 | Missing or invalid JWT |
| 403 | Insufficient permissions |
| 404 | Resource not found |
| 409 | Conflict (e.g. duplicate team name, task label collision) |
| 422 | Business rule violation (e.g. logging time on archived project) |
