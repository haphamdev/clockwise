import { useQuery } from '@tanstack/react-query';
import { timeLogsKeys } from './time-logs-keys';
import { fetchTimeLog } from './time-logs-api';

export function useTimeLogDetail(id: string, enabled = true) {
  return useQuery({
    queryKey: timeLogsKeys.detail(id),
    queryFn: () => fetchTimeLog(id),
    enabled,
  });
}
