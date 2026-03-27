# Reporting & Dashboard

## Overview
Managers and Admins access a reporting dashboard with charts and filters. Members see a personal summary. Reports support grouping by user, project, task, date, and team. Exportable to CSV and PDF.

---

## Dashboards

### Member Dashboard (Personal Summary)
A lightweight personal overview.

**Widgets:**
- **This week's hours**: Total hours logged this week (Mon–Sun) with daily bar chart.
- **This month's hours**: Total hours logged this calendar month.
- **Top projects**: Pie chart of hours distribution across projects (current month).
- **Recent activity**: Last 10 time log entries.

### Manager Dashboard
Comprehensive team/project reporting.

**Widgets:**
- **Team hours this week**: Stacked bar chart — hours per team member for the current week.
- **Hours by project**: Pie chart — hours distribution across projects (for managed teams).
- **Weekly/monthly trend**: Line chart — total hours over past 12 weeks or 6 months.
- **Utilization rate**: Bar chart — each team member's logged hours vs expected hours (configurable, default 40h/week).
- **Task breakdown**: Bar chart — top 10 tasks by hours within a selected project.

### Admin Dashboard
Same as Manager dashboard but with org-wide scope. All teams, all projects.

---

## Report Builder

A configurable report view for deeper analysis.

### Grouping Dimensions
Reports can be grouped and nested by:

| Dimension | Description |
|-----------|-------------|
| User | Individual team members |
| Project | Projects |
| Task | Tasks within projects |
| Date | Day, week, or month |
| Team | Teams |

**Nesting example**: Group by Project → then by User → shows hours per user per project.

### Filters

| Filter | Options |
|--------|---------|
| Date range | Preset (this week, this month, last month, custom) |
| Team | One or more teams |
| Project | One or more projects |
| User | One or more users |
| Task | One or more tasks |

### Metrics

| Metric | Description |
|--------|-------------|
| Total hours | Sum of logged hours |
| Entry count | Number of time log entries |
| Task count | Number of distinct tasks with logged time |
| Average hours/day | Total hours / number of days with entries |
| Utilization rate | Total hours / (expected hours per week * weeks in range) |

---

## Chart Types

| Chart | Use case |
|-------|----------|
| **Bar chart** | Comparisons: hours per user, per project, per task. Horizontal or vertical. |
| **Stacked bar** | Multi-dimensional comparisons: hours per user broken down by project. |
| **Pie / donut** | Distribution: proportion of hours across projects or teams. |
| **Line chart** | Trends over time: weekly/monthly hours, utilization trends. |

---

## Export

### CSV Export
- Exports the current report view as a CSV file.
- Includes all visible columns plus any applied filters as metadata rows at the top.
- Date format: `YYYY-MM-DD`.
- Available on Report Builder and Manager Dashboard.

### PDF Export
- Exports the current dashboard or report as a styled PDF.
- Includes charts as images + data table.
- Header: report title, date range, filters applied.
- Footer: generated timestamp, app name.

### Who Can Export

| Role | Can export |
|------|-----------|
| Admin | Yes (any scope) |
| Manager | Yes (own team scope) |
| Member | No |

---

## Report Access Scope

| Role | What they see |
|------|--------------|
| Admin | All teams, all projects, all users |
| Manager | Their team(s)' members, projects those members are in |
| Member | Own personal summary only |

- Managers cannot see time logs of users outside their team(s), even if those users are in the same project.
- Exception: If the Manager is also the Project Owner, they can see all project members' logs in reports for that project.

---

## Performance Considerations
- Reports should load within 2 seconds for datasets up to 100k time log entries.
- Use pre-aggregated data (materialized views or summary tables) for dashboard widgets.
- Report Builder queries are computed on-demand with reasonable pagination.
- Date range defaults to "this month" to limit query scope.

---

## Edge Cases
- **No data for selected filters**: Show empty state with "No time logs found for this period" message.
- **User with 0 hours in period**: Still appears in team reports with 0h (not hidden).
- **Archived projects in reports**: Archived projects' historical data is included in reports. Clearly labeled as archived.
- **Utilization rate config**: Expected hours per week is configurable at the org level (default 40h). Can be overridden per user for part-time employees (future enhancement).
