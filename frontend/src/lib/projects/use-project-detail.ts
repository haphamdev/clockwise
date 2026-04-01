import { useQuery } from '@tanstack/react-query';
import { projectsKeys } from './projects-keys';
import { fetchProjectDetail } from './projects-api';

export function useProjectDetail(id: string) {
  return useQuery({
    queryKey: projectsKeys.detail(id),
    queryFn: () => fetchProjectDetail(id),
    enabled: !!id,
  });
}
