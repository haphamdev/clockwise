import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { fetchReportSummary } from "./reports-api";
import { reportsKeys } from "./reports-keys";
import type { SummaryParams } from "./types";

export function useReportSummary(params: SummaryParams) {
  return useQuery({
    queryKey: reportsKeys.summary(params),
    queryFn: () => fetchReportSummary(params),
    placeholderData: keepPreviousData,
  });
}
