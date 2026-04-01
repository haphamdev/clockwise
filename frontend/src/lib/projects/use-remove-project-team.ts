import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { queryClient } from '@/lib/query-client';
import { showErrorToast } from '@/lib/api-error-toast';
import { projectsKeys } from './projects-keys';
import { auditLogsKeys } from '@/lib/audit-logs/audit-logs-keys';
import { removeProjectTeam } from './projects-api';

export function useRemoveProjectTeam() {
  return useMutation({
    mutationFn: ({ projectId, teamId }: { projectId: string; teamId: string }) =>
      removeProjectTeam(projectId, teamId),
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: projectsKeys.detail(projectId) });
      queryClient.invalidateQueries({ queryKey: projectsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: auditLogsKeys.all });
      toast.success('Team removed from project');
    },
    onError: (err) => {
      showErrorToast(err, 'Failed to remove team');
    },
  });
}
