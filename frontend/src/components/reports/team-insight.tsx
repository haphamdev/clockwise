import { useMemo, useEffect, useCallback } from 'react';
import { Label } from '@/components/ui/label';
import { Combobox } from '@/components/ui/combobox';
import { useTimeSeries } from '@/lib/reports/use-time-series';
import { useReportSummary } from '@/lib/reports/use-report-summary';
import { useTeams } from '@/lib/teams/use-teams';
import { useUsers } from '@/lib/users/use-users';
import { useSectionModes } from '@/lib/reports/use-section-modes';
import { SummaryCards } from './summary-cards';
import { ChartModeToggle } from './chart-mode-toggle';
import { TimeSeriesChart } from './time-series-chart';
import type { ChartMode } from './chart-mode-toggle';
import type { ComboboxOption } from '@/components/ui/combobox';
import type { ReportGranularity } from '@/lib/reports/types';

// Default chart modes by position: chart 0 = Hours by User, chart 1 = Hours by Project
const TI_MODE_DEFAULTS: ChartMode[] = ['grouped', 'stacked'];

interface TeamInsightProps {
  dateFrom: string;
  dateTo: string;
  granularity: ReportGranularity;
  getParam: (key: string) => string;
  setParam: (key: string, value: string) => void;
  setParams: (entries: Record<string, string>) => void;
}

function parseIds(value: string): string[] {
  return value ? value.split(',').filter(Boolean) : [];
}

export function TeamInsight({
  dateFrom,
  dateTo,
  granularity,
  getParam,
  setParam,
  setParams,
}: TeamInsightProps) {
  // Section-specific URL params
  const tiTeamId = getParam('tiTeamId');
  const tiUserIdsParam = getParam('tiUserIds');
  const tiUserIds = useMemo(() => parseIds(tiUserIdsParam), [tiUserIdsParam]);
  const [modes, setMode] = useSectionModes('tiMode', TI_MODE_DEFAULTS, getParam, setParam);

  // Team options (non-archived, sorted alphabetically)
  const { data: teamsData } = useTeams({ limit: 100 });
  const availableTeams = useMemo(
    () =>
      (teamsData?.data ?? [])
        .filter((t) => !t.isArchived)
        .sort((a, b) => a.name.localeCompare(b.name)),
    [teamsData],
  );

  const teamOptions: ComboboxOption[] = useMemo(
    () => availableTeams.map((t) => ({ value: t.id, label: t.name })),
    [availableTeams],
  );

  // Auto-select first team alphabetically when no param is set
  useEffect(() => {
    if (!tiTeamId && availableTeams.length > 0) {
      setParam('tiTeamId', availableTeams[0].id);
    }
  }, [tiTeamId, availableTeams, setParam]);

  // User options scoped to selected team
  const { data: usersData } = useUsers({ limit: 100, teamId: tiTeamId || undefined });
  const userOptions: ComboboxOption[] = useMemo(
    () => (usersData?.data ?? []).map((u) => ({ value: u.id, label: u.name })),
    [usersData],
  );

  // Changing team clears user filter
  const handleTeamChange = useCallback(
    (teamId: string) => {
      setParams({ tiTeamId: teamId, tiUserIds: '' });
    },
    [setParams],
  );

  const handleUserIdsChange = useCallback(
    (ids: string[]) => setParam('tiUserIds', ids.join(',')),
    [setParam],
  );

  // Build filters scoped to selected team + optional user filter
  const filters = useMemo(
    () => ({
      dateFrom,
      dateTo,
      teamIds: tiTeamId ? [tiTeamId] : undefined,
      userIds: tiUserIds.length > 0 ? tiUserIds : undefined,
    }),
    [dateFrom, dateTo, tiTeamId, tiUserIds],
  );

  const { data: summaryData } = useReportSummary(filters);
  const { data: userSeries } = useTimeSeries({ ...filters, granularity, groupBy: 'user' });
  const { data: projectSeries } = useTimeSeries({ ...filters, granularity, groupBy: 'project' });

  const summaryCards = useMemo(() => {
    if (!summaryData) return [];
    const avgPerMember =
      summaryData.uniqueUsers > 0
        ? Math.round((summaryData.totalHours / summaryData.uniqueUsers) * 100) / 100
        : 0;
    return [
      { label: 'Total hours', value: summaryData.totalHours, unit: 'h' },
      { label: 'Avg / member', value: avgPerMember, unit: 'h' },
      { label: 'Members', value: summaryData.uniqueUsers },
      { label: 'Projects', value: summaryData.uniqueProjects },
    ];
  }, [summaryData]);

  return (
    <section className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Team Insight</h2>
          <p className="text-sm text-muted-foreground">
            Aggregated hours across all filtered team members. Spot workload imbalances in the user chart and track project allocation in the project chart.
          </p>
        </div>
        <div className="flex items-end gap-3">
          <div className="flex flex-col gap-1">
            <Label className="text-xs">Team</Label>
            <Combobox
              options={teamOptions}
              value={tiTeamId}
              onChange={handleTeamChange}
              placeholder="Select team"
              searchPlaceholder="Search teams..."
              emptyText="No teams available."
              className="w-[200px]"
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label className="text-xs">Members</Label>
            <Combobox
              multiple
              options={userOptions}
              value={tiUserIds}
              onChange={handleUserIdsChange}
              placeholder="All members"
              searchPlaceholder="Search members..."
              emptyText="No members available."
              className="w-[200px]"
            />
          </div>
        </div>
      </div>
      <SummaryCards cards={summaryCards} />

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">Hours by User</h3>
            <p className="text-xs text-muted-foreground">
              Each color represents a team member. Compare individual contributions per time period.
            </p>
          </div>
          <ChartModeToggle value={modes[0]} onChange={(m) => setMode(0, m)} />
        </div>
        <TimeSeriesChart
          buckets={userSeries?.buckets ?? []}
          dateFrom={dateFrom}
          dateTo={dateTo}
          granularity={granularity}
          mode={modes[0]}
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">Hours by Project</h3>
            <p className="text-xs text-muted-foreground">
              Each color represents a project. See how team effort is distributed across projects over time.
            </p>
          </div>
          <ChartModeToggle value={modes[1]} onChange={(m) => setMode(1, m)} />
        </div>
        <TimeSeriesChart
          buckets={projectSeries?.buckets ?? []}
          dateFrom={dateFrom}
          dateTo={dateTo}
          granularity={granularity}
          mode={modes[1]}
        />
      </div>
    </section>
  );
}
