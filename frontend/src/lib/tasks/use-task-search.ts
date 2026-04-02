import { useQuery } from '@tanstack/react-query';
import { tasksKeys } from './tasks-keys';
import { searchTasks } from './tasks-api';

export function useTaskSearch(projectId: string, query: string) {
  return useQuery({
    queryKey: tasksKeys.search(projectId, query),
    queryFn: () => searchTasks(projectId, query),
    enabled: !!projectId,
  });
}
