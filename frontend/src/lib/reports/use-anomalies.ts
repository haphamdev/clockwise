import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { fetchAnomalies } from "./reports-api";
import { reportsKeys } from "./reports-keys";
import type { AnomaliesParams } from "./types";

export function useAnomalies(params: AnomaliesParams) {
  return useQuery({
    queryKey: reportsKeys.anomalies(params),
    queryFn: () => fetchAnomalies(params),
    placeholderData: keepPreviousData,
    enabled: !!params.dateFrom && !!params.dateTo,
  });
}
