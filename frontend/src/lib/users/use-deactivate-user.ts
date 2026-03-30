import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { queryClient } from '@/lib/query-client';
import { ApiError } from '@/lib/api-client';
import { usersKeys } from './users-keys';
import { deactivateUser } from './users-api';

export function useDeactivateUser() {
  return useMutation({
    mutationFn: deactivateUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: usersKeys.all });
      toast.success('User deactivated');
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : 'Failed to deactivate user');
    },
  });
}
