# Reports Feature — Implementation Plan

## Context

Users need reports to analyze time log data. The `/reports` page (route already exists as placeholder) will have three vertically-scrollable sections: **Personal Insight**, **Team Insight**, **Project Insight**. Each section has KPI cards, time-series column charts with running average overlays, weekday distribution heatmaps, and logging behavior charts.

## Design Decisions

- **Chart library:** Recharts (via shadcn chart primitives). Heatmaps as custom CSS grids.
- **Backend:** 4 endpoints (time-series, weekday-distribution, logging-delay, summary). Raw SQL via `$queryRaw` for `date_trunc` aggregations (first raw SQL in the codebase — Prisma's `groupBy` can't do date truncation).
- **Filters:** TimeWindowPicker + Team/User/Project multi-select comboboxes. Role-scoped visibility.
- **Phased:** 6 phases, verify each before proceeding.

## Access Control

| Role    | Team filter                              | User filter                  | Project filter                 | Sections visible |
| ------- | ---------------------------------------- | ---------------------------- | ------------------------------ | ---------------- |
| Admin   | All teams                                | All users (scoped to teams)  | All projects (scoped to teams) | All 3            |
| Manager | Teams they belong to (member or manager) | Self + managed team members  | Scoped to selected teams       | All 3            |
| Member  | Teams they belong to                     | Auto-scoped to self (hidden) | Scoped to their teams          | Personal only    |

Default state: no team/project selected, current user pre-selected in user filter.

## Backend Endpoints

### `GET /reports/time-series`

Params: `dateFrom`, `dateTo`, `granularity` (day|week|month|quarter), `groupBy` (user|project|team), `stackBy?` (user|project|team), `teamIds?`, `userIds?`, `projectIds?`

```json
{
  "buckets": [
    {
      "periodStart": "2026-03-30",
      "periodEnd": "2026-04-05",
      "series": [
        {
          "id": "user-1",
          "label": "John",
          "value": 40,
          "breakdown": [{ "id": "proj-1", "label": "Project A", "value": 25 }]
        }
      ]
    }
  ],
  "summary": { "totalHours": 150, "entries": 45 }
}
```

**How each chart maps to this endpoint:**

| Section  | Chart            | groupBy | stackBy |
| -------- | ---------------- | ------- | ------- |
| Personal | Hours by project | project | —       |
| Team     | User Comparison  | user    | project |
| Team     | Project Effort   | project | —       |
| Project  | Team Comparison  | team    | —       |
| Project  | User Comparison  | user    | —       |

### `GET /reports/weekday-distribution`

Params: `dateFrom`, `dateTo`, `groupBy` (user|project|team), `teamIds?`, `userIds?`, `projectIds?`

```json
{
  "rows": [
    {
      "id": "proj-1",
      "label": "Project A",
      "weekdays": [8, 7.5, 6, 8, 7, 2, 0]
    }
  ],
  "totals": [45, 42, 38, 44, 40, 12, 2]
}
```

