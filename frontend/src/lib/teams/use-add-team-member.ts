import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { queryClient } from '@/lib/query-client';
import { ApiError } from '@/lib/api-client';
import { teamsKeys } from './teams-keys';
import { addTeamMember } from './teams-api';
import type { AddTeamMemberPayload } from './types';

export function useAddTeamMember() {
  return useMutation({
    mutationFn: ({ teamId, payload }: { teamId: string; payload: AddTeamMemberPayload }) =>
      addTeamMember(teamId, payload),
    onSuccess: (_, { teamId }) => {
      queryClient.invalidateQueries({ queryKey: teamsKeys.detail(teamId) });
      queryClient.invalidateQueries({ queryKey: teamsKeys.lists() });
      toast.success('Member added');
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : 'Failed to add member');
    },
  });
}
