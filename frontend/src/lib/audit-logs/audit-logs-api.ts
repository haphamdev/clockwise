import { apiClient } from "@/lib/api-client";
import type { PaginatedResponse } from "@/lib/types";
import type { AuditLogEntry, AuditLogQueryParams } from "./types";

export function fetchAuditLogs(params: AuditLogQueryParams) {
  const searchParams = new URLSearchParams({
    entityType: params.entityType,
    entityId: params.entityId,
  });
  if (params.page) searchParams.set("page", String(params.page));
  if (params.limit) searchParams.set("limit", String(params.limit));
  return apiClient<PaginatedResponse<AuditLogEntry>>(
    `/audit-logs?${searchParams}`,
  );
}

export function fetchMyAuditLogs(params: { page?: number; limit?: number }) {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set("page", String(params.page));
  if (params.limit) searchParams.set("limit", String(params.limit));
  const qs = searchParams.toString();
  return apiClient<PaginatedResponse<AuditLogEntry>>(
    `/audit-logs/me${qs ? `?${qs}` : ""}`,
  );
}
