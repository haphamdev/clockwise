import { useMemo, useCallback } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { ReportsFilterBar } from '@/components/reports/reports-filter-bar';
import { PersonalInsight } from '@/components/reports/personal-insight';
import { TeamInsight } from '@/components/reports/team-insight';
import { usePaginationParams } from '@/hooks/use-pagination-params';
import { useAuth } from '@/lib/auth/use-auth';
import { defaultTimeWindow, type TimeWindow } from '@/lib/dates/time-window-utils';
import { autoGranularity } from '@/lib/reports/granularity-utils';
import { codeToGranularity, granularityToCode } from '@/lib/reports/report-param-utils';
import type { ReportGranularity } from '@/lib/reports/types';

function SectionPlaceholder({ title }: { title: string }) {
  return (
    <div className="rounded-lg border border-dashed p-8 text-center">
      <h2 className="text-lg font-medium">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">Coming soon</p>
    </div>
  );
}

export function ReportsPage() {
  const { user } = useAuth();
  const { getParam, setParam, setParams } = usePaginationParams();

  const isAdmin = user?.isAdmin ?? false;
  const isManager = user?.teams.some((t) => t.role === 'manager') ?? false;
  const showTeamSection = isAdmin || isManager;
  const showProjectSection = isAdmin || isManager;

  // Shared date range
  const defaults = useMemo(() => defaultTimeWindow(), []);
  const dateFrom = getParam('dateFrom') || defaults.dateFrom;
  const dateTo = getParam('dateTo') || defaults.dateTo;

  // Shared granularity — URL param `gran` stores compact code (d/w/m/q),
  // falls back to auto-computed value when absent.
  const granParam = getParam('gran');
  const granularity: ReportGranularity =
    codeToGranularity(granParam) ?? autoGranularity(dateFrom, dateTo);

  const handleTimeWindowChange = useCallback(
    (w: TimeWindow) => setParams({ dateFrom: w.dateFrom, dateTo: w.dateTo, gran: '' }),
    [setParams],
  );

  const handleGranularityChange = useCallback(
    (g: ReportGranularity) => setParam('gran', granularityToCode(g)),
    [setParam],
  );

  return (
    <div className="space-y-4">
      <PageHeader
        title="Reports"
        description="Analyze time tracking data across people, teams, and projects."
      />

      <ReportsFilterBar
        dateFrom={dateFrom}
        dateTo={dateTo}
        granularity={granularity}
        onTimeWindowChange={handleTimeWindowChange}
        onGranularityChange={handleGranularityChange}
      />

      {user && (
        <PersonalInsight
          dateFrom={dateFrom}
          dateTo={dateTo}
          granularity={granularity}
          userId={user.id}
          getParam={getParam}
          setParam={setParam}
        />
      )}
      {showTeamSection && (
        <TeamInsight
          dateFrom={dateFrom}
          dateTo={dateTo}
          granularity={granularity}
          getParam={getParam}
          setParam={setParam}
          setParams={setParams}
        />
      )}
      {showProjectSection && <SectionPlaceholder title="Project Insight" />}
    </div>
  );
}
