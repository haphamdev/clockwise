import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { reportsKeys } from './reports-keys';
import { fetchDelayHeatmap } from './reports-api';
import type { DelayHeatmapParams } from './types';

export function useDelayHeatmap(params: DelayHeatmapParams) {
  return useQuery({
    queryKey: reportsKeys.delayHeatmap(params),
    queryFn: () => fetchDelayHeatmap(params),
    placeholderData: keepPreviousData,
    enabled: !!params.dateFrom && !!params.dateTo,
  });
}
