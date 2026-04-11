import type { ListTimeLogsParams, WarningsPreviewParams } from "./types";

export const timeLogsKeys = {
  all: ["time-logs"] as const,
  lists: () => [...timeLogsKeys.all, "list"] as const,
  list: (params: ListTimeLogsParams) =>
    [...timeLogsKeys.lists(), params] as const,
  details: () => [...timeLogsKeys.all, "detail"] as const,
  detail: (id: string) => [...timeLogsKeys.details(), id] as const,
  warnings: (params: WarningsPreviewParams) =>
    [...timeLogsKeys.all, "warnings", params] as const,
  loggableUsers: () => [...timeLogsKeys.all, "loggable-users"] as const,
};
