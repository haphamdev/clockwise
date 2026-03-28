import { useQuery } from '@tanstack/react-query';
import { authKeys } from './auth-keys';
import { fetchCurrentUser } from './auth-api';

export function useUser() {
  return useQuery({
    queryKey: authKeys.user,
    queryFn: fetchCurrentUser,
  });
}
