import { useQuery } from '@tanstack/react-query';
import { usersKeys } from './users-keys';
import { fetchUsers } from './users-api';
import type { ListUsersParams } from './types';

export function useUsers(params: ListUsersParams = {}) {
  return useQuery({
    queryKey: usersKeys.list(params),
    queryFn: () => fetchUsers(params),
  });
}
