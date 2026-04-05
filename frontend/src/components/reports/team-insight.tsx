import { useState, useMemo, useEffect } from 'react';
import { useTimeSeries } from '@/lib/reports/use-time-series';
import { useReportSummary } from '@/lib/reports/use-report-summary';
import { autoGranularity } from '@/lib/reports/granularity-utils';
import { SummaryCards } from './summary-cards';
import { GranularityPicker } from './granularity-picker';
import { ChartModeToggle, type ChartMode } from './chart-mode-toggle';
import { TimeSeriesChart } from './time-series-chart';
import type { ReportGranularity, ReportBaseParams } from '@/lib/reports/types';

interface TeamInsightProps {
  filters: ReportBaseParams;
}

export function TeamInsight({ filters }: TeamInsightProps) {
  const defaultGran = useMemo(
    () => autoGranularity(filters.dateFrom, filters.dateTo),
    [filters.dateFrom, filters.dateTo],
  );
  const [granularity, setGranularity] = useState<ReportGranularity>(defaultGran);
  useEffect(() => setGranularity(defaultGran), [defaultGran]);
  const [userChartMode, setUserChartMode] = useState<ChartMode>('grouped');
  const [projectChartMode, setProjectChartMode] = useState<ChartMode>('stacked');

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
      <h2 className="text-lg font-semibold">Team Insight</h2>
      <SummaryCards cards={summaryCards} />
      <GranularityPicker value={granularity} onChange={setGranularity} />

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-muted-foreground">Hours by User</h3>
          <ChartModeToggle value={userChartMode} onChange={setUserChartMode} />
        </div>
        <TimeSeriesChart
          buckets={userSeries?.buckets ?? []}
          dateFrom={filters.dateFrom}
          dateTo={filters.dateTo}
          granularity={granularity}
          mode={userChartMode}
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-muted-foreground">Hours by Project</h3>
          <ChartModeToggle value={projectChartMode} onChange={setProjectChartMode} />
        </div>
        <TimeSeriesChart
          buckets={projectSeries?.buckets ?? []}
          dateFrom={filters.dateFrom}
          dateTo={filters.dateTo}
          granularity={granularity}
          mode={projectChartMode}
        />
      </div>
    </section>
  );
}
