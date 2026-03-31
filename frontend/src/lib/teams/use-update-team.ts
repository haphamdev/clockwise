import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { queryClient } from '@/lib/query-client';
import { showErrorToast } from '@/lib/api-error-toast';
import { teamsKeys } from './teams-keys';
import { updateTeam } from './teams-api';
import type { UpdateTeamPayload } from './types';

export function useUpdateTeam() {
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateTeamPayload }) =>
      updateTeam(id, payload),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: teamsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: teamsKeys.detail(id) });
      toast.success('Team updated');
    },
    onError: (err) => {
      showErrorToast(err, 'Failed to update team');
    },
  });
}
