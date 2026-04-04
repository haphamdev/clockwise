import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { reportsKeys } from './reports-keys';
import { fetchWeekdayDistribution } from './reports-api';
import type { WeekdayDistributionParams } from './types';

export function useWeekdayDistribution(params: WeekdayDistributionParams) {
  return useQuery({
    queryKey: reportsKeys.weekdayDistribution(params),
    queryFn: () => fetchWeekdayDistribution(params),
    placeholderData: keepPreviousData,
  });
}
