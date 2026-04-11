import { useCallback, useMemo } from "react";
import {
  defaultTimeWindow,
  type TimeWindow,
} from "@/lib/dates/time-window-utils";
import { autoGranularity } from "@/lib/reports/granularity-utils";
import {
  codeToGranularity,
  granularityToCode,
} from "@/lib/reports/report-param-utils";
import type { ReportGranularity } from "@/lib/reports/types";

interface UseReportDateRangeInput {
  getParam: (key: string) => string;
  setParam: (key: string, value: string) => void;
  setParams: (entries: Record<string, string>) => void;
}

export function useReportDateRange({
  getParam,
  setParam,
  setParams,
}: UseReportDateRangeInput) {
  const defaults = useMemo(() => defaultTimeWindow(), []);
  const dateFrom = getParam("dateFrom") || defaults.dateFrom;
  const dateTo = getParam("dateTo") || defaults.dateTo;

  const granParam = getParam("gran");
  const granularity: ReportGranularity =
    codeToGranularity(granParam) ?? autoGranularity(dateFrom, dateTo);

  const onTimeWindowChange = useCallback(
    (w: TimeWindow) =>
      setParams({ dateFrom: w.dateFrom, dateTo: w.dateTo, gran: "" }),
    [setParams],
  );

  const onGranularityChange = useCallback(
    (g: ReportGranularity) => setParam("gran", granularityToCode(g)),
    [setParam],
  );

  return {
    dateFrom,
    dateTo,
    granularity,
    onTimeWindowChange,
    onGranularityChange,
  };
}
