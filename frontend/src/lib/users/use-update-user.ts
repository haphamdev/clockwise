import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { queryClient } from '@/lib/query-client';
import { showErrorToast } from '@/lib/api-error-toast';
import { usersKeys } from './users-keys';
import { teamsKeys } from '@/lib/teams/teams-keys';
import { updateUser } from './users-api';
import type { UpdateUserPayload } from './types';

export function useUpdateUser() {
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateUserPayload }) =>
      updateUser(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: usersKeys.all });
      queryClient.invalidateQueries({ queryKey: teamsKeys.all });
      toast.success('User updated');
    },
    onError: (err) => {
      showErrorToast(err, 'Failed to update user');
    },
  });
}
