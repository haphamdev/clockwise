import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { queryClient } from '@/lib/query-client';
import { showErrorToast } from '@/lib/api-error-toast';
import { projectsKeys } from './projects-keys';
import { auditLogsKeys } from '@/lib/audit-logs/audit-logs-keys';
import { unarchiveProject } from './projects-api';

export function useUnarchiveProject() {
  return useMutation({
    mutationFn: unarchiveProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectsKeys.all });
      queryClient.invalidateQueries({ queryKey: auditLogsKeys.all });
      toast.success('Project unarchived');
    },
    onError: (err) => {
      showErrorToast(err, 'Failed to unarchive project');
    },
  });
}
