export const tasksKeys = {
  all: ["tasks"] as const,
  search: (projectId: string, query: string) =>
    [...tasksKeys.all, "search", projectId, query] as const,
};
