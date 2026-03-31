import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { queryClient } from '@/lib/query-client';
import { showErrorToast } from '@/lib/api-error-toast';
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
      showErrorToast(err, 'Failed to deactivate user');
    },
  });
}
