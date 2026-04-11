import { useQuery } from "@tanstack/react-query";
import { fetchOrgOverview } from "./dashboard-api";
import { dashboardKeys } from "./dashboard-keys";

export function useOrgOverview(enabled: boolean) {
  return useQuery({
    queryKey: dashboardKeys.orgOverview(),
    queryFn: fetchOrgOverview,
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes — org overview changes infrequently
  });
}
