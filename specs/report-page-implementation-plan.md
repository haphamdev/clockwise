# Reports Feature — Implementation Plan

## Context

Users need reports to analyze time log data. The `/reports` page (route already exists as placeholder) will have three vertically-scrollable sections: **Personal Insight**, **Team Insight**, **Project Insight**. Each section has KPI cards, time-series column charts with running average overlays, weekday distribution heatmaps, and logging behavior charts.

## Design Decisions

- **Chart library:** Recharts (via shadcn chart primitives). Heatmaps as custom CSS grids.
- **Backend:** 5 endpoints (time-series, weekday-distribution, logging-delay, summary, anomalies). Raw SQL via `$queryRaw` for `date_trunc` aggregations (first raw SQL in the codebase — Prisma's `groupBy` can't do date truncation).
- **Filters:** Section-specific. Shared date range + granularity at top; each section owns its entity filters (team/user/project pickers). See "Filter Architecture" below.
- **Phased:** 7 phases, verify each before proceeding.

## Access Control

| Role    | Personal Insight                  | Team Insight                                      | Project Insight (future)                           |
| ------- | --------------------------------- | ------------------------------------------------- | -------------------------------------------------- |
| Admin   | Own data, project filter (multi)  | Any team (single-select), user filter within team  | Any project (single-select), user filter within it |
| Manager | Own data, project filter (multi)  | Managed teams (single-select), user filter         | Managed projects (single-select), user filter      |
| Member  | Own data, project filter (multi)  | Not visible                                        | Not visible                                        |

## Filter Architecture

### Shared vs section-specific filters

The date range and time granularity apply globally — you typically want the same time window across all sections. Everything else is section-specific because each section has different semantics:

- **Personal Insight** — always scoped to the current user. Only needs a project filter (multi-select) to let users compare specific projects.
- **Team Insight** — scoped to one team at a time. Single-select team picker (auto-selects first team alphabetically). Optional user filter within that team. Changing the team resets the user filter.
- **Project Insight** (future) — scoped to one project at a time. Single-select project picker. Optional user filter within that project.

### URL parameter scheme

All filter state is persisted in URL params for shareable/bookmarkable links. Short prefixes keep URLs compact while remaining readable.

| Param | Scope | Type | Example | Description |
|---|---|---|---|---|
| `dateFrom` | Shared | string | `2026-03-01` | Start of date range (YYYY-MM-DD) |
| `dateTo` | Shared | string | `2026-03-31` | End of date range |
| `gran` | Shared | string | `w` | Granularity: `d`=day, `w`=week, `m`=month, `q`=quarter |
| `piProjectIds` | Personal | csv | `id1,id2` | Selected project IDs (multi-select) |
| `piMode` | Personal | csv | `s` | Chart modes, comma-separated, positional per chart |
| `tiTeamId` | Team | string | `team-uuid` | Selected team ID (single-select) |
| `tiUserIds` | Team | csv | `id1,id2` | Selected user IDs within team (multi-select) |
| `tiMode` | Team | csv | `g,s` | Chart modes: chart 1 (Hours by User), chart 2 (Hours by Project) |
| `prProjectId` | Project | string | `proj-uuid` | Selected project ID (single-select) |
| `prUserIds` | Project | csv | `id1,id2` | Selected user IDs within project (multi-select) |
| `prMode` | Project | csv | `s,g` | Chart modes per chart |

**Chart mode encoding:** Each section stores its chart modes as a comma-separated string where position = chart index. Values: `s` = stacked, `g` = grouped. When a new chart is added to a section, old URLs with fewer values gracefully fall back to the chart's default mode for missing positions.

Example URL:
```
/reports?dateFrom=2026-03-01&dateTo=2026-03-31&gran=w&piProjectIds=abc,def&piMode=s&tiTeamId=team1&tiMode=g,s
```

### Granularity short codes

Stored as single chars in URL (`d`, `w`, `m`, `q`), mapped to full values (`day`, `week`, `month`, `quarter`) in code. `autoGranularity()` computes the default when no `gran` param is present.

### Team auto-selection behavior

When the Team Insight section first renders with no `tiTeamId` param:
1. Fetch user's available teams (already loaded by `useTeams`)
2. Pick the first team alphabetically
3. Set `tiTeamId` in URL params

