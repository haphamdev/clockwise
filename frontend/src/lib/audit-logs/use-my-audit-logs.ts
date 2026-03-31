import { useQuery } from '@tanstack/react-query';
import { auditLogsKeys } from './audit-logs-keys';
import { fetchMyAuditLogs } from './audit-logs-api';
import { AUDIT_LOG_PAGE_SIZE } from './constants';

export function useMyAuditLogs(page = 1, enabled = true) {
  return useQuery({
    queryKey: auditLogsKeys.me(page),
    queryFn: () => fetchMyAuditLogs({ page, limit: AUDIT_LOG_PAGE_SIZE }),
    enabled,
  });
}
