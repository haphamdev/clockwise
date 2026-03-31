import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { queryClient } from '@/lib/query-client';
import { showErrorToast } from '@/lib/api-error-toast';
import { teamsKeys } from './teams-keys';
import { unarchiveTeam } from './teams-api';

export function useUnarchiveTeam() {
  return useMutation({
    mutationFn: unarchiveTeam,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: teamsKeys.all });
      toast.success('Team unarchived');
    },
    onError: (err) => {
      showErrorToast(err, 'Failed to unarchive team');
    },
  });
}
