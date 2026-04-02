import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { queryClient } from '@/lib/query-client';
import { showErrorToast } from '@/lib/api-error-toast';
import { timeLogsKeys } from './time-logs-keys';
import { auditLogsKeys } from '@/lib/audit-logs/audit-logs-keys';
import { archiveTimeLog } from './time-logs-api';

export function useArchiveTimeLog() {
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      archiveTimeLog(id, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: timeLogsKeys.all });
      queryClient.invalidateQueries({ queryKey: auditLogsKeys.all });
      toast.success('Time log archived');
    },
    onError: (err) => {
      showErrorToast(err, 'Failed to archive time log');
    },
  });
}
