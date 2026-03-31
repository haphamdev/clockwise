export const auditLogsKeys = {
  all: ['audit-logs'] as const,
  list: (entityType: string, entityId: string, page: number) =>
    [...auditLogsKeys.all, entityType, entityId, page] as const,
};