When `tiTeamId` changes:
1. Clear `tiUserIds` (reset user filter to "all members of this team")
2. Section re-fetches data scoped to the new team

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

### `GET /reports/anomalies`

Detects daily overtime anomalies — days where a member's total logged hours exceed warning/critical thresholds.

Params: `dateFrom`, `dateTo`, `teamIds?`, `userIds?`, `projectIds?`

```json
{
  "entries": [
    {
      "userId": "user-1",
      "userName": "Alice Chen",
      "date": "2026-03-25",
      "weekday": 2,
      "totalHours": 13.8,
      "severity": "critical"
    }
  ],
  "thresholds": { "warningHigh": 10, "criticalHigh": 12 }
}
```

Weekday encoding: 0=Mon, 6=Sun (same as weekday-distribution). Severity: `warning` (≥10h), `critical` (≥12h). Thresholds are currently hardcoded in the service (TODO: pull from org settings).

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

## Phase 1: Backend Endpoints + Frontend Infrastructure ✅ (DONE)

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

## Phase 2: Personal Insight Section ✅ (DONE)

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

## Phase 3: Team Insight Section ✅ (DONE)

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

## Phase 3.5: Section-Specific Filters + URL Param Refactor ✅ (DONE)

> **Why a separate phase:** Phases 1–3 shipped with a single shared filter bar. This phase refactors to section-specific filters with the new URL param scheme. Doing this before Phase 4 (Project Insight) means the new section launches with the correct filter pattern from day one.

### Summary of changes

Replace the current shared `ReportsFilterBar` (date + team + user + project all in one bar) with:
1. **Shared top bar** — date range picker + granularity picker only
2. **Section-inline filters** — each section renders its own entity filters below its heading

### New files

| File | Purpose | ~Lines |
|---|---|---|
| `lib/reports/use-section-modes.ts` | Hook to read/write chart mode params. Parses positional comma-separated values (e.g. `g,s`) with fallback defaults for missing positions. Returns `[modes, setMode]` where `setMode(chartIndex, mode)` updates one position. | 40 |
| `lib/reports/report-param-utils.ts` | Pure utility functions: `granularityToCode()`/`codeToGranularity()` for `d↔day`, `w↔week` etc. `parseChartModes(param, defaults)` and `serializeChartModes(modes)`. Centralizes the encoding logic so each section just calls these. | 30 |

### Modify

| File | Change |
|---|---|
| `pages/reports-page.tsx` | Remove shared team/user/project filter state. Keep only `dateFrom`, `dateTo`. Add `gran` param (read/write via `report-param-utils`). Move `GranularityPicker` into top bar alongside `TimeWindowPicker`. Pass `getParam`/`setParam` to sections so they can manage their own params. |
| `components/reports/reports-filter-bar.tsx` | Slim down to date range + granularity only. Remove team/user/project comboboxes. Rename to `ReportsDateBar` (or keep name, just gut the entity filters). |
| `components/reports/personal-insight.tsx` | Add inline project multi-select filter. Read `piProjectIds` and `piMode` from URL. Remove internal `useState` for granularity and chart mode — receive `granularity` as prop, read mode from URL param. |
| `components/reports/team-insight.tsx` | Add inline single-team select + user multi-select. Read `tiTeamId`, `tiUserIds`, `tiMode` from URL. Auto-select first team alphabetically when no param. Reset `tiUserIds` on team change. Remove internal `useState` for granularity and chart modes. |

### URL param flow

```
reports-page.tsx (owns dateFrom, dateTo, gran)
  ├── ReportsDateBar (date picker + granularity picker)
  ├── PersonalInsight (owns piProjectIds, piMode)
  │     └── inline project Combobox
  ├── TeamInsight (owns tiTeamId, tiUserIds, tiMode)
  │     └── inline team Combobox (single) + user Combobox (multi)
  └── ProjectInsight (owns prProjectId, prUserIds, prMode)  [future]
        └── inline project Combobox (single) + user Combobox (multi)
```

### `use-section-modes` hook API

```typescript
// Each section declares its chart defaults (order matters — positional)
const TEAM_CHART_DEFAULTS: ChartMode[] = ['grouped', 'stacked'];

// In TeamInsight:
const [modes, setMode] = useSectionModes('tiMode', TEAM_CHART_DEFAULTS);
// modes[0] = 'grouped' (Hours by User chart)
// modes[1] = 'stacked' (Hours by Project chart)
// setMode(0, 'stacked') → updates URL to tiMode=s,s
```

