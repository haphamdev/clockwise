import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { queryClient } from '@/lib/query-client';
import { showErrorToast } from '@/lib/api-error-toast';
import { invitationsKeys } from './invitations-keys';
import { createInvitation } from './invitations-api';

export function useCreateInvitation() {
  return useMutation({
    mutationFn: createInvitation,
    onSuccess: () => {
      toast.success('Invitation sent');
    },
    onError: (err) => {
      showErrorToast(err, 'Failed to send invitation');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: invitationsKeys.lists() });
    },
  });
}
