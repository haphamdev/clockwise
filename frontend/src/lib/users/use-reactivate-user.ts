import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { queryClient } from '@/lib/query-client';
import { showErrorToast } from '@/lib/api-error-toast';
import { usersKeys } from './users-keys';
import { auditLogsKeys } from '@/lib/audit-logs/audit-logs-keys';
import { timeLogsKeys } from '@/lib/time-logs/time-logs-keys';
import { reactivateUser } from './users-api';

export function useReactivateUser() {
  return useMutation({
    mutationFn: reactivateUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: usersKeys.all });
      queryClient.invalidateQueries({ queryKey: auditLogsKeys.all });
      queryClient.invalidateQueries({ queryKey: timeLogsKeys.all });
      toast.success('User reactivated');
    },
    onError: (err) => {
      showErrorToast(err, 'Failed to reactivate user');
    },
  });
}
