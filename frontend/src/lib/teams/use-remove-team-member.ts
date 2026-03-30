import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { queryClient } from '@/lib/query-client';
import { ApiError } from '@/lib/api-client';
import { teamsKeys } from './teams-keys';
import { usersKeys } from '@/lib/users/users-keys';
import { removeTeamMember } from './teams-api';

export function useRemoveTeamMember() {
  return useMutation({
    mutationFn: ({ teamId, userId }: { teamId: string; userId: string }) =>
      removeTeamMember(teamId, userId),
    onSuccess: (_, { teamId }) => {
      queryClient.invalidateQueries({ queryKey: teamsKeys.detail(teamId) });
      queryClient.invalidateQueries({ queryKey: teamsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: usersKeys.all });
      toast.success('Member removed');
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : 'Failed to remove member');
    },
  });
}
