import type { PaginationParams } from '@/lib/types';

export interface AuditLogPerformer {
  id: string;
  name: string;
}

export interface AuditLogMetadata {
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface AuditLogEntry {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  performedBy: AuditLogPerformer;
  metadata: AuditLogMetadata;
  reason: string | null;
  createdAt: string;
}

export interface AuditLogQueryParams extends PaginationParams {
  entityType: string;
  entityId: string;
}
