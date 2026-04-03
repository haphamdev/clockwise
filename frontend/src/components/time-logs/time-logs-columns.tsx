import { type ColumnDef } from '@tanstack/react-table';
import { Loader2, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { TaskDisplay } from '@/components/ui/task-display';
import { TimeDisplay } from '@/components/ui/time-display';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { TimeLog } from '@/lib/time-logs/types';

interface TimeLogColumnActions {
  onView: (timeLog: TimeLog) => void;
  onEdit: (timeLog: TimeLog) => void;
  onArchive: (timeLog: TimeLog) => void;
  onUnarchive: (timeLog: TimeLog) => void;
  showUser: boolean;
  actionPendingId?: string;
}

export function getTimeLogsColumns(actions: TimeLogColumnActions): ColumnDef<TimeLog>[] {
  const columns: ColumnDef<TimeLog>[] = [
    {
      accessorKey: 'date',
      header: 'Date',
      cell: ({ row }) => <TimeDisplay value={row.original.date} mode="date" />,
    },
    {
      accessorKey: 'project',
      header: 'Project',
      cell: ({ row }) => (
        <span className="font-medium">{row.original.project.name}</span>
      ),
    },
    {
      id: 'tasks',
      header: 'Tasks',
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1">
          {row.original.tasks.map((t) => (
            <TaskDisplay key={t.id} task={t} />
          ))}
        </div>
      ),
    },
    {
      accessorKey: 'hours',
      header: 'Hours',
      cell: ({ row }) => (
        <span className="font-mono">{row.original.hours}h</span>
      ),
    },
    {
      accessorKey: 'notes',
      header: 'Notes',
      cell: ({ row }) => (
        <span className="text-muted-foreground line-clamp-1 max-w-[200px]">
          {row.original.notes || '\u2014'}
        </span>
      ),
    },
  ];

  if (actions.showUser) {
    columns.push({
      id: 'user',
      header: 'User',
      cell: ({ row }) => row.original.user.name,
    });
  }

  columns.push(
    {
      id: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const timeLog = row.original;
        if (actions.actionPendingId === timeLog.id) {
          return (
            <div className="flex h-8 w-8 items-center justify-center">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
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
              <DropdownMenuItem onClick={() => actions.onView(timeLog)}>
                View Details
              </DropdownMenuItem>
              {timeLog.status === 'active' && (
                <>
                  <DropdownMenuItem onClick={() => actions.onEdit(timeLog)}>
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => actions.onArchive(timeLog)}>
                    Archive
                  </DropdownMenuItem>
                </>
              )}
              {timeLog.status === 'archived' && (
                <DropdownMenuItem onClick={() => actions.onUnarchive(timeLog)}>
                  Unarchive
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  );

  return columns;
}
