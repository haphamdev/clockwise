import { type ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { StatusBadge, type Status } from '@/components/ui/status-badge';
import type { User } from '@/lib/users/types';

export function getUsersColumns(
  onView: (user: User) => void,
  onNavigate: (user: User) => void,
): ColumnDef<User>[] {
  return [
    {
      id: 'user',
      header: 'User',
      cell: ({ row }) => {
        const user = row.original;
        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user.avatarUrl ?? undefined} alt={user.name} />
              <AvatarFallback className="text-xs">
                {user.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <button
                type="button"
                className="text-sm font-medium hover:underline text-left"
                onClick={() => onView(user)}
              >
                {user.name}
              </button>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.status as Status} />,
    },
    {
      id: 'admin',
      header: 'Role',
      cell: ({ row }) =>
        row.original.isAdmin ? (
          <Badge variant="outline">Admin</Badge>
        ) : null,
    },
    {
      id: 'teams',
      header: 'Teams',
      cell: ({ row }) => {
        const teams = row.original.teamMemberships;
        if (teams.length === 0) return <span className="text-muted-foreground">None</span>;
        return (
          <span className="text-sm">
            {teams.map((t) => t.teamName).join(', ')}
          </span>
        );
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onNavigate(row.original)}>
              View Details
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];
}
