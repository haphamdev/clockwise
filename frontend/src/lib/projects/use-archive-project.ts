import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { queryClient } from '@/lib/query-client';
import { showErrorToast } from '@/lib/api-error-toast';
import { projectsKeys } from './projects-keys';
import { auditLogsKeys } from '@/lib/audit-logs/audit-logs-keys';
import { timeLogsKeys } from '@/lib/time-logs/time-logs-keys';
import { archiveProject } from './projects-api';

export function useArchiveProject() {
  return useMutation({
    mutationFn: archiveProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectsKeys.all });
      queryClient.invalidateQueries({ queryKey: auditLogsKeys.all });
      queryClient.invalidateQueries({ queryKey: timeLogsKeys.all });
      toast.success('Project archived');
    },
    onError: (err) => {
      showErrorToast(err, 'Failed to archive project');
    },
  });
}
