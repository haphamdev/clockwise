import type { ListTimeLogsParams } from './types';

export const timeLogsKeys = {
  all: ['time-logs'] as const,
  lists: () => [...timeLogsKeys.all, 'list'] as const,
  list: (params: ListTimeLogsParams) => [...timeLogsKeys.lists(), params] as const,
  details: () => [...timeLogsKeys.all, 'detail'] as const,
  detail: (id: string) => [...timeLogsKeys.details(), id] as const,
};
