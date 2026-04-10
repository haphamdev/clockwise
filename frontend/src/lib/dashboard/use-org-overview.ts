import { useQuery } from '@tanstack/react-query';
import { dashboardKeys } from './dashboard-keys';
import { fetchOrgOverview } from './dashboard-api';

export function useOrgOverview(enabled: boolean) {
  return useQuery({
    queryKey: dashboardKeys.orgOverview(),
    queryFn: fetchOrgOverview,
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes — org overview changes infrequently
  });
}
