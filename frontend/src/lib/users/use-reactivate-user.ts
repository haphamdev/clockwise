import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { queryClient } from '@/lib/query-client';
import { showErrorToast } from '@/lib/api-error-toast';
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
      showErrorToast(err, 'Failed to reactivate user');
    },
  });
}
