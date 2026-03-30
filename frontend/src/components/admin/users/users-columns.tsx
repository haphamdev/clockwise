import { type ColumnDef } from '@tanstack/react-table';
import { Eye } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StatusBadge, type Status } from '@/components/ui/status-badge';
import type { User } from '@/lib/users/types';

export function getUsersColumns(
  onView: (user: User) => void,
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
              <p className="text-sm font-medium">{user.name}</p>
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
        <Button variant="ghost" size="sm" onClick={() => onView(row.original)}>
          <Eye className="mr-1.5 h-3.5 w-3.5" />
          View
        </Button>
      ),
    },
  ];
}
