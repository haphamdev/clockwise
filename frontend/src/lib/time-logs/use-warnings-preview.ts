import { useQuery } from "@tanstack/react-query";
import { fetchWarningsPreview } from "./time-logs-api";
import { timeLogsKeys } from "./time-logs-keys";
import type { WarningsPreviewParams } from "./types";

export function useWarningsPreview(params: WarningsPreviewParams) {
  return useQuery({
    queryKey: timeLogsKeys.warnings(params),
    queryFn: () => fetchWarningsPreview(params),
    enabled: !!params.date,
    staleTime: 10_000,
  });
}
