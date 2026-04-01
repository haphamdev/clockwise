import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { queryClient } from '@/lib/query-client';
import { showErrorToast } from '@/lib/api-error-toast';
import { invitationsKeys } from './invitations-keys';
import { resendInvitation } from './invitations-api';

export function useResendInvitation() {
  return useMutation({
    mutationFn: resendInvitation,
    onSuccess: () => {
      toast.success('Invitation resent');
    },
    onError: (err) => {
      showErrorToast(err, 'Failed to resend invitation');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: invitationsKeys.lists() });
    },
  });
}
