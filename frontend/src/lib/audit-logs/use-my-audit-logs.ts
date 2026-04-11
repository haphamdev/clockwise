import { useInfiniteQuery } from "@tanstack/react-query";
import { fetchMyAuditLogs } from "./audit-logs-api";
import { auditLogsKeys } from "./audit-logs-keys";
import { AUDIT_LOG_PAGE_SIZE } from "./constants";

export function useMyAuditLogs(enabled = true) {
  return useInfiniteQuery({
    queryKey: auditLogsKeys.me(),
    queryFn: ({ pageParam }) =>
      fetchMyAuditLogs({ page: pageParam, limit: AUDIT_LOG_PAGE_SIZE }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.page * AUDIT_LOG_PAGE_SIZE < lastPage.total
        ? lastPage.page + 1
        : undefined,
    enabled,
  });
}
