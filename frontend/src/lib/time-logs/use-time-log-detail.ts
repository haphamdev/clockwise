import { useQuery } from "@tanstack/react-query";
import { fetchTimeLog } from "./time-logs-api";
import { timeLogsKeys } from "./time-logs-keys";

export function useTimeLogDetail(id: string, enabled = true) {
  return useQuery({
    queryKey: timeLogsKeys.detail(id),
    queryFn: () => fetchTimeLog(id),
    enabled,
  });
}
