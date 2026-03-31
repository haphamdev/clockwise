import { useQuery } from '@tanstack/react-query';
import { auditLogsKeys } from './audit-logs-keys';
import { fetchAuditLogs } from './audit-logs-api';
import { AUDIT_LOG_PAGE_SIZE } from './constants';

export function useAuditLogs(entityType: string, entityId: string, page = 1, enabled = true) {
  return useQuery({
    queryKey: auditLogsKeys.list(entityType, entityId, page),
    queryFn: () => fetchAuditLogs({ entityType, entityId, page, limit: AUDIT_LOG_PAGE_SIZE }),
    enabled,
  });
}
