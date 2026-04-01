import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { queryClient } from '@/lib/query-client';
import { showErrorToast } from '@/lib/api-error-toast';
import { teamsKeys } from './teams-keys';
import { auditLogsKeys } from '@/lib/audit-logs/audit-logs-keys';
import { usersKeys } from '@/lib/users/users-keys';
import { updateTeamMember } from './teams-api';
import type { UpdateTeamMemberPayload } from './types';

export function useUpdateTeamMember() {
  return useMutation({
    mutationFn: ({
      teamId,
      userId,
      payload,
    }: {
      teamId: string;
      userId: string;
      payload: UpdateTeamMemberPayload;
    }) => updateTeamMember(teamId, userId, payload),
    onSuccess: (_, { teamId }) => {
      queryClient.invalidateQueries({ queryKey: teamsKeys.detail(teamId) });
      queryClient.invalidateQueries({ queryKey: auditLogsKeys.all });
      queryClient.invalidateQueries({ queryKey: usersKeys.all });
      toast.success('Member role updated');
    },
    onError: (err) => {
      showErrorToast(err, 'Failed to update member');
    },
  });
}
