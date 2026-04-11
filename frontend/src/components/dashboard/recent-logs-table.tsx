import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TimeDisplay } from "@/components/ui/time-display";
import type { RecentLog } from "@/lib/dashboard/types";

interface RecentLogsTableProps {
  logs: RecentLog[] | undefined;
  isLoading: boolean;
  isError: boolean;
}

export function RecentLogsTable({
  logs,
  isLoading,
  isError,
}: RecentLogsTableProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Recent Logs</CardTitle>
      </CardHeader>
      <CardContent>
        {isError ? (
          <p className="text-sm text-destructive">
            Failed to load recent logs.
          </p>
        ) : isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        ) : !logs || logs.length === 0 ? (
          <p className="text-sm text-muted-foreground">No recent logs</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Tasks</TableHead>
                <TableHead className="text-right">Hours</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    <TimeDisplay
                      value={log.date}
                      absolute
                      className="text-muted-foreground"
                    />
                  </TableCell>
                  <TableCell>{log.projectName}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {log.taskLabels.length > 0
                      ? log.taskLabels.join(", ")
                      : "--"}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {log.hours}h
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
