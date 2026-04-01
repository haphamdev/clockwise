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
import type { Project } from '@/lib/projects/types';

interface ProjectColumnActions {
  onEdit: (project: Project) => void;
  onArchive: (project: Project) => void;
  onUnarchive: (project: Project) => void;
  canEdit: boolean;
  canArchive: boolean;
}

export function getProjectsColumns(actions: ProjectColumnActions): ColumnDef<Project>[] {
  return [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => (
        <Link
          to={`/projects/${row.original.id}`}
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
          {row.original.description || '\u2014'}
        </span>
      ),
    },
    {
      accessorKey: 'teamCount',
      header: 'Teams',
    },
    {
      id: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const project = row.original;
        const hasActions =
          (project.status === 'archived' && actions.canArchive) ||
          (project.status !== 'archived' && (actions.canEdit || actions.canArchive));
        if (!hasActions) return null;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {project.status === 'archived' ? (
                actions.canArchive && (
                  <DropdownMenuItem onClick={() => actions.onUnarchive(project)}>
                    Unarchive
                  </DropdownMenuItem>
                )
              ) : (
                <>
                  {actions.canEdit && (
                    <DropdownMenuItem onClick={() => actions.onEdit(project)}>
                      Edit
                    </DropdownMenuItem>
                  )}
                  {actions.canArchive && (
                    <DropdownMenuItem onClick={() => actions.onArchive(project)}>
                      Archive
                    </DropdownMenuItem>
                  )}
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}
