import { ProjectInsight } from "@/components/reports/project-insight";
import { ReportPageShell } from "@/components/reports/report-page-shell";
import { usePaginationParams } from "@/hooks/use-pagination-params";
import { useReportDateRange } from "@/lib/reports/use-report-date-range";

export function ProjectInsightPage() {
  const { getParam, setParam, setParams } = usePaginationParams();
  const dateRange = useReportDateRange({ getParam, setParam, setParams });

  return (
    <ReportPageShell
      title="Project Insight"
      description="Aggregated hours across project contributors. See effort distribution across teams and members."
      {...dateRange}
    >
      <ProjectInsight
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