Weekdays: index 0=Mon, 6=Sun (remapped from PostgreSQL's DOW where 0=Sunday).

### `GET /reports/logging-delay`

Params: `dateFrom`, `dateTo`, `teamIds?`, `userIds?`, `projectIds?`

```json
{
  "buckets": [
    { "label": "Same day", "maxDays": 0, "count": 45, "percentage": 60 },
    { "label": "1-2 days", "maxDays": 2, "count": 20, "percentage": 26.7 },
    { "label": "3-5 days", "maxDays": 5, "count": 8, "percentage": 10.7 },
    { "label": "6+ days", "maxDays": null, "count": 2, "percentage": 2.7 }
  ]
}
```

### `GET /reports/summary`

Params: `dateFrom`, `dateTo`, `teamIds?`, `userIds?`, `projectIds?`

Returns: `{ totalHours, avgHoursPerDay, uniqueProjects, uniqueUsers, uniqueTeams, totalEntries }`

## SQL Strategy

Column names map camelCase→snake_case. Table `"user"` must be quoted (PostgreSQL reserved word). `groupBy`/`stackBy` column references use a validated lookup (not user input interpolation):

```typescript
const GROUP_COLUMNS: Record<ReportGroupBy, { id: string; label: string }> = {
  user: { id: "tl.user_id", label: "u.name" },
  project: { id: "tl.project_id", label: "p.name" },
  team: { id: "t.id", label: "t.name" },
};
```

Date/ID values are parameterized via `Prisma.sql`. `SUM(tl.hours)::float` converts Decimal to float.

## Smart Default Granularity

| Time window | Default   |
| ----------- | --------- |
| ≤ 2 weeks   | Daily     |
| ≤ 3 months  | Weekly    |
| ≤ 1 year    | Monthly   |
| > 1 year    | Quarterly |

---

## Phase 1: Backend Endpoints + Frontend Infrastructure

### Backend — New files

| File                                                      | Purpose                                                                                                                                                                  | ~Lines |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------ |
| `backend/src/modules/reports/dto/reports-query.dto.ts`    | `ReportBaseQueryDto` (dateFrom, dateTo, teamIds?, userIds?, projectIds?), `TimeSeriesQueryDto`, `WeekdayDistributionQueryDto`, `LoggingDelayQueryDto`, `SummaryQueryDto` | 90     |
| `backend/src/modules/reports/dto/reports-response.dto.ts` | Response DTOs for Swagger: `TimeSeriesResponseDto`, `WeekdayDistributionResponseDto`, etc.                                                                               | 80     |
| `backend/src/modules/reports/reports.repository.ts`       | Raw SQL queries (`$queryRaw`) for time-series, weekday, delay aggregations. Prisma queries for summary. Builds WHERE clauses from filter params.                         | 250    |
| `backend/src/modules/reports/reports.service.ts`          | Role-based scoping (reuse `findManagedUserIds` pattern from `time-logs.service.ts`). Transforms raw rows → response shapes. Computes period end dates.                   | 180    |
| `backend/src/modules/reports/reports.controller.ts`       | 4 GET endpoints, all `@Auth()`. Thin delegation to service.                                                                                                              | 80     |
| `backend/src/modules/reports/reports.module.ts`           | Wire controller + service + repository                                                                                                                                   | 15     |
| `backend/src/common/exceptions/report.exceptions.ts`      | `ReportInvalidDateRangeException`                                                                                                                                        | 15     |

### Backend — Modify

| File                                           | Change                          |
| ---------------------------------------------- | ------------------------------- |
| `backend/src/app.module.ts`                    | Add `ReportsModule` to imports  |
| `backend/src/common/exceptions/error-codes.ts` | Add `REPORT_INVALID_DATE_RANGE` |

### Backend — Tests (TDD: write first)

| File                         | Tests                                                                                    |
| ---------------------------- | ---------------------------------------------------------------------------------------- |
| `reports.service.spec.ts`    | Scope resolution (admin/manager/member), response transformation, period end calculation |
| `reports.controller.spec.ts` | Endpoint param delegation, response structure                                            |

### Frontend — New files

| File                                                     | Purpose                                                                                                                                                                      | ~Lines |
| -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| `frontend/src/lib/reports/types.ts`                      | TS interfaces matching all response shapes + param types                                                                                                                     | 80     |
| `frontend/src/lib/reports/reports-api.ts`                | `fetchTimeSeries()`, `fetchWeekdayDistribution()`, `fetchLoggingDelay()`, `fetchReportSummary()`                                                                             | 60     |
| `frontend/src/lib/reports/reports-keys.ts`               | Query key factory                                                                                                                                                            | 20     |
| `frontend/src/lib/reports/use-time-series.ts`            | `useTimeSeries(params)` hook                                                                                                                                                 | 12     |
| `frontend/src/lib/reports/use-weekday-distribution.ts`   | `useWeekdayDistribution(params)` hook                                                                                                                                        | 12     |
| `frontend/src/lib/reports/use-logging-delay.ts`          | `useLoggingDelay(params)` hook                                                                                                                                               | 12     |
| `frontend/src/lib/reports/use-report-summary.ts`         | `useReportSummary(params)` hook                                                                                                                                              | 12     |
| `frontend/src/lib/reports/granularity-utils.ts`          | `autoGranularity(dateFrom, dateTo)` pure function                                                                                                                            | 25     |
| `frontend/src/pages/reports-page.tsx`                    | Page shell: PageHeader + ReportsFilterBar + section placeholders. URL-based filter state via `usePaginationParams`.                                                          | 80     |
| `frontend/src/components/reports/reports-filter-bar.tsx` | TimeWindowPicker + Combobox filters. Role-based visibility (member: no user filter, manager: scoped users, admin: all). Cascading: team selection scopes users and projects. | 100    |

### Frontend — Modify

| File                   | Change                                       |
| ---------------------- | -------------------------------------------- |
| `frontend/src/App.tsx` | Replace `PlaceholderPage` with `ReportsPage` |

### Frontend — Install

```bash
pnpm add recharts
```

### Bruno collection

4 `.bru` files in `bruno/clockwise/reports/`: get-time-series, get-weekday-distribution, get-logging-delay, get-summary.

### Verify Phase 1

1. All 4 endpoints return correct JSON via Bruno (test with admin user)
2. Reports page loads at `/reports` with working filter bar
3. Filter selections persist in URL params
4. Member sees no user filter, manager sees team-scoped users, admin sees all
5. Section placeholders show "Coming soon"
6. `pnpm build` passes (both frontend and backend)

---

## Phase 2: Personal Insight Section

### New files

| File                                        | Purpose                                                                                                                                                                                                                           | ~Lines |
| ------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| `components/reports/summary-cards.tsx`      | Reusable KPI card row. Props: `cards: { label, value, unit? }[]`. Uses shadcn `Card`. Grid layout `grid-cols-2 md:grid-cols-4`.                                                                                                   | 60     |
| `components/reports/granularity-picker.tsx` | D/W/M/Q segmented control. Uses shadcn `Tabs` as toggle buttons.                                                                                                                                                                  | 40     |
| `components/reports/chart-mode-toggle.tsx`  | Stacked vs grouped toggle. Simple button group.                                                                                                                                                                                   | 30     |
| `components/reports/time-series-chart.tsx`  | Recharts `ComposedChart`: `Bar` per series + `Line` for running average. Supports stacked (via `stackId`) and grouped modes. Color palette via CSS vars `--chart-1` through `--chart-10`. X-axis labels formatted by granularity. | 120    |
| `components/reports/personal-insight.tsx`   | Calls `useReportSummary` + `useTimeSeries(groupBy:'project')`. Renders SummaryCards (total hours, avg/day, projects count) + GranularityPicker + ChartModeToggle + TimeSeriesChart.                                               | 90     |

### Modify

| File                     | Change                                                        |
| ------------------------ | ------------------------------------------------------------- |
| `pages/reports-page.tsx` | Import + render `PersonalInsight`, pass filter state + userId |
| `frontend/src/index.css` | Add `--chart-1` through `--chart-10` CSS custom properties    |

### Running average

Computed client-side in `useMemo`: simple moving average over the last N buckets (N=3 default). One line per series entity overlaid on the bar chart.

### Verify Phase 2

1. Member sees Personal Insight with their own data
2. KPI cards show correct totals matching time-logs page
3. Column chart shows hours by project, correct granularity
4. Stacked/grouped toggle works
5. Running average line tracks trend
6. Granularity picker changes resolution; auto-default is sensible

---

## Phase 3: Team Insight Section

### New files

| File                                  | Purpose                                                                                                                          | ~Lines |
| ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ------ |
| `components/reports/team-insight.tsx` | Only visible if user is admin or manager. Two sub-charts + KPIs. Calls `useTimeSeries` twice (user comparison + project effort). | 100    |

### Charts

**Chart 1 — User Comparison**: `useTimeSeries({ groupBy: 'user', stackBy: 'project', ...filters })`. X-axis = time periods. Each period: bars side-by-side per user, projects stacked within each user's bar.

**Chart 2 — Team Effort by Project**: `useTimeSeries({ groupBy: 'project', ...filters })`. X-axis = time periods. Each period: bars per project showing total team hours.

**KPIs**: Total team hours, avg hours/member, active members count (from `useReportSummary`).

### Modify

| File                     | Change                                                           |
| ------------------------ | ---------------------------------------------------------------- |
| `pages/reports-page.tsx` | Import + conditionally render `TeamInsight` (admin/manager only) |

### Verify Phase 3

1. Manager selects their team — sees both charts populate
2. User Comparison shows team members with project breakdown
3. Project Effort shows aggregate hours per project
4. Member does NOT see Team Insight section
5. Admin sees Team Insight for any team

---

## Phase 4: Project Insight Section

### New files

| File                                     | Purpose                                               | ~Lines |
| ---------------------------------------- | ----------------------------------------------------- | ------ |
| `components/reports/project-insight.tsx` | Only visible to admin/manager. Two sub-charts + KPIs. | 90     |

### Charts

**Chart 1 — Team Comparison**: `useTimeSeries({ groupBy: 'team', projectIds: [selected] })`. Bars per team.

**Chart 2 — User Comparison**: `useTimeSeries({ groupBy: 'user', projectIds: [selected] })`. Bars per user.

**KPIs**: Total hours, contributors count, teams count.

### Modify

| File                     | Change                                         |
| ------------------------ | ---------------------------------------------- |
| `pages/reports-page.tsx` | Import + conditionally render `ProjectInsight` |

### Verify Phase 4

1. Select a project — charts show team and user comparisons
2. KPIs reflect selected project
3. Only visible to managers/admins

---

## Phase 5: Weekday Distribution Heatmaps

### New files

| File                                     | Purpose                                                                                                                              | ~Lines |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ------ |
| `components/reports/weekday-heatmap.tsx` | CSS grid: 8 cols (label + Mon-Sun), N rows. Cell color = intensity via oklch lightness scale. Tooltip on hover. Normalized % toggle. | 120    |
| `components/reports/heatmap-legend.tsx`  | Gradient bar legend (0h → max).                                                                                                      | 30     |

### Modify

| File                   | Change                                                                |
| ---------------------- | --------------------------------------------------------------------- |
| `personal-insight.tsx` | Add `useWeekdayDistribution({ groupBy: 'project' })` + render heatmap |
| `team-insight.tsx`     | Add heatmap (groupBy: 'user' or 'project')                            |
| `project-insight.tsx`  | Add heatmap (groupBy: 'team' or 'user')                               |

### Verify Phase 5

1. Heatmaps render in all three sections
2. Colors correctly show intensity (darker = more hours)
3. Normalized % toggle changes values to percentages
4. Weekday labels are Mon–Sun (not starting Sunday)

---

## Phase 6: Logging Behavior

### New files

| File                                         | Purpose                                                                                                                     | ~Lines |
| -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | ------ |
| `components/reports/logging-delay-chart.tsx` | Recharts `BarChart`. 4 bars: Same day, 1-2 days, 3-5 days, 6+. Color gradient green→orange. Labels show count + percentage. | 80     |

### Modify

| File                   | Change                                       |
| ---------------------- | -------------------------------------------- |
| `personal-insight.tsx` | Add `useLoggingDelay()` + render delay chart |
| `team-insight.tsx`     | Add delay chart (team-scoped)                |

### Verify Phase 6

1. Delay chart appears in Personal and Team sections
2. Bars show correct counts matching actual `createdAt` vs `date` gaps
3. Percentages sum to ~100%

---

## Key Reference Files

| File                                                            | What to reference                                              |
| --------------------------------------------------------------- | -------------------------------------------------------------- |
| `backend/src/modules/time-logs/time-logs.service.ts`            | Role scoping: `findManagedUserIds` pattern, scope intersection |
| `backend/src/modules/time-logs/time-logs.repository.ts`         | Prisma WHERE clause construction, aggregation patterns         |
| `backend/src/modules/time-logs/dto/list-time-logs-query.dto.ts` | DTO validation: `@Transform` for comma-separated UUIDs         |
| `frontend/src/components/time-logs/time-logs-filter-bar.tsx`    | Filter bar with cascading team→user scoping                    |
| `frontend/src/lib/time-logs/time-logs-api.ts`                   | API client function pattern with URLSearchParams               |
| `backend/prisma/schema.prisma`                                  | Data model, column mappings, indexes                           |
