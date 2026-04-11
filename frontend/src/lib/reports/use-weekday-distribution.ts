import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { fetchWeekdayDistribution } from "./reports-api";
import { reportsKeys } from "./reports-keys";
import type { WeekdayDistributionParams } from "./types";

export function useWeekdayDistribution(params: WeekdayDistributionParams) {
  return useQuery({
    queryKey: reportsKeys.weekdayDistribution(params),
    queryFn: () => fetchWeekdayDistribution(params),
    placeholderData: keepPreviousData,
  });
}
