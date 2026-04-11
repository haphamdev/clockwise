import { useQuery } from "@tanstack/react-query";
import { fetchTeamDetail } from "./teams-api";
import { teamsKeys } from "./teams-keys";

export function useTeamDetail(id: string) {
  return useQuery({
    queryKey: teamsKeys.detail(id),
    queryFn: () => fetchTeamDetail(id),
    enabled: !!id,
  });
}
