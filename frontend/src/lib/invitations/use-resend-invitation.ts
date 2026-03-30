import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { queryClient } from '@/lib/query-client';
import { ApiError } from '@/lib/api-client';
import { invitationsKeys } from './invitations-keys';
import { resendInvitation } from './invitations-api';

export function useResendInvitation() {
  return useMutation({
    mutationFn: resendInvitation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invitationsKeys.lists() });
      toast.success('Invitation resent');
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : 'Failed to resend invitation');
    },
  });
}
