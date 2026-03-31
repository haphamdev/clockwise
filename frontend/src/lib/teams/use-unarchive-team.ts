import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { queryClient } from '@/lib/query-client';
import { showErrorToast } from '@/lib/api-error-toast';
import { teamsKeys } from './teams-keys';
import { auditLogsKeys } from '@/lib/audit-logs/audit-logs-keys';
import { unarchiveTeam } from './teams-api';

export function useUnarchiveTeam() {
  return useMutation({
    mutationFn: unarchiveTeam,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: teamsKeys.all });
      queryClient.invalidateQueries({ queryKey: auditLogsKeys.all });
      toast.success('Team unarchived');
    },
    onError: (err) => {
      showErrorToast(err, 'Failed to unarchive team');
    },
  });
}
