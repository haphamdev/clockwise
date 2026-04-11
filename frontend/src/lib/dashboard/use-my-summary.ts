import { useQuery } from "@tanstack/react-query";
import { fetchMySummary } from "./dashboard-api";
import { dashboardKeys } from "./dashboard-keys";

export function useMySummary() {
  return useQuery({
    queryKey: dashboardKeys.mySummary(),
    queryFn: fetchMySummary,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}
