import type { ListTeamsParams } from "./types";

export const teamsKeys = {
  all: ["teams"] as const,
  lists: () => [...teamsKeys.all, "list"] as const,
  list: (params: ListTeamsParams) => [...teamsKeys.lists(), params] as const,
  details: () => [...teamsKeys.all, "detail"] as const,
  detail: (id: string) => [...teamsKeys.details(), id] as const,
};
