import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { queryClient } from '@/lib/query-client';
import { ApiError } from '@/lib/api-client';
import { invitationsKeys } from './invitations-keys';
import { createInvitation } from './invitations-api';

export function useCreateInvitation() {
  return useMutation({
    mutationFn: createInvitation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invitationsKeys.lists() });
      toast.success('Invitation sent');
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : 'Failed to send invitation');
    },
  });
}
