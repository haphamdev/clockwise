export const importKeys = {
  all: ['import'] as const,
  jobs: () => [...importKeys.all, 'job'] as const,
  job: (jobId: string) => [...importKeys.jobs(), jobId] as const,
  jobLists: () => [...importKeys.all, 'jobList'] as const,
  jobList: (params?: { type?: string; page?: number; limit?: number }) =>
    [...importKeys.all, 'jobList', params] as const,
};
