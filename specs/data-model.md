# Data Model

## Overview
PostgreSQL database schema for Clockwise. All entities use UUID primary keys and include `created_at` / `updated_at` timestamps.

---

## Entity Relationship Diagram

```
┌──────────────────┐
│   Organization   │
│──────────────────│
│ id               │
│ name             │
│ settings (JSON)  │
└──────────────────┘
        │
        ├──────────────────────────────────┐
        ▼                                  ▼
┌──────────────────┐              ┌──────────────────┐
│      User        │              │      Team        │
│──────────────────│              │──────────────────│
│ id               │              │ id               │
│ email            │              │ name             │
│ name             │              │ description      │
│ avatar_url       │              │ is_archived      │
│ is_admin         │              └──────────────────┘
│ status           │                       │
└──────────────────┘                       │
        │                                  │
        └──────────┐  ┌───────────────────┘
                   ▼  ▼
          ┌──────────────────┐
          │   TeamMember     │
          │──────────────────│
          │ user_id (FK)     │
          │ team_id (FK)     │
          │ role (enum)      │  ← manager | member
          └──────────────────┘

┌──────────────────┐
│     Project      │
│──────────────────│
│ id               │
│ name             │
│ description      │
│ status (enum)    │  ← active | archived
│ settings (JSON)  │
└──────────────────┘
        │
        ├────────────────────┐
        ▼                    ▼
┌──────────────────┐  ┌──────────────────┐
│  ProjectTeam     │  │      Task        │
│──────────────────│  │──────────────────│
│ project_id (FK)  │  │ id               │
│ team_id (FK)     │  │ project_id (FK)  │
└──────────────────┘  │ label            │
                      │ description      │
                      │ created_by (FK)  │
                      └──────────────────┘
                               │
                     ┌─────────┴──────────┐
                     ▼                    ▼
            ┌──────────────────┐ ┌──────────────────┐
            │  TimeLogTask     │ │    TimeLog       │
            │──────────────────│ │──────────────────│
            │ time_log_id (FK) │ │ id               │
            │ task_id (FK)     │ │ user_id (FK)     │
            └──────────────────┘ │ project_id (FK)  │
                                 │ date             │
                                 │ hours (decimal)  │
                                 │ notes            │
                                 │ status (enum)    │
                                 └──────────────────┘

┌──────────────────┐
│   Invitation     │
│──────────────────│
│ id               │
│ email            │
│ invited_by (FK)  │
│ token            │
│ expires_at       │
│ status (enum)    │  ← pending | accepted | revoked
└──────────────────┘

┌──────────────────┐
│    AuditLog      │
│──────────────────│
│ id               │
│ org_id (FK)      │
│ entity_type      │
│ entity_id        │
│ action           │
│ performed_by     │
│ metadata (JSON)  │
└──────────────────┘
```

---

## Tables

### organization
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| name | VARCHAR(255) | NOT NULL | |
| settings | JSONB | NOT NULL, DEFAULT '{}' | Org settings (expected_hours_week, warning thresholds, date_format, csv_max_rows) |
| created_at | TIMESTAMP | NOT NULL | |
| updated_at | TIMESTAMP | NOT NULL | |

### user
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| org_id | UUID | FK → organization | |
| email | VARCHAR(255) | UNIQUE, NOT NULL | SSO email |
| name | VARCHAR(255) | NOT NULL | Display name (from SSO profile) |
| avatar_url | VARCHAR(512) | | Profile picture URL |
| is_admin | BOOLEAN | NOT NULL, DEFAULT false | |
| status | ENUM | NOT NULL, DEFAULT 'pending' | pending, active, deactivated |
| last_login_at | TIMESTAMP | | |
| created_at | TIMESTAMP | NOT NULL | |
| updated_at | TIMESTAMP | NOT NULL | |

### team
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| org_id | UUID | FK → organization | |
| name | VARCHAR(255) | NOT NULL | |
| description | TEXT | | |
| is_archived | BOOLEAN | NOT NULL, DEFAULT false | |
| created_at | TIMESTAMP | NOT NULL | |
| updated_at | TIMESTAMP | NOT NULL | |

**Unique**: (org_id, name)

