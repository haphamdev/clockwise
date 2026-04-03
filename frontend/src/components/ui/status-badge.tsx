import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const statusConfig = {
  active: { label: 'Active', className: 'bg-success text-primary-foreground' },
  accepted: { label: 'Accepted', className: 'bg-success text-primary-foreground' },
  archived: { label: 'Archived', className: 'bg-danger text-primary-foreground' },
  pending: { label: 'Pending', className: 'bg-warning text-primary-foreground' },
  deactivated: { label: 'Deactivated', className: 'bg-danger text-primary-foreground' },
  invited: { label: 'Invited', className: 'bg-info text-primary-foreground' },
  revoked: { label: 'Revoked', className: 'bg-danger text-primary-foreground' },
  failed: { label: 'Failed', className: 'bg-danger text-primary-foreground' },
  expired: { label: 'Expired', className: 'bg-muted text-muted-foreground' },
} as const;

export type Status = keyof typeof statusConfig;

export const STATUS_VALUES = Object.keys(statusConfig) as Status[];

interface StatusBadgeProps {
  status: Status;
  className?: string;
}

const fallback = { label: 'Unknown', className: 'bg-muted text-muted-foreground' } as const;

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] ?? fallback;
  return (
    <Badge variant="outline" className={cn(config.className, className)}>
      {config.label}
    </Badge>
  );
}
