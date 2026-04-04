import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { reportsKeys } from './reports-keys';
import { fetchLoggingDelay } from './reports-api';
import type { LoggingDelayParams } from './types';

export function useLoggingDelay(params: LoggingDelayParams) {
  return useQuery({
    queryKey: reportsKeys.loggingDelay(params),
    queryFn: () => fetchLoggingDelay(params),
    placeholderData: keepPreviousData,
  });
}
