import { useQuery } from "@tanstack/react-query";
import { fetchUserProjects } from "./projects-api";
import { projectsKeys } from "./projects-keys";
import type { ListProjectsParams } from "./types";

export function useUserProjects(
  userId: string | undefined,
  params: ListProjectsParams = {},
) {
  return useQuery({
    queryKey: projectsKeys.userProjects(userId ?? "", params),
    queryFn: () => fetchUserProjects(userId ?? "", params),
    enabled: !!userId,
  });
}
