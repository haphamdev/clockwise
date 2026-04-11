import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { fetchDelayHeatmap } from "./reports-api";
import { reportsKeys } from "./reports-keys";
import type { DelayHeatmapParams } from "./types";

export function useDelayHeatmap(params: DelayHeatmapParams) {
  return useQuery({
    queryKey: reportsKeys.delayHeatmap(params),
    queryFn: () => fetchDelayHeatmap(params),
    placeholderData: keepPreviousData,
    enabled: !!params.dateFrom && !!params.dateTo,
  });
}
