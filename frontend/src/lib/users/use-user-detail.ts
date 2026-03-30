import { useQuery } from '@tanstack/react-query';
import { usersKeys } from './users-keys';
import { fetchUserDetail } from './users-api';

export function useUserDetail(id: string | null) {
  return useQuery({
    queryKey: usersKeys.detail(id!),
    queryFn: () => fetchUserDetail(id!),
    enabled: !!id,
  });
}
