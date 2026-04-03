import { Link } from 'react-router-dom';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { StatusBadge } from '@/components/ui/status-badge';
import { cn } from '@/lib/utils';

interface UserLinkProps {
  id: string;
  name: string;
  email?: string;
  status?: string;
}

export function UserLink({ id, name, email, status }: UserLinkProps) {
  const isDeactivated = status === 'deactivated';
  const hasTooltip = !!email || isDeactivated;

  const link = (
    <Link
      to={`/admin/users/${id}`}
      className={cn(
        'text-sm font-medium hover:underline',
        isDeactivated && 'line-through text-muted-foreground',
      )}
    >
      {name}
    </Link>
  );

  if (!hasTooltip) return link;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{link}</TooltipTrigger>
        <TooltipContent>
          <div className="flex flex-col items-start gap-1">
            {email && <span>{email}</span>}
            {isDeactivated && <StatusBadge status="deactivated" />}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
