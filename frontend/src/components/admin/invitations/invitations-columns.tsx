import { type ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Invitation } from '@/lib/invitations/types';

export function getInvitationsColumns(
  onResend: (invitation: Invitation) => void,
  onRevoke: (invitation: Invitation) => void,
): ColumnDef<Invitation>[] {
  return [
    {
      accessorKey: 'email',
      header: 'Email',
      cell: ({ row }) => (
        <span className="font-medium">{row.original.email}</span>
      ),
    },
    {
      id: 'teams',
      header: 'Teams & Roles',
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1">
          {row.original.teamAssignments.map((ta) => (
            <Badge key={ta.teamId} variant="outline" className="text-xs">
              {ta.teamName} ({ta.role})
            </Badge>
          ))}
        </div>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const inv = row.original;
        const statusLabel = inv.status === 'pending'
          ? (inv.isExpired ? 'deactivated' : 'pending')
          : inv.status === 'accepted'
            ? 'active'
            : 'deactivated';
        return (
          <div className="flex items-center gap-1.5">
            <StatusBadge status={statusLabel} />
            {inv.status === 'pending' && inv.isExpired && (
              <span className="text-xs text-muted-foreground">(expired)</span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'invitedByName',
      header: 'Invited By',
    },
    {
      accessorKey: 'createdAt',
      header: 'Date',
      cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString(),
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const inv = row.original;
        if (inv.status !== 'pending') return null;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onResend(inv)}>
                Resend
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onRevoke(inv)}>
                Revoke
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}
