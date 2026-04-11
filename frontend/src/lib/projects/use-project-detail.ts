import { useQuery } from "@tanstack/react-query";
import { fetchProjectDetail } from "./projects-api";
import { projectsKeys } from "./projects-keys";

export function useProjectDetail(id: string) {
  return useQuery({
    queryKey: projectsKeys.detail(id),
    queryFn: () => fetchProjectDetail(id),
    enabled: !!id,
  });
}
