import { useState, useMemo, useEffect } from 'react';
import { useTimeSeries } from '@/lib/reports/use-time-series';
import { useReportSummary } from '@/lib/reports/use-report-summary';
import { autoGranularity } from '@/lib/reports/granularity-utils';
import { SummaryCards } from './summary-cards';
import { GranularityPicker } from './granularity-picker';
import { ChartModeToggle, type ChartMode } from './chart-mode-toggle';
import { TimeSeriesChart } from './time-series-chart';
import type { ReportGranularity, ReportBaseParams } from '@/lib/reports/types';

interface PersonalInsightProps {
  filters: ReportBaseParams;
  userId: string;
}

export function PersonalInsight({ filters, userId }: PersonalInsightProps) {
  const defaultGran = useMemo(
    () => autoGranularity(filters.dateFrom, filters.dateTo),
    [filters.dateFrom, filters.dateTo],
  );
  const [granularity, setGranularity] = useState<ReportGranularity>(defaultGran);
  useEffect(() => setGranularity(defaultGran), [defaultGran]);
  const [chartMode, setChartMode] = useState<ChartMode>('stacked');

  // Personal scope: always filter to current user
  const personalFilters = useMemo(
    () => ({ ...filters, userIds: [userId] }),
    [filters, userId],
  );

  const { data: summaryData } = useReportSummary(personalFilters);
  const { data: timeSeriesData } = useTimeSeries({
    ...personalFilters,
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
      <div>
        <h2 className="text-lg font-semibold">Personal Insight</h2>
        <p className="text-sm text-muted-foreground">
          Your logged hours broken down by project. Use stacked mode to see total effort over time, or grouped mode to compare projects side-by-side.
        </p>
      </div>
      <SummaryCards cards={summaryCards} />
      <div className="flex items-center justify-between">
        <GranularityPicker value={granularity} onChange={setGranularity} />
        <ChartModeToggle value={chartMode} onChange={setChartMode} />
      </div>
      <TimeSeriesChart
        buckets={timeSeriesData?.buckets ?? []}
        dateFrom={filters.dateFrom}
        dateTo={filters.dateTo}
        granularity={granularity}
        mode={chartMode}
      />
    </section>
  );
}
