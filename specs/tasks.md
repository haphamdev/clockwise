# Tasks

## Overview
Tasks are lightweight entities that represent work items. They are **not pre-created** — they are auto-created when a user logs time with a new task identifier. Tasks are scoped per project.

---

## Task Model

| Field | Type | Description |
|-------|------|-------------|
| ID | auto-generated | Internal unique identifier |
| Label | string | The user-provided identifier (JIRA ID like `JIRA-123`, or free text like `Code review`) |
| Project | reference | The project this task belongs to |
| Created by | reference | The user who first logged time against this task |
| Created at | timestamp | When the task was auto-created |

---

## Behavior

### Auto-Creation
- When a user enters a task label that doesn't exist in the selected project, a new task is created automatically on time log save.
- The task label is matched **case-insensitively** within the project. `jira-123` and `JIRA-123` are the same task.
- Labels are stored in the casing of the first entry. Can be edited later.

### Autocomplete
- When typing in the task field, the system suggests existing tasks in the selected project.
- Suggestions are ordered by most recently used (by the current user first, then by others).
- If no match, the entered text becomes a new task on save.

### Uniqueness
- Task labels must be unique **within a project**.
- The same label can exist in different projects as separate tasks.

---

## Task Management

### Who Can Edit Tasks

| Action | Who |
|--------|-----|
| Rename task label | Admin, Project Owner |
| Merge tasks (combine two tasks into one) | Admin, Project Owner |

### Rename
- Changing a task's label updates it across all existing time logs that reference it.
- New label must not conflict with an existing task in the same project.

### Merge
- Select a source task and a target task within the same project.
- All time logs from the source task are moved to the target task.
- Source task is deleted.
- Useful when users accidentally create duplicate tasks (e.g. `JIRA-123` and `Jira 123`).

---

## Reporting
- Tasks appear in reports as grouping/breakdown dimensions.
- Reports can show: hours per task, task count per project, task activity over time.
- A task with zero total hours (all logs deleted) is hidden from reports but not deleted.

---

## Edge Cases
- **Empty task label**: Blocked by validation (required field, min 1 character).
- **Very long task labels**: Max 100 characters.
- **Task used across projects**: Not possible. Tasks are project-scoped. Same label = different tasks.
- **All time logs deleted from a task**: Task still exists but hidden in reports. Can be reused if new time is logged.
