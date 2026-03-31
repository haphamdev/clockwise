import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { queryClient } from '@/lib/query-client';
import { showErrorToast } from '@/lib/api-error-toast';
import { teamsKeys } from './teams-keys';
import { auditLogsKeys } from '@/lib/audit-logs/audit-logs-keys';
import { createTeam } from './teams-api';

export function useCreateTeam() {
  return useMutation({
    mutationFn: createTeam,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: teamsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: auditLogsKeys.all });
      toast.success('Team created');
    },
    onError: (err) => {
      showErrorToast(err, 'Failed to create team');
    },
  });
}
