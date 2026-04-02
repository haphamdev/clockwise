import { useQuery } from '@tanstack/react-query';
import { fetchImportJob } from './import-api';
import { importKeys } from './import-keys';

export function useImportJob(jobId: string | null) {
  return useQuery({
    queryKey: importKeys.job(jobId ?? ''),
    queryFn: () => fetchImportJob(jobId!),
    enabled: !!jobId,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === 'completed' || status === 'failed') return false;
      return 2000;
    },
  });
}
