export const auditLogsKeys = {
  all: ['audit-logs'] as const,
  list: (entityType: string, entityId: string) =>
    [...auditLogsKeys.all, entityType, entityId] as const,
  me: () => [...auditLogsKeys.all, 'me'] as const,
};
