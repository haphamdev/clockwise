import type { AuditLogEntry } from './types';

export function formatAuditAction(entry: AuditLogEntry): string {
  const { action, metadata, entityType } = entry;
  const after = metadata.after as Record<string, string> | undefined;
  const before = metadata.before as Record<string, string> | undefined;

  switch (action) {
    case 'created':
      if (entityType === 'team') return `Created team "${after?.name}"`;
      if (entityType === 'user') return `Invited ${after?.email}`;
      return 'Created';

    case 'updated':
      return formatUpdatedFields(before, after);

    case 'archived':
      return 'Archived';

    case 'unarchived':
      return 'Unarchived';

    case 'activated':
      return `Activated as "${after?.name}"`;

    case 'deactivated':
      return 'Deactivated';

    case 'reactivated':
      return 'Reactivated';

    case 'admin_granted':
      return 'Granted admin privileges';

    case 'admin_revoked':
      return 'Revoked admin privileges';

    case 'member_added':
      if (entityType === 'team') return `Added ${after?.userName} as ${after?.role}`;
      return `Added to team "${after?.teamName}" as ${after?.role}`;

    case 'member_removed':
      if (entityType === 'team') return `Removed ${before?.userName}`;
      return `Removed from team "${before?.teamName}"`;

    case 'role_changed':
      if (entityType === 'team') {
        return `Changed ${after?.userName}'s role from ${before?.role} to ${after?.role}`;
      }
      return `Role changed in "${after?.teamName}" from ${before?.role} to ${after?.role}`;

    default:
      return action.replace(/_/g, ' ');
  }
}

function formatUpdatedFields(
  before?: Record<string, string>,
  after?: Record<string, string>,
): string {
  if (!after) return 'Updated';
  const fields = Object.keys(after);
  if (fields.length === 1 && fields[0] === 'name') {
    return `Renamed from "${before?.name}" to "${after.name}"`;
  }
  return `Updated ${fields.join(', ')}`;
}
