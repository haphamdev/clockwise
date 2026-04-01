import { useQuery } from '@tanstack/react-query';
import { projectsKeys } from './projects-keys';
import { fetchProjects } from './projects-api';
import type { ListProjectsParams } from './types';

export function useProjects(params: ListProjectsParams = {}) {
  return useQuery({
    queryKey: projectsKeys.list(params),
    queryFn: () => fetchProjects(params),
  });
}
