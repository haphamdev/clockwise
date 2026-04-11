import { useQuery } from "@tanstack/react-query";
import { fetchLoggableUsers } from "./time-logs-api";
import { timeLogsKeys } from "./time-logs-keys";

export function useLoggableUsers(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: timeLogsKeys.loggableUsers(),
    queryFn: fetchLoggableUsers,
    enabled: options?.enabled,
    staleTime: 5 * 60 * 1000,
  });
}
