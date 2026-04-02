# Time Logging

## Overview
Time logging is the core user action. Users manually enter hours for a date, project, and one or more tasks. Tasks are auto-created on first use. Each time log can reference multiple tasks as labels/tags — hours are attributed to the log entry, not split per task. Bulk import via CSV is supported through a generic import framework.

---

## Time Log Entry

### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| Date | date | Yes | The date the work was performed |
| Project | reference | Yes | Select from user's assigned projects |
| Tasks | string[] | Yes | One or more JIRA IDs or free-text labels. Auto-creates tasks if new within the project |
| Hours | decimal | Yes | Decimal hours in 0.25 increments (e.g. 0.25, 1.5, 8). Must be positive, maximum 24. Total for the entry, not split per task |
| Notes | string | No | Optional description of work done |

### Data Model

- **TimeLog** stores `userId`, `projectId`, `date`, `hours`, `notes`, `status` (active/archived)
- **TimeLogTask** join table links a time log to one or more tasks (many-to-many)
- Tasks are labels/tags on a log entry — no per-task hour attribution

### Entry Form UI (Side Sheet)
1. User clicks "Log Time" button (available on time logs page and project detail page).
2. Side sheet opens with form:
   - Date picker (defaults to today)
   - Project combobox (pre-selected if opened from project detail page, or from user's default project preference)
   - Task autocomplete — multi-select, suggests existing tasks, allows free-text for new tasks. Disabled until project is selected. Typing text and blurring the input auto-adds the text as a tag. Changing the project clears selected tasks (tasks are scoped per project).
   - Hours input (0.25 increments, text input with `inputMode="decimal"` to avoid browser locale issues with decimal separators)
   - Notes textarea
3. User clicks "Log Time" to save.
4. On success: toast notification + optional warning alerts + "Log Another" button (resets form, keeps date and project).

### Validation Rules
- Date: any past or current date (no future dates).
- Project: must be an active project the user is assigned to (via team membership).
- Tasks: at least one task label, each non-empty string, max 100 characters.
- Hours: positive decimal in 0.25 increments (0.25–24) per entry.
- **Soft warnings**: Shown in two places:
  1. **Before submit (preview)**: As the user fills in date, project, and hours, a `GET /time-logs/warnings` endpoint is queried to show current daily/weekly totals vs thresholds. Message format: "Already logged Xh today + Yh = Zh (threshold: Wh)".
  2. **After submit (response)**: Warnings are returned in the create/update response. UI shows dismissible yellow alert.

### Warning Thresholds

Effective limit resolution: **project-specific setting → org default**

| Level | Setting | Default |
|-------|---------|---------|
| Org | `dailyWarningThreshold` | 12h |
| Org | `weeklyWarningThreshold` | 60h |
| Project | `settings.dailyHourLimit` | null (use org) |
| Project | `settings.weeklyHourLimit` | null (use org) |

---

## Editing & Archiving

### Who Can Edit/Archive

| Actor | Scope |
|-------|-------|
| Log owner | Their own logs |
| Manager of the user's team | Logs of their team members |
| Admin | Any log |

### Edit Rules
- All fields are editable (date, project, tasks, hours, notes).
- **Reason is required** — stored in the audit log's dedicated `reason` column.
- Changing the project re-validates that the user is assigned to the new project.
- Changing tasks to new identifiers auto-creates them in the target project.
- Edits are saved immediately (no approval workflow).
- Warnings are re-computed and returned in the response.

### Archive Rules
- Time logs are **archived, not deleted**. Status changes from `active` to `archived`.
- Archived logs are excluded from reports but visible in history.
- **Reason is required** — stored in the audit log.
- **Un-archive is supported** with the same permission model. Reason required.
- No permanent deletion — all records preserved for audit integrity.

### Audit Trail
- Every mutation (create, update, archive, unarchive) produces an audit log entry.
- Updates include before/after field diffs in metadata.
- The `reason` field on `audit_log` stores the user-provided reason.
- The time log detail sheet shows the full audit trail.

---

## CSV Import

### Purpose
Bulk creation of time log entries via a generic import framework. Useful for importing historical data or batch-logging.

### Architecture
- **Generic import framework**: `ImportProcessor` interface, reusable for future import types
- **Queue**: BullMQ + Redis for async job processing
- **Flow**: Sync preview (parse + validate) → user confirms → async insert (queued job)

### CSV Format
```
date,project_name,task,hours,notes,user_email
2026-03-25,Project Alpha,JIRA-123,2.5,Implemented login flow,
2026-03-25,Project Alpha,JIRA-124,1.0,,
2026-03-26,Project Beta,Code review,3.0,Reviewed PRs #45-#48,member@example.com
```

### Fields

| Column | Required | Format | Notes |
|--------|----------|--------|-------|
| date | Yes | `YYYY-MM-DD` | No future dates |
| project_name | Yes | Project name (exact match) | Must be active + accessible |
| task | Yes | JIRA ID or text | Auto-creates if new |
| hours | Yes | Decimal (0.01–24) | |
| notes | No | Free text | |
| user_email | No | Email | Manager/admin only — import on behalf of another user |

### Import Flow
1. User clicks "Import CSV" on the time logging page.
2. Dialog opens with file upload zone + "Download Template" link.
3. User uploads a `.csv` file.
4. System parses and validates all rows synchronously (POST /import/preview).
5. Dialog shows preview: valid rows (green), invalid rows (red with error reasons).
6. User clicks "Import X valid rows" to confirm.
7. System queues the import job (POST /import/execute, returns job ID).
8. Dialog shows progress, polling job status every 2 seconds.
9. On completion: summary (X imported, Y errors), "Done" button.
10. Done: invalidate time logs query, close dialog.

### Import Validation
- All entry validation rules apply per row.
- Project name must match an active project the user is assigned to.
- Duplicate detection: warn if an entry with the same date + project + task + hours already exists.
- Maximum file size: 1 MB.
- Maximum rows per import: 500 (configurable via org settings `csvMaxRows`).

### Import Permissions
- Users can import time logs for themselves only.
- Managers can import on behalf of team members (via `user_email` column).
- Admins can import for any user.

### Template Download
- `GET /import/template/time-log` generates a CSV template.
- Template includes header row and optionally example rows based on user's accessible projects.

---

## Time Log List View

### Layout
Single page at `/time-logs` for all roles. Managers/admins see additional filters.

```
PageHeader: "Time Logs" + [Log Time] + [Import CSV]
FilterBar: [Date range] [Project] [User (mgr/admin)] [Team (mgr/admin)] [Show archived ☐]
Summary: "Total: XX.XX hours"
Table: Date | Project | Tasks | Hours | Notes | User* | Actions
```

### Default View
- Default time window: last 4 weeks.
- Paginated table with ServerDataTable pattern.
- Summary row with total hours for the filtered period.

### Filters
- Date range (dateFrom, dateTo) — stored in URL query params
- Project dropdown
- User dropdown (manager/admin only)
- Team dropdown (manager/admin only)
- "Show archived" checkbox — includes archived time logs in the list (default: unchecked, only active logs shown)

### Scoping
- Member: sees only their own logs (active by default, archived when "Show archived" is checked)
- Manager: sees logs of members in their managed teams
- Admin: sees all logs

### Detail Sheet
Clicking a row opens a side sheet showing:
- All log fields (read-only)
- Task list with descriptions (if available)
- Full audit trail (created, updated, archived, unarchived — with actor, timestamp, before/after diffs, reason)

---

## Edge Cases
- **Logging time on an archived project**: Blocked. Validation error.
- **Logging time on a task from a different project**: Blocked. Tasks are scoped per project.
- **CSV with unknown project**: Row marked as invalid with "Project not found or not assigned" error.
- **Concurrent edits**: Last-write-wins. No locking mechanism.
- **Decimal precision**: Store with 2 decimal places (DECIMAL(5,2)). Round on display to 2 places.
- **Multi-task log and reporting**: Tasks are labels/tags. No per-task hour reporting. Reports aggregate at the time log level (by user, project, date).
