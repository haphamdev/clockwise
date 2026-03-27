# Time Logging

## Overview
Time logging is the core user action. Users manually enter hours for a date, project, and task. Tasks are auto-created on first use. Bulk import via CSV is supported.

---

## Time Log Entry

### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| Date | date | Yes | The date the work was performed |
| Project | reference | Yes | Select from user's assigned projects |
| Task | string | Yes | JIRA ID or free-text label. Auto-creates a task if new within the project |
| Hours | decimal | Yes | Decimal hours (e.g. 1.5). Minimum: 0.01. Maximum: 24 |
| Notes | string | No | Optional description of work done |

### Entry Form UI
1. User selects a date (defaults to today).
2. User selects a project from a dropdown of their assigned active projects.
3. User types a task identifier — autocomplete suggests existing tasks in the selected project.
4. If the task doesn't exist, it will be created automatically on save.
5. User enters hours as a decimal.
6. User optionally adds notes.
7. User clicks Save.

### Validation Rules
- Date: any past or current date (no future dates).
- Project: must be an active project the user is assigned to.
- Task: non-empty string, max 100 characters.
- Hours: positive decimal, max 24 per entry.
- **Soft warning**: If the user's total for the day exceeds 12h, or weekly total exceeds 60h, show a warning but allow submission.

---

## Editing & Deleting

### Who Can Edit

| Actor | Can edit |
|-------|---------|
| The user who created the log | Their own logs |
| Manager of the user's team | Logs of their team members |
| Project owner | Logs within their project |
| Admin | Any log |

### Edit Rules
- All fields are editable (date, project, task, hours, notes).
- Changing the project re-validates that the user is assigned to the new project.
- Changing the task to a new identifier auto-creates it in the target project.
- Edits are saved immediately (no approval workflow in MVP).

### Delete Rules
- Same permission model as editing.
- Deletion is a soft-delete (marked as deleted, excluded from reports, can be restored by Admin).

---

## CSV Import

### Purpose
Bulk creation of time log entries. Useful for importing historical data or batch-logging.

### CSV Format
```
date,project,task,hours,notes
2026-03-25,Project Alpha,JIRA-123,2.5,Implemented login flow
2026-03-25,Project Alpha,JIRA-124,1.0,
2026-03-26,Project Beta,Code review,3.0,Reviewed PRs #45-#48
```

### Fields

| Column | Required | Format | Notes |
|--------|----------|--------|-------|
| date | Yes | `YYYY-MM-DD` | |
| project | Yes | Project name (exact match) | |
| task | Yes | JIRA ID or text | Auto-creates if new |
| hours | Yes | Decimal | |
| notes | No | Free text | |

### Import Flow
1. User clicks "Import CSV" on the time logging page.
2. User uploads a `.csv` file.
3. System parses and validates all rows.
4. System shows a preview: valid rows, invalid rows with error reasons.
5. User reviews and confirms import of valid rows.
6. Invalid rows can be corrected in the CSV and re-uploaded.

### Import Validation
- All entry validation rules apply per row.
- Project name must match an active project the user is assigned to.
- Duplicate detection: warn if an entry with the same date + project + task + hours already exists.
- Maximum file size: 1 MB.
- Maximum rows per import: 500.

### Import Permissions
- Users can import time logs for themselves only.
- Managers can import time logs on behalf of their team members (requires an additional `user_email` column).
- Admin can import for any user.

---

## Time Log List View

### My Time Logs (All Users)
- Default view: current week.
- Table columns: Date, Project, Task, Hours, Notes, Actions (Edit, Delete).
- Filters: date range, project, task.
- Sort by: date (default desc), project, hours.
- Summary row: total hours for the filtered period.

### Team Time Logs (Manager)
- Same as above but shows all team members' logs.
- Additional column: User name.
- Additional filter: team member.

---

## Edge Cases
- **Logging time on an archived project**: Blocked. User sees "This project is archived" message.
- **Logging time on a task from a different project**: Blocked. Tasks are scoped per project.
- **CSV with unknown project**: Row marked as invalid with "Project not found or not assigned" error.
- **Concurrent edits**: Last-write-wins. No locking mechanism in MVP.
- **Decimal precision**: Store with 2 decimal places. Round on display to 2 places.
