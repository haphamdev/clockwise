import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { reportsKeys } from './reports-keys';
import { fetchReportSummary } from './reports-api';
import type { SummaryParams } from './types';

export function useReportSummary(params: SummaryParams) {
  return useQuery({
    queryKey: reportsKeys.summary(params),
    queryFn: () => fetchReportSummary(params),
    placeholderData: keepPreviousData,
  });
}
