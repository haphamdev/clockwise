import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { queryClient } from '@/lib/query-client';
import { ApiError } from '@/lib/api-client';
import { teamsKeys } from './teams-keys';
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
      toast.success('Member role updated');
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : 'Failed to update member');
    },
  });
}
