import { useQuery } from '@tanstack/react-query';
import { dashboardKeys } from './dashboard-keys';
import { fetchTeamBreakdown } from './dashboard-api';

export function useTeamBreakdown(enabled: boolean) {
  return useQuery({
    queryKey: dashboardKeys.teamBreakdown(),
    queryFn: fetchTeamBreakdown,
    enabled,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}
