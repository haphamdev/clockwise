import { useQuery } from "@tanstack/react-query";
import { fetchTimeLogs } from "./time-logs-api";
import { timeLogsKeys } from "./time-logs-keys";
import type { ListTimeLogsParams } from "./types";

export function useTimeLogs(params: ListTimeLogsParams = {}) {
  return useQuery({
    queryKey: timeLogsKeys.list(params),
    queryFn: () => fetchTimeLogs(params),
  });
}
