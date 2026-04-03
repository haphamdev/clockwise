import { useQuery } from '@tanstack/react-query';
import { fetchImportJobs } from './import-api';
import { importKeys } from './import-keys';

export function useImportJobs(params: { type?: string; page?: number; limit?: number }) {
  return useQuery({
    queryKey: importKeys.jobList(params.type),
    queryFn: () => fetchImportJobs(params),
    refetchInterval: (query) => {
      const jobs = query.state.data?.data;
      if (!jobs) return false;
      const hasActive = jobs.some((j) => j.status === 'pending' || j.status === 'processing');
      return hasActive ? 5000 : false;
    },
  });
}
