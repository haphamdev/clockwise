import { useQuery } from "@tanstack/react-query";
import { fetchTeams } from "./teams-api";
import { teamsKeys } from "./teams-keys";
import type { ListTeamsParams } from "./types";

export function useTeams(params: ListTeamsParams = {}) {
  return useQuery({
    queryKey: teamsKeys.list(params),
    queryFn: () => fetchTeams(params),
  });
}
