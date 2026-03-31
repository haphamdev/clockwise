export const auditLogsKeys = {
  all: ['audit-logs'] as const,
  list: (entityType: string, entityId: string, page: number) =>
    [...auditLogsKeys.all, entityType, entityId, page] as const,
  me: (page: number) => [...auditLogsKeys.all, 'me', page] as const,
};
