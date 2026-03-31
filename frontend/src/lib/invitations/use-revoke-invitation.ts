import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { queryClient } from '@/lib/query-client';
import { showErrorToast } from '@/lib/api-error-toast';
import { invitationsKeys } from './invitations-keys';
import { revokeInvitation } from './invitations-api';

export function useRevokeInvitation() {
  return useMutation({
    mutationFn: revokeInvitation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invitationsKeys.lists() });
      toast.success('Invitation revoked');
    },
    onError: (err) => {
      showErrorToast(err, 'Failed to revoke invitation');
    },
  });
}
