import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useImportJobs } from '@/lib/import/use-import-jobs';
import type { ImportJobStatus } from '@/lib/import/types';

interface ImportHistoryProps {
  type: string;
}

const statusConfig: Record<ImportJobStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending: { label: 'Pending', variant: 'outline' },
  processing: { label: 'Processing', variant: 'default' },
  completed: { label: 'Completed', variant: 'secondary' },
  failed: { label: 'Failed', variant: 'destructive' },
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function ImportHistory({ type }: ImportHistoryProps) {
  const { data, isLoading } = useImportJobs({ type, limit: 20 });

  const jobs = data?.data ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Import History</CardTitle>
        <CardDescription>Previous imports for your account.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : jobs.length === 0 ? (
          <p className="text-sm text-muted-foreground">No previous imports.</p>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Imported</TableHead>
                  <TableHead className="text-right">Failed</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobs.map((job) => {
                  const config = statusConfig[job.status];
                  return (
                    <TableRow key={job.id}>
                      <TableCell className="text-sm">
                        {formatDate(job.createdAt)}
                      </TableCell>
                      <TableCell className="text-sm capitalize">
                        {job.type.replace(/-/g, ' ')}
                      </TableCell>
                      <TableCell>
                        <Badge variant={config.variant}>{config.label}</Badge>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {job.imported}/{job.totalRows}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {job.errorCount > 0 ? (
                          <span className="text-destructive">{job.errorCount}</span>
                        ) : (
                          '0'
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
