import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { queryClient } from '@/lib/query-client';
import { ApiError } from '@/lib/api-client';
import { orgKeys } from './org-keys';
import { updateOrgSettings } from './org-api';

export function useUpdateOrgSettings() {
  return useMutation({
    mutationFn: updateOrgSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orgKeys.settings() });
      toast.success('Settings updated');
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : 'Failed to update settings');
    },
  });
}
