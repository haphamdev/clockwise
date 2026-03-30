import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { queryClient } from '@/lib/query-client';
import { ApiError } from '@/lib/api-client';
import { teamsKeys } from './teams-keys';
import { createTeam } from './teams-api';

export function useCreateTeam() {
  return useMutation({
    mutationFn: createTeam,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: teamsKeys.lists() });
      toast.success('Team created');
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : 'Failed to create team');
    },
  });
}
