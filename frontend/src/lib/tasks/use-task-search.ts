import { useQuery } from "@tanstack/react-query";
import { searchTasks } from "./tasks-api";
import { tasksKeys } from "./tasks-keys";

export function useTaskSearch(projectId: string, query: string) {
  return useQuery({
    queryKey: tasksKeys.search(projectId, query),
    queryFn: () => searchTasks(projectId, query),
    enabled: !!projectId,
  });
}
