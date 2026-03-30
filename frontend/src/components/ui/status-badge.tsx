import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const statusConfig = {
  active: { label: 'Active', className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' },
  archived: { label: 'Archived', className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300' },
  pending: { label: 'Pending', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' },
  deactivated: { label: 'Deactivated', className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' },
  invited: { label: 'Invited', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' },
} as const;

export type Status = keyof typeof statusConfig;

export const STATUS_VALUES = Object.keys(statusConfig) as Status[];

interface StatusBadgeProps {
  status: Status;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];
  return (
    <Badge variant="outline" className={cn('border-0', config.className, className)}>
      {config.label}
    </Badge>
  );
}
