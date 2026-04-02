import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { queryClient } from '@/lib/query-client';
import { showErrorToast } from '@/lib/api-error-toast';
import { timeLogsKeys } from './time-logs-keys';
import { auditLogsKeys } from '@/lib/audit-logs/audit-logs-keys';
import { tasksKeys } from '@/lib/tasks/tasks-keys';
import { createTimeLog } from './time-logs-api';
import type { CreateTimeLogPayload, TimeLogWithWarnings } from './types';

export function useCreateTimeLog() {
  return useMutation({
    mutationFn: (payload: CreateTimeLogPayload) => createTimeLog(payload),
    onSuccess: (data: TimeLogWithWarnings) => {
      queryClient.invalidateQueries({ queryKey: timeLogsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: auditLogsKeys.all });
      queryClient.invalidateQueries({ queryKey: tasksKeys.all });
      if (data.warnings.length > 0) {
        data.warnings.forEach((w) => toast.warning(w.message));
      } else {
        toast.success('Time logged');
      }
    },
    onError: (err) => {
      showErrorToast(err, 'Failed to log time');
    },
  });
}
