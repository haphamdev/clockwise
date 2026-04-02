export interface AuditLogPerformer {
  id: string;
  name: string;
}

export interface AuditLogMetadata {
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface AuditLogEntity {
  id: string;
  orgId: string;
  entityType: string;
  entityId: string;
  action: string;
  performedBy: AuditLogPerformer;
  metadata: AuditLogMetadata;
  reason: string | null;
  createdAt: Date;
}
