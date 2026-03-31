import { type ColumnDef } from '@tanstack/react-table';
import { Link } from 'react-router-dom';
import { MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Team } from '@/lib/teams/types';

export function getTeamsColumns(
  onEdit: (team: Team) => void,
  onArchive: (team: Team) => void,
  onUnarchive: (team: Team) => void,
): ColumnDef<Team>[] {
  return [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => (
        <Link
          to={`/admin/teams/${row.original.id}`}
          className="font-medium hover:underline"
        >
          {row.original.name}
        </Link>
      ),
    },
    {
      accessorKey: 'description',
      header: 'Description',
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {row.original.description || '—'}
        </span>
      ),
    },
    {
      accessorKey: 'memberCount',
      header: 'Members',
    },
    {
      id: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <StatusBadge status={row.original.isArchived ? 'archived' : 'active'} />
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const team = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {team.isArchived ? (
                <DropdownMenuItem onClick={() => onUnarchive(team)}>
                  Unarchive
                </DropdownMenuItem>
              ) : (
                <>
                  <DropdownMenuItem onClick={() => onEdit(team)}>
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onArchive(team)}>
                    Archive
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}
