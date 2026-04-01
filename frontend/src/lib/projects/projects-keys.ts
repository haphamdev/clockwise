import type { ListProjectsParams } from './types';

export const projectsKeys = {
  all: ['projects'] as const,
  lists: () => [...projectsKeys.all, 'list'] as const,
  list: (params: ListProjectsParams) => [...projectsKeys.lists(), params] as const,
  details: () => [...projectsKeys.all, 'detail'] as const,
  detail: (id: string) => [...projectsKeys.details(), id] as const,
};
