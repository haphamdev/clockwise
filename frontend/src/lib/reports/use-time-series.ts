import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { fetchTimeSeries } from "./reports-api";
import { reportsKeys } from "./reports-keys";
import type { TimeSeriesParams } from "./types";

export function useTimeSeries(params: TimeSeriesParams) {
  return useQuery({
    queryKey: reportsKeys.timeSeries(params),
    queryFn: () => fetchTimeSeries(params),
    placeholderData: keepPreviousData,
  });
}
