import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { ServerDataTable } from "@/components/ui/server-data-table";
import { usePaginationParams } from "@/hooks/use-pagination-params";
import type { ImportJobListItem, ImportJobStatus } from "@/lib/import/types";
import { useImportJobs } from "@/lib/import/use-import-jobs";

interface ImportHistoryProps {
  type?: string;
}

const statusConfig: Record<
  ImportJobStatus,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
  }
> = {
  pending: { label: "Pending", variant: "outline" },
  processing: { label: "Processing", variant: "default" },
  completed: { label: "Completed", variant: "secondary" },
  failed: { label: "Failed", variant: "destructive" },
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const columns: ColumnDef<ImportJobListItem>[] = [
  {
    accessorKey: "createdAt",
    header: "Date",
    cell: ({ row }) => (
      <span className="text-sm">{formatDate(row.original.createdAt)}</span>
    ),
  },
  {
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => (
      <span className="text-sm capitalize">
        {row.original.type.replace(/-/g, " ")}
      </span>
    ),
  },
  {
    id: "status",
    header: "Status",
    cell: ({ row }) => {
      const config = statusConfig[row.original.status];
      return <Badge variant={config.variant}>{config.label}</Badge>;
    },
  },
  {
    accessorKey: "imported",
    header: () => <div className="text-right">Imported</div>,
    cell: ({ row }) => (
      <div className="text-right tabular-nums">
        {row.original.imported}/{row.original.totalRows}
      </div>
    ),
  },
  {
    accessorKey: "errorCount",
    header: () => <div className="text-right">Failed</div>,
    cell: ({ row }) => (
      <div className="text-right tabular-nums">
        {row.original.errorCount > 0 ? (
          <span className="text-destructive">{row.original.errorCount}</span>
        ) : (
          "0"
        )}
      </div>
    ),
  },
];

export function ImportHistory({ type }: ImportHistoryProps) {
  const { page, limit, setPage } = usePaginationParams({ defaultLimit: 10 });
  const { data, isLoading } = useImportJobs({ type, page, limit });

  const totalPages = data ? Math.ceil(data.total / data.limit) : 0;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Import History</h3>
        <p className="text-sm text-muted-foreground">
          Previous imports for your account.
        </p>
      </div>
      <ServerDataTable
        columns={columns}
        data={data?.data ?? []}
        page={page}
        totalPages={totalPages}
        total={data?.total ?? 0}
        onPageChange={setPage}
        isLoading={isLoading}
      />
    </div>
  );
}
