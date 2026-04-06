import { useMemo, useCallback, useState } from 'react';
import { useTimeSeries } from '@/lib/reports/use-time-series';
import { useReportSummary } from '@/lib/reports/use-report-summary';
import { useSectionModes } from '@/lib/reports/use-section-modes';
import { parseIds } from '@/lib/reports/report-param-utils';
import { ProjectInsightFilters } from './project-insight-filters';
import { SummaryCards } from './summary-cards';
import { ChartToolbar } from './chart-toolbar';
import { TimeSeriesChart } from './time-series-chart';
import type { ChartMode, ChartLayers } from './chart-toolbar';
import type { ReportGranularity } from '@/lib/reports/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';

// Default chart modes: chart 0 = Hours by Team (stacked), chart 1 = Hours by User (grouped)
const PR_MODE_DEFAULTS: ChartMode[] = ['stacked', 'grouped'];

interface ProjectInsightProps {
  dateFrom: string;
  dateTo: string;
  granularity: ReportGranularity;
  getParam: (key: string) => string;
  setParam: (key: string, value: string) => void;
  setParams: (entries: Record<string, string>) => void;
}

export function ProjectInsight({
  dateFrom,
  dateTo,
  granularity,
  getParam,
  setParam,
  setParams,
}: ProjectInsightProps) {
  // Section-specific URL params (pr prefix)
  const prProjectId = getParam('prProjectId');
  const prTeamIdsParam = getParam('prTeamIds');
  const prTeamIds = useMemo(() => parseIds(prTeamIdsParam), [prTeamIdsParam]);
  const prUserIdsParam = getParam('prUserIds');
  const prUserIds = useMemo(() => parseIds(prUserIdsParam), [prUserIdsParam]);
  const [modes, setMode] = useSectionModes('prMode', PR_MODE_DEFAULTS, getParam, setParam);
  const [layersTeam, setLayersTeam] = useState<ChartLayers>({ values: true, trend: true });
  const [layersUser, setLayersUser] = useState<ChartLayers>({ values: true, trend: true });

  // Changing project clears team and user filters
  const handleProjectChange = useCallback(
    (projectId: string) => {
      setParams({ prProjectId: projectId, prTeamIds: '', prUserIds: '' });
    },
    [setParams],
  );

  const handleTeamIdsChange = useCallback(
    (ids: string[]) => setParam('prTeamIds', ids.join(',')),
    [setParam],
  );

  const handleUserIdsChange = useCallback(
    (ids: string[]) => setParam('prUserIds', ids.join(',')),
    [setParam],
  );

  // Build filters scoped to selected project + optional team/user filter
  const filters = useMemo(
    () => ({
      dateFrom,
      dateTo,
      projectIds: prProjectId ? [prProjectId] : undefined,
      teamIds: prTeamIds.length > 0 ? prTeamIds : undefined,
      userIds: prUserIds.length > 0 ? prUserIds : undefined,
    }),
    [dateFrom, dateTo, prProjectId, prTeamIds, prUserIds],
  );

  const { data: summaryData } = useReportSummary(filters);
  const { data: teamSeries } = useTimeSeries({ ...filters, granularity, groupBy: 'team' });
  const { data: userSeries } = useTimeSeries({ ...filters, granularity, groupBy: 'user' });

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
      { label: 'Teams', value: summaryData.uniqueTeams },
    ];
  }, [summaryData]);

  return (
    <section className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Project Insight</CardTitle>
          <CardDescription>
            Aggregated hours across all filtered project contributors. See how effort is distributed
            across teams and individual members within a project.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <ProjectInsightFilters
              projectId={prProjectId}
              teamIds={prTeamIds}
              userIds={prUserIds}
              onProjectChange={handleProjectChange}
              onTeamIdsChange={handleTeamIdsChange}
              onUserIdsChange={handleUserIdsChange}
            />
            <SummaryCards cards={summaryCards} />

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Hours by Team</h3>
                  <p className="text-xs text-muted-foreground">
                    Each color represents a team. Compare how different teams contribute to this
                    project over time.
                  </p>
                </div>
                <ChartToolbar
                  mode={modes[0]}
                  onModeChange={(m) => setMode(0, m)}
                  layers={layersTeam}
                  onLayersChange={setLayersTeam}
                />
              </div>
              <TimeSeriesChart
                buckets={teamSeries?.buckets ?? []}
                dateFrom={dateFrom}
                dateTo={dateTo}
                granularity={granularity}
                mode={modes[0]}
                layers={layersTeam}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Hours by User</h3>
                  <p className="text-xs text-muted-foreground">
                    Each color represents a contributor. See individual contributions to this project
                    per time period.
                  </p>
                </div>
                <ChartToolbar
                  mode={modes[1]}
                  onModeChange={(m) => setMode(1, m)}
                  layers={layersUser}
                  onLayersChange={setLayersUser}
                />
              </div>
              <TimeSeriesChart
                buckets={userSeries?.buckets ?? []}
                dateFrom={dateFrom}
                dateTo={dateTo}
                granularity={granularity}
                mode={modes[1]}
                layers={layersUser}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
