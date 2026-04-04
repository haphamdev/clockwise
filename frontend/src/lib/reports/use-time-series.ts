import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { reportsKeys } from './reports-keys';
import { fetchTimeSeries } from './reports-api';
import type { TimeSeriesParams } from './types';

export function useTimeSeries(params: TimeSeriesParams) {
  return useQuery({
    queryKey: reportsKeys.timeSeries(params),
    queryFn: () => fetchTimeSeries(params),
    placeholderData: keepPreviousData,
  });
}
