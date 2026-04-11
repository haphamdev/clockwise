import { useCallback, useMemo, useState } from "react";
import type { ComboboxOption } from "@/components/ui/combobox";
import { Combobox } from "@/components/ui/combobox";
import { Label } from "@/components/ui/label";
import { useProjects } from "@/lib/projects/use-projects";
import { parseIds } from "@/lib/reports/report-param-utils";
import type { ReportGranularity } from "@/lib/reports/types";
import { useReportSummary } from "@/lib/reports/use-report-summary";
import { useSectionModes } from "@/lib/reports/use-section-modes";
import { useTimeSeries } from "@/lib/reports/use-time-series";
import type { ChartLayers, ChartMode } from "./chart-toolbar";
import { ChartToolbar } from "./chart-toolbar";
import { SummaryCards } from "./summary-cards";
import { TimeSeriesChart } from "./time-series-chart";

// Default chart modes by position. Currently one chart (Hours by Project).
const PI_MODE_DEFAULTS: ChartMode[] = ["stacked"];

interface PersonalInsightProps {
  dateFrom: string;
  dateTo: string;
  granularity: ReportGranularity;
  userId: string;
  getParam: (key: string) => string;
  setParam: (key: string, value: string) => void;
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
  const projectIdsParam = getParam("projectIds");
  const projectIds = useMemo(
    () => parseIds(projectIdsParam),
    [projectIdsParam],
  );
  const [modes, setMode] = useSectionModes(
    "mode",
    PI_MODE_DEFAULTS,
    getParam,
    setParam,
  );
  const [layers, setLayers] = useState<ChartLayers>({
    values: true,
    trend: true,
  });

  // Project options for inline filter
  const { data: projectsData } = useProjects({ limit: 100 });
  const projectOptions: ComboboxOption[] = useMemo(
    () =>
      (projectsData?.data ?? []).map((p) => ({ value: p.id, label: p.name })),
    [projectsData],
  );

  const handleProjectIdsChange = useCallback(
    (ids: string[]) => setParam("projectIds", ids.join(",")),
    [setParam],
  );

  // Personal scope: always filter to current user, optionally filter by project
  const filters = useMemo(
    () => ({
      dateFrom,
      dateTo,
      userIds: [userId],
      projectIds: projectIds.length > 0 ? projectIds : undefined,
    }),
    [dateFrom, dateTo, userId, projectIds],
  );

  const { data: summaryData } = useReportSummary(filters);
  const { data: timeSeriesData } = useTimeSeries({
    ...filters,
    granularity,
    groupBy: "project",
  });

  const summaryCards = useMemo(() => {
    if (!summaryData) return [];
    return [
      { label: "Total hours", value: summaryData.totalHours, unit: "h" },
      { label: "Avg / day", value: summaryData.avgHoursPerDay, unit: "h" },
      { label: "Projects", value: summaryData.uniqueProjects },
      { label: "Entries", value: summaryData.totalEntries },
    ];
  }, [summaryData]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start gap-4 justify-end">
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
      <SummaryCards cards={summaryCards} />
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-muted-foreground">
            Hours by Project
          </h3>
          <ChartToolbar
            mode={modes[0]}
            onModeChange={(m) => setMode(0, m)}
            layers={layers}
            onLayersChange={setLayers}
          />
        </div>
        <TimeSeriesChart
          buckets={timeSeriesData?.buckets ?? []}
          dateFrom={dateFrom}
          dateTo={dateTo}
          granularity={granularity}
          mode={modes[0]}
          layers={layers}
        />
      </div>
    </div>
  );
}
