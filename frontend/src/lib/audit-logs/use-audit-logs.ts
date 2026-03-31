import { useQuery } from '@tanstack/react-query';
import { auditLogsKeys } from './audit-logs-keys';
import { fetchAuditLogs } from './audit-logs-api';

export function useAuditLogs(entityType: string, entityId: string, page = 1) {
  return useQuery({
    queryKey: auditLogsKeys.list(entityType, entityId, page),
    queryFn: () => fetchAuditLogs({ entityType, entityId, page, limit: 20 }),
  });
}
