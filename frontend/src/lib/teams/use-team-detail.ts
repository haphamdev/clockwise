import { useQuery } from '@tanstack/react-query';
import { teamsKeys } from './teams-keys';
import { fetchTeamDetail } from './teams-api';

export function useTeamDetail(id: string) {
  return useQuery({
    queryKey: teamsKeys.detail(id),
    queryFn: () => fetchTeamDetail(id),
    enabled: !!id,
  });
}
