import { useMemo, useEffect, useCallback, useState } from 'react';
import { Label } from '@/components/ui/label';
import { Combobox } from '@/components/ui/combobox';
import { useTimeSeries } from '@/lib/reports/use-time-series';
import { useReportSummary } from '@/lib/reports/use-report-summary';
import { useTeams } from '@/lib/teams/use-teams';
import { useUsers } from '@/lib/users/use-users';
import { useProjects } from '@/lib/projects/use-projects';
import { useSectionModes } from '@/lib/reports/use-section-modes';
import { parseIds } from '@/lib/reports/report-param-utils';
import { SummaryCards } from './summary-cards';
import { ChartToolbar } from './chart-toolbar';
import { TimeSeriesChart } from './time-series-chart';
import { TeamAnomaliesSection } from './team-anomalies-section';
import { TeamDelaySection } from './team-delay-section';
import type { ChartMode, ChartLayers } from './chart-toolbar';
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

export function TeamInsight({
  dateFrom,
  dateTo,
  granularity,
  getParam,
  setParam,
  setParams,
}: TeamInsightProps) {
  // Section-specific URL params
  const teamId = getParam('teamId');
  const userIdsParam = getParam('userIds');
  const userIds = useMemo(() => parseIds(userIdsParam), [userIdsParam]);
  const projectIdsParam = getParam('projectIds');
  const projectIds = useMemo(() => parseIds(projectIdsParam), [projectIdsParam]);
  const [modes, setMode] = useSectionModes('mode', TI_MODE_DEFAULTS, getParam, setParam);
  const [layersUser, setLayersUser] = useState<ChartLayers>({ values: true, trend: true });
  const [layersProject, setLayersProject] = useState<ChartLayers>({ values: true, trend: true });

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
    if (!teamId && availableTeams.length > 0) {
      setParam('teamId', availableTeams[0].id);
    }
  }, [teamId, availableTeams, setParam]);

  // User options scoped to selected team (skip fetch until a team is selected)
  const { data: usersData } = useUsers(
    { limit: 100, teamId: teamId || undefined },
    { enabled: !!teamId },
  );
  const userOptions: ComboboxOption[] = useMemo(
    () => (usersData?.data ?? []).map((u) => ({ value: u.id, label: u.name })),
    [usersData],
  );

  // Project options scoped to selected team (skip fetch until a team is selected)
  const { data: projectsData } = useProjects(
    { limit: 100, teamId: teamId || undefined },
    { enabled: !!teamId },
  );
  const projectOptions: ComboboxOption[] = useMemo(
    () => (projectsData?.data ?? []).map((p) => ({ value: p.id, label: p.name })),
    [projectsData],
  );

  // Changing team clears user and project filters
  const handleTeamChange = useCallback(
    (newTeamId: string) => {
      setParams({ teamId: newTeamId, userIds: '', projectIds: '' });
    },
    [setParams],
  );

  const handleUserIdsChange = useCallback(
    (ids: string[]) => setParam('userIds', ids.join(',')),
    [setParam],
  );

  const handleProjectIdsChange = useCallback(
    (ids: string[]) => setParam('projectIds', ids.join(',')),
    [setParam],
  );

  // Build filters scoped to selected team + optional user/project filter
  const filters = useMemo(
    () => ({
      dateFrom,
      dateTo,
      teamIds: teamId ? [teamId] : undefined,
      userIds: userIds.length > 0 ? userIds : undefined,
      projectIds: projectIds.length > 0 ? projectIds : undefined,
    }),
    [dateFrom, dateTo, teamId, userIds, projectIds],
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
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-4 my-4">
        <div className="w-full flex justify-end items-end gap-3">
          <div className="flex flex-col gap-1">
            <Label className="text-xs">Team</Label>
            <Combobox
              options={teamOptions}
              value={teamId}
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
              value={userIds}
              onChange={handleUserIdsChange}
              placeholder="All members"
              searchPlaceholder="Search members..."
              emptyText="No members available."
              className="w-[200px]"
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label className="text-xs">Projects</Label>
            <Combobox
              multiple
              options={projectOptions}
              value={projectIds}
              onChange={handleProjectIdsChange}
              placeholder="All projects"
              searchPlaceholder="Search projects..."
              emptyText="No projects available."
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
              Each color represents a team member. Compare individual contributions per time
              period.
            </p>
          </div>
          <ChartToolbar
            mode={modes[0]}
            onModeChange={(m) => setMode(0, m)}
            layers={layersUser}
            onLayersChange={setLayersUser}
          />
        </div>
        <TimeSeriesChart
          buckets={userSeries?.buckets ?? []}
          dateFrom={dateFrom}
          dateTo={dateTo}
          granularity={granularity}
          mode={modes[0]}
          layers={layersUser}
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">Hours by Project</h3>
            <p className="text-xs text-muted-foreground">
              Each color represents a project. See how team effort is distributed across
              projects over time.
            </p>
          </div>
          <ChartToolbar
            mode={modes[1]}
            onModeChange={(m) => setMode(1, m)}
            layers={layersProject}
            onLayersChange={setLayersProject}
          />
        </div>
        <TimeSeriesChart
          buckets={projectSeries?.buckets ?? []}
          dateFrom={dateFrom}
          dateTo={dateTo}
          granularity={granularity}
          mode={modes[1]}
          layers={layersProject}
        />
      </div>

      <TeamAnomaliesSection filters={filters} />
      <TeamDelaySection filters={filters} />
    </div>
  );
}
