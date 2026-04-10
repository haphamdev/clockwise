import { useQuery } from '@tanstack/react-query';
import { dashboardKeys } from './dashboard-keys';
import { fetchMySummary } from './dashboard-api';

export function useMySummary() {
  return useQuery({
    queryKey: dashboardKeys.mySummary(),
    queryFn: fetchMySummary,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}
