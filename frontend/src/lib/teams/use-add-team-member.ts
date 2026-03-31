import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { queryClient } from '@/lib/query-client';
import { showErrorToast } from '@/lib/api-error-toast';
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
      showErrorToast(err, 'Failed to add member');
    },
  });
}
