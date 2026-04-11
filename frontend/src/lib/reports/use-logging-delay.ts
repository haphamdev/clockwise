import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { fetchLoggingDelay } from "./reports-api";
import { reportsKeys } from "./reports-keys";
import type { LoggingDelayParams } from "./types";

export function useLoggingDelay(params: LoggingDelayParams) {
  return useQuery({
    queryKey: reportsKeys.loggingDelay(params),
    queryFn: () => fetchLoggingDelay(params),
    placeholderData: keepPreviousData,
  });
}
