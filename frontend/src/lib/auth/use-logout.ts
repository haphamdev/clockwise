import { useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/query-client';
import { authKeys } from './auth-keys';
import { logoutUser } from './auth-api';

export function useLogout() {
  return useMutation({
    mutationFn: logoutUser,
    onSuccess: () => {
      queryClient.setQueryData(authKeys.user, null);
    },
  });
}
