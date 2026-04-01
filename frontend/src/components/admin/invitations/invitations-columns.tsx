import { type ColumnDef } from '@tanstack/react-table';
import { Loader2, MoreHorizontal } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { TimeDisplay } from '@/components/ui/time-display';
import type { Invitation } from '@/lib/invitations/types';

export function getInvitationsColumns(
  onResend: (invitation: Invitation) => void,
  onRevoke: (invitation: Invitation) => void,
  onEditTeams: (invitation: Invitation) => void,
  resendingId?: string,
  revokingId?: string,
): ColumnDef<Invitation>[] {
  return [
    {
      accessorKey: 'email',
      header: 'Email',
      cell: ({ row }) => <span className="font-medium">{row.original.email}</span>,
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
        const statusLabel =
          inv.status === 'pending'
            ? inv.isExpired
              ? 'expired'
              : 'pending'
            : inv.status === 'accepted'
              ? 'accepted'
              : inv.status === 'failed'
                ? 'failed'
                : 'revoked';
        return <StatusBadge status={statusLabel} />;
      },
    },
    {
      accessorKey: 'invitedByName',
      header: 'Invited By',
    },
    {
      accessorKey: 'createdAt',
      header: 'Date',
      cell: ({ row }) => <TimeDisplay value={row.original.createdAt} />,
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const inv = row.original;
        if (resendingId === inv.id || revokingId === inv.id) {
          return (
            <div className="flex h-8 w-8 items-center justify-center">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          );
        }
        if (inv.status === 'failed') {
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onResend(inv)}>Resend</DropdownMenuItem>
                <DropdownMenuItem onClick={() => onRevoke(inv)}>Revoke</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        }
        if (inv.status !== 'pending') return null;
        if (inv.isExpired) {
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEditTeams(inv)}>Edit Teams</DropdownMenuItem>
                <DropdownMenuItem onClick={() => onResend(inv)}>Resend</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        }
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEditTeams(inv)}>Edit Teams</DropdownMenuItem>
              <DropdownMenuItem onClick={() => onResend(inv)}>Resend</DropdownMenuItem>
              <DropdownMenuItem onClick={() => onRevoke(inv)}>Revoke</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}