### team_member
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| team_id | UUID | FK → team | |
| user_id | UUID | FK → user | |
| role | ENUM | NOT NULL | manager, member |
| created_at | TIMESTAMP | NOT NULL | |

**Unique**: (team_id, user_id)

### project
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| org_id | UUID | FK → organization | |
| name | VARCHAR(255) | NOT NULL | |
| description | TEXT | | |
| status | ENUM | NOT NULL, DEFAULT 'active' | active, archived |
| settings | JSONB | NOT NULL, DEFAULT '{}' | Project settings (dailyHourLimit, weeklyHourLimit) |
| created_at | TIMESTAMP | NOT NULL | |
| updated_at | TIMESTAMP | NOT NULL | |

**Partial unique**: (org_id, name) WHERE status = 'active'

### project_team
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| project_id | UUID | FK → project | |
| team_id | UUID | FK → team | |
| created_at | TIMESTAMP | NOT NULL | |

**Unique**: (project_id, team_id)

### task
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| project_id | UUID | FK → project | |
| label | VARCHAR(100) | NOT NULL | JIRA ID or free text |
| label_normalized | VARCHAR(100) | NOT NULL | Lowercase for uniqueness check |
| description | TEXT | | Optional task description |
| created_by | UUID | FK → user | User who first logged time |
| created_at | TIMESTAMP | NOT NULL | |
| updated_at | TIMESTAMP | NOT NULL | |

**Unique**: (project_id, label_normalized)

### time_log
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| user_id | UUID | FK → user, NOT NULL | |
| project_id | UUID | FK → project, NOT NULL | |
| date | DATE | NOT NULL | |
| hours | DECIMAL(5,2) | NOT NULL, CHECK > 0 | |
| notes | TEXT | | |
| status | ENUM | NOT NULL, DEFAULT 'active' | active, archived |
| created_at | TIMESTAMP | NOT NULL | |
| updated_at | TIMESTAMP | NOT NULL | |

**Index**: (user_id, date, status), (project_id, date, status)

### time_log_task
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| time_log_id | UUID | FK → time_log, NOT NULL | |
| task_id | UUID | FK → task, NOT NULL | |
| created_at | TIMESTAMP | NOT NULL | |

**Unique**: (time_log_id, task_id)

### invitation
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| org_id | UUID | FK → organization | |
| email | VARCHAR(255) | NOT NULL | |
| invited_by | UUID | FK → user | |
| token | VARCHAR(255) | UNIQUE, NOT NULL | Secure random token |
| expires_at | TIMESTAMP | NOT NULL | |
| status | ENUM | NOT NULL, DEFAULT 'pending' | pending, accepted, revoked |
| created_at | TIMESTAMP | NOT NULL | |

### invitation_team_assignment
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| invitation_id | UUID | FK → invitation, ON DELETE CASCADE | |
| team_id | UUID | FK → team | |
| role | ENUM | NOT NULL | manager, member |

**Unique**: (invitation_id, team_id)

### audit_log
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| org_id | UUID | FK → organization | |
| entity_type | VARCHAR(50) | NOT NULL | e.g. team, project, user, time_log |
| entity_id | UUID | NOT NULL | ID of the entity that was changed |
| action | VARCHAR(50) | NOT NULL | e.g. created, updated, archived, unarchived |
| performed_by | UUID | NOT NULL | User who performed the action |
| metadata | JSONB | NOT NULL, DEFAULT '{}' | Before/after snapshots and extra context |
| reason | TEXT | | Optional reason for the change (required for time log mutations) |
| created_at | TIMESTAMP | NOT NULL | |

**Index**: (entity_type, entity_id), (org_id, created_at), (performed_by)

---

## Key Indexes
- `time_log(user_id, date, status)` — user's time log queries with status filtering
- `time_log(project_id, date, status)` — project report queries with status filtering
- `time_log_task(time_log_id, task_id)` — unique constraint on join table
- `task(project_id, label_normalized)` — task lookup/uniqueness
- `user(email)` — login lookups
- `invitation(token)` — invitation acceptance
- `audit_log(entity_type, entity_id)` — entity history queries
- `audit_log(org_id, created_at)` — chronological queries
- `audit_log(performed_by)` — user activity queries
