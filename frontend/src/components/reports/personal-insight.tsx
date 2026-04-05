import { useMemo, useCallback } from 'react';
import { Label } from '@/components/ui/label';
import { Combobox } from '@/components/ui/combobox';
import { useTimeSeries } from '@/lib/reports/use-time-series';
import { useReportSummary } from '@/lib/reports/use-report-summary';
import { useProjects } from '@/lib/projects/use-projects';
import { useSectionModes } from '@/lib/reports/use-section-modes';
import { SummaryCards } from './summary-cards';
import { ChartModeToggle } from './chart-mode-toggle';
import { TimeSeriesChart } from './time-series-chart';
import type { ChartMode } from './chart-mode-toggle';
import type { ComboboxOption } from '@/components/ui/combobox';
import type { ReportGranularity } from '@/lib/reports/types';

// Default chart modes by position. Currently one chart (Hours by Project).
const PI_MODE_DEFAULTS: ChartMode[] = ['stacked'];

interface PersonalInsightProps {
  dateFrom: string;
  dateTo: string;
  granularity: ReportGranularity;
  userId: string;
  getParam: (key: string) => string;
  setParam: (key: string, value: string) => void;
}

function parseIds(value: string): string[] {
  return value ? value.split(',').filter(Boolean) : [];
}

export function PersonalInsight({
  dateFrom,
  dateTo,
  granularity,
  userId,
  getParam,
  setParam,
}: PersonalInsightProps) {
  // Section-specific URL params
  const piProjectIdsParam = getParam('piProjectIds');
  const piProjectIds = useMemo(() => parseIds(piProjectIdsParam), [piProjectIdsParam]);
  const [modes, setMode] = useSectionModes('piMode', PI_MODE_DEFAULTS, getParam, setParam);

  // Project options for inline filter
  const { data: projectsData } = useProjects({ limit: 100 });
  const projectOptions: ComboboxOption[] = useMemo(
    () => (projectsData?.data ?? []).map((p) => ({ value: p.id, label: p.name })),
    [projectsData],
  );

  const handleProjectIdsChange = useCallback(
    (ids: string[]) => setParam('piProjectIds', ids.join(',')),
    [setParam],
  );

  // Personal scope: always filter to current user, optionally filter by project
  const filters = useMemo(
    () => ({
      dateFrom,
      dateTo,
      userIds: [userId],
      projectIds: piProjectIds.length > 0 ? piProjectIds : undefined,
    }),
    [dateFrom, dateTo, userId, piProjectIds],
  );

  const { data: summaryData } = useReportSummary(filters);
  const { data: timeSeriesData } = useTimeSeries({
    ...filters,
    granularity,
    groupBy: 'project',
  });

  const summaryCards = useMemo(() => {
    if (!summaryData) return [];
    return [
      { label: 'Total hours', value: summaryData.totalHours, unit: 'h' },
      { label: 'Avg / day', value: summaryData.avgHoursPerDay, unit: 'h' },
      { label: 'Projects', value: summaryData.uniqueProjects },
      { label: 'Entries', value: summaryData.totalEntries },
    ];
  }, [summaryData]);

  return (
    <section className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Personal Insight</h2>
          <p className="text-sm text-muted-foreground">
            Your logged hours broken down by project. Use stacked mode to see total effort over time, or grouped mode to compare projects side-by-side.
          </p>
        </div>
        <div className="flex flex-col gap-1">
          <Label className="text-xs">Projects</Label>
          <Combobox
            multiple
            options={projectOptions}
            value={piProjectIds}
            onChange={handleProjectIdsChange}
            placeholder="All projects"
            searchPlaceholder="Search projects..."
            emptyText="No projects available."
            className="w-[200px]"
          />
        </div>
      </div>
      <SummaryCards cards={summaryCards} />
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-muted-foreground">Hours by Project</h3>
          <ChartModeToggle value={modes[0]} onChange={(m) => setMode(0, m)} />
        </div>
        <TimeSeriesChart
          buckets={timeSeriesData?.buckets ?? []}
          dateFrom={dateFrom}
          dateTo={dateTo}
          granularity={granularity}
          mode={modes[0]}
        />
      </div>
    </section>
  );
}
