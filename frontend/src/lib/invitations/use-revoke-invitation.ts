import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { queryClient } from '@/lib/query-client';
import { ApiError } from '@/lib/api-client';
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
      toast.error(err instanceof ApiError ? err.message : 'Failed to revoke invitation');
    },
  });
}
