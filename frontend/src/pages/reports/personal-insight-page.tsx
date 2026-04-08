import { usePaginationParams } from '@/hooks/use-pagination-params';
import { useAuth } from '@/lib/auth/use-auth';
import { useReportDateRange } from '@/lib/reports/use-report-date-range';
import { ReportPageShell } from '@/components/reports/report-page-shell';
import { PersonalInsight } from '@/components/reports/personal-insight';

export function PersonalInsightPage() {
  const { user } = useAuth();
  const { getParam, setParam, setParams } = usePaginationParams();
  const dateRange = useReportDateRange({ getParam, setParam, setParams });

  if (!user) return null;

  return (
    <ReportPageShell
      title="Personal Insight"
      description="Your logged hours broken down by project."
      {...dateRange}
    >
      <PersonalInsight
        dateFrom={dateRange.dateFrom}
        dateTo={dateRange.dateTo}
        granularity={dateRange.granularity}
        userId={user.id}
        getParam={getParam}
        setParam={setParam}
      />
    </ReportPageShell>
  );
}