### Granularity as URL param

```typescript
// report-param-utils.ts
const GRAN_CODES = { d: 'day', w: 'week', m: 'month', q: 'quarter' } as const;

// In reports-page.tsx:
const granParam = getParam('gran');
const granularity = codeToGranularity(granParam) ?? autoGranularity(dateFrom, dateTo);
// When user picks granularity → setParam('gran', granularityToCode(value))
```

### Team auto-select logic

```typescript
// In TeamInsight:
const tiTeamId = getParam('tiTeamId');
const { data: teamsData } = useTeams({ limit: 100 });
const availableTeams = teamsData?.data?.filter(t => !t.isArchived)
  .sort((a, b) => a.name.localeCompare(b.name)) ?? [];

// Auto-select first team if no param and teams are loaded
useEffect(() => {
  if (!tiTeamId && availableTeams.length > 0) {
    setParam('tiTeamId', availableTeams[0].id);
  }
}, [tiTeamId, availableTeams, setParam]);

// On team change: reset user filter
const handleTeamChange = (teamId: string) => {
  setParams({ tiTeamId: teamId, tiUserIds: '' });
};
```

### Delete

| File | Reason |
|---|---|
| — | No files deleted. `reports-filter-bar.tsx` is modified in place (slimmed down), not removed. |

### Verify Phase 3.5

1. **Shared date range** — Changing date range updates all sections simultaneously
2. **Shared granularity** — `gran` param in URL; D/W/M/Q picker in top bar; all sections use same granularity
3. **Personal Insight** — project multi-select filter appears inline; `piProjectIds` and `piMode` in URL
4. **Team Insight** — single team picker auto-selects first team; changing team clears user filter; `tiTeamId`, `tiUserIds`, `tiMode` in URL
5. **Chart modes** — Toggle stacked/grouped on any chart → URL updates with positional codes (e.g. `tiMode=g,s`)
6. **Bookmarkable URLs** — Copy URL with filters set, open in new tab → same state restored
7. **Graceful defaults** — Open `/reports` with no params → date defaults to last 30 days, granularity auto-computed, first team auto-selected, all chart modes at defaults
8. **Old params ignored** — Remove old `projectIds`/`userIds`/`teamIds` params from any bookmarks; page works without them
9. `pnpm build` passes

---

## Phase 4: Project Insight Section ✅ (DONE)

### New files

| File                                     | Purpose                                               | ~Lines |
| ---------------------------------------- | ----------------------------------------------------- | ------ |
| `components/reports/project-insight.tsx` | Only visible to admin/manager. Two sub-charts + KPIs. | 90     |

### Charts

**Chart 1 — Team Comparison**: `useTimeSeries({ groupBy: 'team', projectIds: [selected] })`. Bars per team.

**Chart 2 — User Comparison**: `useTimeSeries({ groupBy: 'user', projectIds: [selected] })`. Bars per user.

**KPIs**: Total hours, contributors count, teams count.

### Filters (inline, following Phase 3.5 pattern)

- Single-select project picker (`prProjectId`). Auto-selects first project alphabetically.
- Multi-select user picker (`prUserIds`), scoped to the selected project's members.
- Chart modes in `prMode` (e.g. `s,g`).

### Modify

| File                     | Change                                         |
| ------------------------ | ---------------------------------------------- |
| `pages/reports-page.tsx` | Import + conditionally render `ProjectInsight` |

### Verify Phase 4

1. Select a project — charts show team and user comparisons
2. KPIs reflect selected project
3. Only visible to managers/admins
4. `prProjectId`, `prUserIds`, `prMode` persist in URL
5. Changing project resets user filter

---

## Phase 4.5: Overtime Anomaly Detection ✅ (DONE)

Adds overtime anomaly detection to the Team Insight section. Flags days where a member logged ≥10h (warning) or ≥12h (critical). Visualized as a user×weekday heatmap and a paginated detail list.

### Backend — New/Modify

