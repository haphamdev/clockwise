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
│ owner_id (FK→User)│
└──────────────────┘
        │
        ├────────────────────┐
        ▼                    ▼
┌──────────────────┐  ┌──────────────────┐
│ ProjectMember    │  │      Task        │
│──────────────────│  │──────────────────│
│ project_id (FK)  │  │ id               │
│ user_id (FK)     │  │ project_id (FK)  │
└──────────────────┘  │ label            │
                      │ created_by (FK)  │
                      └──────────────────┘
                               │
                               ▼
                      ┌──────────────────┐
                      │    TimeLog       │
                      │──────────────────│
                      │ id               │
                      │ user_id (FK)     │
                      │ project_id (FK)  │
                      │ task_id (FK)     │
                      │ date             │
                      │ hours (decimal)  │
                      │ notes            │
                      │ is_deleted       │
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
| owner_id | UUID | FK → user, NOT NULL | Designated project owner |
| created_at | TIMESTAMP | NOT NULL | |
| updated_at | TIMESTAMP | NOT NULL | |

### project_member
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| project_id | UUID | FK → project | |
| user_id | UUID | FK → user | |
| created_at | TIMESTAMP | NOT NULL | |

**Unique**: (project_id, user_id)

### task
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| project_id | UUID | FK → project | |
| label | VARCHAR(100) | NOT NULL | JIRA ID or free text |
| label_normalized | VARCHAR(100) | NOT NULL | Lowercase for uniqueness check |
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
| task_id | UUID | FK → task, NOT NULL | |
| date | DATE | NOT NULL | |
| hours | DECIMAL(5,2) | NOT NULL, CHECK > 0 | |
| notes | TEXT | | |
| is_deleted | BOOLEAN | NOT NULL, DEFAULT false | Soft delete |
| created_at | TIMESTAMP | NOT NULL | |
| updated_at | TIMESTAMP | NOT NULL | |

**Index**: (user_id, date), (project_id, date), (task_id)

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

---

## Key Indexes
- `time_log(user_id, date)` — user's time log queries
- `time_log(project_id, date)` — project report queries
- `time_log(task_id)` — task-level aggregations
- `time_log(is_deleted)` — filter deleted entries (partial index WHERE is_deleted = false)
- `task(project_id, label_normalized)` — task lookup/uniqueness
- `user(email)` — login lookups
- `invitation(token)` — invitation acceptance
