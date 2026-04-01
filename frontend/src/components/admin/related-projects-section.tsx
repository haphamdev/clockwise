import { type ColumnDef } from '@tanstack/react-table';
import { Link } from 'react-router-dom';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { StatusBadge } from '@/components/ui/status-badge';
import { ServerDataTable } from '@/components/ui/server-data-table';
import type { Project } from '@/lib/projects/types';

const columns: ColumnDef<Project>[] = [
  {
    accessorKey: 'name',
    header: 'Name',
    cell: ({ row }) => (
      <Link to={`/projects/${row.original.id}`} className="font-medium hover:underline">
        {row.original.name}
      </Link>
    ),
  },
  {
    id: 'status',
    header: 'Status',
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
  },
];

interface RelatedProjectsSectionProps {
  data: Project[];
  total: number;
  page: number;
  totalPages: number;
  isLoading: boolean;
  onPageChange: (page: number) => void;
  showArchived: boolean;
  onShowArchivedChange: (value: boolean) => void;
}

export function RelatedProjectsSection({
  data,
  total,
  page,
  totalPages,
  isLoading,
  onPageChange,
  showArchived,
  onShowArchivedChange,
}: RelatedProjectsSectionProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Projects</h2>
        <div className="flex items-center gap-2">
          <Checkbox
            id="show-archived-projects"
            checked={showArchived}
            onCheckedChange={(v) => onShowArchivedChange(v === true)}
          />
          <Label htmlFor="show-archived-projects" className="text-sm">
            Show archived
          </Label>
        </div>
      </div>

      <ServerDataTable
        columns={columns}
        data={data}
        page={page}
        totalPages={totalPages}
        total={total}
        onPageChange={onPageChange}
        isLoading={isLoading}
      />
    </div>
  );
}
