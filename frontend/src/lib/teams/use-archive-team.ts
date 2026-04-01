import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { queryClient } from '@/lib/query-client';
import { showErrorToast } from '@/lib/api-error-toast';
import { teamsKeys } from './teams-keys';
import { auditLogsKeys } from '@/lib/audit-logs/audit-logs-keys';
import { projectsKeys } from '@/lib/projects/projects-keys';
import { archiveTeam } from './teams-api';

export function useArchiveTeam() {
  return useMutation({
    mutationFn: archiveTeam,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: teamsKeys.all });
      queryClient.invalidateQueries({ queryKey: projectsKeys.all });
      queryClient.invalidateQueries({ queryKey: auditLogsKeys.all });
      toast.success('Team archived');
    },
    onError: (err) => {
      showErrorToast(err, 'Failed to archive team');
    },
  });
}
