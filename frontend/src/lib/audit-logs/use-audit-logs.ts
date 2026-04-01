import { useInfiniteQuery } from '@tanstack/react-query';
import { auditLogsKeys } from './audit-logs-keys';
import { fetchAuditLogs } from './audit-logs-api';
import { AUDIT_LOG_PAGE_SIZE } from './constants';

export function useAuditLogs(entityType: string, entityId: string, enabled = true) {
  return useInfiniteQuery({
    queryKey: auditLogsKeys.list(entityType, entityId),
    queryFn: ({ pageParam }) =>
      fetchAuditLogs({ entityType, entityId, page: pageParam, limit: AUDIT_LOG_PAGE_SIZE }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.page * AUDIT_LOG_PAGE_SIZE < lastPage.total ? lastPage.page + 1 : undefined,
    enabled,
  });
}
