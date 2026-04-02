import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { queryClient } from '@/lib/query-client';
import { showErrorToast } from '@/lib/api-error-toast';
import { timeLogsKeys } from './time-logs-keys';
import { auditLogsKeys } from '@/lib/audit-logs/audit-logs-keys';
import { unarchiveTimeLog } from './time-logs-api';

export function useUnarchiveTimeLog() {
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      unarchiveTimeLog(id, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: timeLogsKeys.all });
      queryClient.invalidateQueries({ queryKey: auditLogsKeys.all });
      toast.success('Time log unarchived');
    },
    onError: (err) => {
      showErrorToast(err, 'Failed to unarchive time log');
    },
  });
}
