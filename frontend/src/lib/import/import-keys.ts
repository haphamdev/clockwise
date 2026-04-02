export const importKeys = {
  all: ['import'] as const,
  jobs: () => [...importKeys.all, 'job'] as const,
  job: (jobId: string) => [...importKeys.jobs(), jobId] as const,
};