| File | Change |
|---|---|
| `dto/reports-query.dto.ts` | Add `AnomaliesQueryDto extends ReportBaseQueryDto` |
| `dto/reports-response.dto.ts` | Add `AnomalyThresholdsDto`, `AnomalyEntryDto`, `AnomaliesResponseDto` |
| `reports.controller.ts` | Add `GET /reports/anomalies` endpoint with `@Auth()` |
| `reports.repository.ts` | Add `findDailyAnomalies()` — groups time logs by user+date, filters by `HAVING SUM(hours) >= threshold`, computes weekday via `EXTRACT(DOW)` |
| `reports.service.ts` | Add `getAnomalies()` — validates date range, resolves scoped user IDs, maps rows to entries with severity classification |

### Frontend — New files

| File | Purpose | ~Lines |
|---|---|---|
| `lib/reports/types.ts` | Add `AnomaliesParams`, `AnomalyEntry`, `AnomalySeverity`, `AnomaliesResponse` types | +18 |
| `lib/reports/reports-api.ts` | Add `fetchAnomalies()` | +5 |
| `lib/reports/reports-keys.ts` | Add `anomalies` query key | +1 |
| `lib/reports/use-anomalies.ts` | `useAnomalies(params)` hook with `keepPreviousData` and `enabled` guard | 13 |
| `components/reports/anomaly-heatmap.tsx` | User×weekday CSS grid heatmap. Weighted cell model (`warnings×2 + criticals×3`). Relative color scale — 10 oklch steps scaled to percentage of max weight. Right-aligned layout. Tooltip shows "X warnings, Y criticals". | 144 |
| `components/reports/anomaly-list.tsx` | Paginated table (PAGE_SIZE=10) of anomaly entries. Hours text colored by severity (amber/red). Threshold footnote with colored text. Page resets on data change. | 88 |

### Frontend — Modify

| File | Change |
|---|---|
| `components/reports/team-insight.tsx` | Import `useAnomalies`, `AnomalyHeatmap`, `AnomalyList`. Add "Overtime Anomalies" subsection with description, heatmap, and list. |

### Heatmap color scale

Constant-lightness oklch ramp (L=0.76, hue=33) with increasing chroma (0.01→0.26). Cell weight = `warnings×2 + criticals×3`. Percentage = `(weight / maxWeight) × 100`. Mapped to 10 steps at 5% intervals. Empty cells use `bg-muted`.

### Verify Phase 4.5

1. Heatmap renders in Team Insight with weighted color intensity
2. Tooltip shows "X warnings, Y criticals" per cell
3. Heatmap is right-aligned with user labels flush against cells
4. List shows User/Date/Hours columns — hours colored amber (warning) or red (critical)
5. Pagination works (Previous/Next), resets on filter change
6. Threshold footnote: "Warning ≥ 10h" in amber, "Critical ≥ 12h" in red
7. Empty state shows "No overtime detected in this period"
8. Auth scoping: managers see only their team members' anomalies
9. `pnpm build` passes

---

## Phase 5: Weekday Distribution Heatmaps (renumbered from original Phase 5) — SKIPPED

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

## Phase 6: Logging Delay Heatmap — Team Insight ✅ (DONE)

Per-user logging delay heatmap in Team Insight. Shows a User × Weekday grid with P75 delay (days between work date and log creation) per cell. Absolute green-to-red color scale. Replaces the original Phase 6 plan (aggregate bar chart) with a more actionable per-user visualization.

### Backend — New endpoint: `GET /reports/logging-delay-heatmap`

Params: `dateFrom`, `dateTo`, `teamIds?`, `userIds?`, `projectIds?`

Response: `{ cells: [{ userId, userName, weekday, p75Delay, entryCount }], minEntries: 5 }`

SQL uses `PERCENTILE_CONT(0.75)` with `HAVING COUNT(*) >= 5` to filter statistically meaningless cells. `GREATEST((created_at::date - date)::int, 0)` clamps negative delays to zero.

### Backend — Modify

| File | Change |
|------|--------|
| `dto/reports-query.dto.ts` | Added `LoggingDelayHeatmapQueryDto extends ReportBaseQueryDto` |
| `dto/reports-response.dto.ts` | Added `DelayHeatmapCellDto`, `LoggingDelayHeatmapResponseDto` |
| `reports.repository.ts` | Added `findLoggingDelayHeatmap()` — PERCENTILE_CONT SQL, reuses `buildConditions()` |
| `reports.service.ts` | Added `getLoggingDelayHeatmap()` — validates date range, resolves scoped user IDs |
| `reports.controller.ts` | Added `GET /reports/logging-delay-heatmap` with `@Auth()` |

