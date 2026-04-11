import { ReportPageShell } from "@/components/reports/report-page-shell";
import { TeamInsight } from "@/components/reports/team-insight";
import { usePaginationParams } from "@/hooks/use-pagination-params";
import { useReportDateRange } from "@/lib/reports/use-report-date-range";

export function TeamInsightPage() {
  const { getParam, setParam, setParams } = usePaginationParams();
  const dateRange = useReportDateRange({ getParam, setParam, setParams });

  return (
    <ReportPageShell
      title="Team Insight"
      description="Aggregated hours across team members. Spot workload imbalances and track project allocation."
      {...dateRange}
    >
      <TeamInsight
        dateFrom={dateRange.dateFrom}
        dateTo={dateRange.dateTo}
        granularity={dateRange.granularity}
        getParam={getParam}
        setParam={setParam}
        setParams={setParams}
      />
    </ReportPageShell>
  );
}
