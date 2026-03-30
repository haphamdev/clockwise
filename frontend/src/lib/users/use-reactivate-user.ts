import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { queryClient } from '@/lib/query-client';
import { ApiError } from '@/lib/api-client';
import { usersKeys } from './users-keys';
import { reactivateUser } from './users-api';

export function useReactivateUser() {
  return useMutation({
    mutationFn: reactivateUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: usersKeys.all });
      toast.success('User reactivated');
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : 'Failed to reactivate user');
    },
  });
}
