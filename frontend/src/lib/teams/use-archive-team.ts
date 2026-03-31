import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { queryClient } from '@/lib/query-client';
import { showErrorToast } from '@/lib/api-error-toast';
import { teamsKeys } from './teams-keys';
import { archiveTeam } from './teams-api';

export function useArchiveTeam() {
  return useMutation({
    mutationFn: archiveTeam,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: teamsKeys.all });
      toast.success('Team archived');
    },
    onError: (err) => {
      showErrorToast(err, 'Failed to archive team');
    },
  });
}
