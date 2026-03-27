# Clockwise — Application Overview

## Purpose
A time-tracking application where team members log working hours against tasks and projects, and managers view reports with charts and export capabilities.

---

## Tech Stack

| Layer          | Technology                          |
|----------------|-------------------------------------|
| Frontend       | React (Vite) + shadcn/ui + Tailwind |
| Backend        | NestJS (REST API)                   |
| Database       | PostgreSQL                          |
| Auth           | SSO / OAuth (Google, Microsoft)     |
| Infrastructure | Docker (containerized)              |

---

## User Roles

| Role    | Description |
|---------|-------------|
| **Admin**   | System-wide administration. Manages teams, assigns managers, configures org settings. |
| **Manager** | Creates projects, assigns members, views/edits time logs for their team, accesses reports. |
| **Member**  | Logs time against tasks, views/edits own time logs, views own summary. |

---

## Core Domain Concepts

```
Organization (single-tenant)
├── Teams
│   ├── Manager(s) — multiple allowed
│   └── Members — can belong to multiple teams
├── Projects
│   ├── Owner (designated Admin or Manager)
│   ├── Assigned Members (from any team, cross-team)
│   └── Tasks (auto-created from time logs, scoped per project)
└── Time Logs
    ├── User
    ├── Task (JIRA ID or free-text label)
    ├── Project
    ├── Date
    └── Hours
```

**Key rules:**
- A user can belong to multiple teams and be assigned to multiple projects.
- Tasks are scoped per-project. The same JIRA ID in different projects are treated as separate tasks.
- Tasks are not pre-created. When a user logs time with a new task identifier (JIRA ID or text), the task is auto-created under that project.
- A task has an ID and a distinct label, used for display and reporting.
- Managers can view and edit time logs for members within their team(s).
- Members can only view and edit their own time logs.

---

## Feature Areas

### 1. Authentication & Authorization
SSO/OAuth login (Google, Microsoft). Role-based access control (Admin, Manager, Member).
→ _Detailed spec: `specs/auth.md`_

### 2. Team Management
Create teams, assign manager(s), add/remove members.
→ _Detailed spec: `specs/projects-and-teams.md`_

### 3. Project Management
Managers create projects, assign team members. Members see their assigned projects.
→ _Detailed spec: `specs/projects-and-teams.md`_

### 4. Time Logging
Manual entry: user selects date, project, task (JIRA ID or text), and hours. CSV import for bulk creation of time logs. Tasks auto-created on first use. Users edit/delete their own entries. Managers edit entries for their team.
→ _Detailed spec: `specs/time-logging.md`_

### 5. Task Management
Tasks are lightweight — just an ID and label. Created implicitly through time logging. Displayed in reports for grouping and breakdown.
→ _Detailed spec: `specs/tasks.md`_

### 6. Reporting & Dashboard
Manager dashboard with charts: time per user, time per project, weekly/monthly trends, utilization rates. Date range filters. Export to CSV and PDF.
→ _Detailed spec: `specs/reporting.md`_

### 7. Admin Panel
Org-level settings, user management, team setup.
→ _Detailed spec: `specs/admin.md`_

---

## Detailed Spec Files (to be created)

| File | Scope | Status |
|------|-------|--------|
| `specs/auth.md` | Authentication, authorization, roles | Done |
| `specs/projects-and-teams.md` | Teams, projects, member assignment | Done |
| `specs/time-logging.md` | Time entry, editing, validation | Done |
| `specs/tasks.md` | Task model, auto-creation, display | Done |
| `specs/reporting.md` | Charts, filters, exports | Done |
| `specs/admin.md` | Admin panel, org settings | Done |
| `specs/data-model.md` | Database schema, ERD | Done |
| `specs/api-design.md` | REST endpoints, DTOs | Done |
| `specs/infrastructure.md` | Docker, deployment, environments | Done |

---

## Future Enhancements (Post-MVP)

- **Audit log** — Track login events, role changes, permission modifications for compliance.
- **Additional SSO providers** — Microsoft OAuth, SAML for custom IdPs.
- **Timer-based time tracking** — Start/stop timer for real-time tracking.
- **Timesheet grid view** — Weekly grid (days as columns, tasks as rows).
- **Multi-tenancy** — Support multiple organizations in a single deployment.
- **Notifications** — Email/in-app notifications for pending approvals, report availability.
- **JIRA integration** — Auto-sync tasks from JIRA.

---

## Non-Functional Requirements

- **Single-tenant**: One deployment per organization.
- **Containerized**: All services run in Docker containers.
- **Responsive**: Frontend works on desktop and tablet.
- **Performance**: Reports should load within 2s for up to 1,000 users and 100k time log entries.