### Backend — Tests

| File | Tests |
|------|-------|
| `reports.service.spec.ts` | Scope resolution (admin/manager/member), date validation, filter passthrough, response structure |
| `reports.controller.spec.ts` | Endpoint param delegation, response structure |

### Frontend — New files

| File | Purpose | ~Lines |
|------|---------|--------|
| `lib/reports/use-delay-heatmap.ts` | `useDelayHeatmap(params)` hook with `keepPreviousData` + `enabled` guard | 13 |
| `components/reports/delay-heatmap.tsx` | User × Weekday CSS grid. Absolute color scale (green→red, 6 bands). Tooltip shows P75 + entry count. Inline legend. | ~110 |
| `components/reports/team-delay-section.tsx` | Self-contained subsection: fetches delay heatmap data and renders description + `DelayHeatmap` | 25 |
| `components/reports/team-anomalies-section.tsx` | Extracted subsection: fetches anomaly data and renders heatmap + list (refactored out of `team-insight.tsx`) | 29 |

### Frontend — Modify

| File | Change |
|------|--------|
| `lib/reports/types.ts` | Added `DelayHeatmapCell`, `DelayHeatmapResponse`, `DelayHeatmapParams` |
| `lib/reports/reports-api.ts` | Added `fetchDelayHeatmap()` |
| `lib/reports/reports-keys.ts` | Added `delayHeatmap` query key |
| `components/reports/team-insight.tsx` | Replaced inline anomaly + delay sections with `TeamAnomaliesSection` and `TeamDelaySection` |

### Heatmap color scale (absolute thresholds)

| P75 Delay | Color | Meaning |
|-----------|-------|---------|
| < 5 entries | `bg-muted` | Insufficient data |
| [0, 1) days | green | Same day — excellent |
| [1, 2) days | yellow-green | Next day — great |
| [2, 4) days | yellow | 2-3 days — acceptable |
| [4, 6) days | orange | 4-5 days — concerning |
| [6, 8) days | dark orange | 6-7 days — problematic |
| [8, ∞) days | red | 8+ days — critical |

### Bruno collection

`bruno/clockwise/reports/get-logging-delay-heatmap.yml`

### Verify Phase 6

1. Backend tests pass (10 tests)
2. `pnpm build` passes (both frontend and backend)
3. Heatmap renders in Team Insight with green-to-red color progression
4. Tooltip shows "P75 delay: X days (N entries)" on hover
5. Cells with < 5 entries show as muted with "Not enough data" tooltip
6. Color legend appears below heatmap
7. Changing team/user/date filters updates the heatmap
8. Auth scoping: managers see only their team members

---

## Key Reference Files

| File                                                            | What to reference                                              |
| --------------------------------------------------------------- | -------------------------------------------------------------- |
| `backend/src/modules/time-logs/time-logs.service.ts`            | Role scoping: `findManagedUserIds` pattern, scope intersection |
| `backend/src/modules/time-logs/time-logs.repository.ts`         | Prisma WHERE clause construction, aggregation patterns         |
| `backend/src/modules/time-logs/dto/list-time-logs-query.dto.ts` | DTO validation: `@Transform` for comma-separated UUIDs         |
| `frontend/src/components/time-logs/time-logs-filter-bar.tsx`    | Filter bar with cascading team→user scoping                    |
| `frontend/src/lib/time-logs/time-logs-api.ts`                   | API client function pattern with URLSearchParams               |
| `frontend/src/hooks/use-pagination-params.ts`                   | `getParam`/`setParam`/`setParams` for URL state management     |
| `frontend/src/components/reports/reports-filter-bar.tsx`         | Current shared filter bar (to be slimmed in Phase 3.5)         |
| `frontend/src/components/reports/personal-insight.tsx`           | Current section pattern (to be refactored in Phase 3.5)        |
| `frontend/src/components/reports/team-insight.tsx`               | Current section pattern with dual charts                       |
| `frontend/src/lib/reports/granularity-utils.ts`                 | `autoGranularity()` and granularity constants                  |
| `backend/prisma/schema.prisma`                                  | Data model, column mappings, indexes                           |
