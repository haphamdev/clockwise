import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { AnomalyEntry } from "@/lib/reports/types";

const PAGE_SIZE = 10;

interface AnomalyListProps {
  entries: AnomalyEntry[];
  thresholds: { warningHigh: number; criticalHigh: number };
}

export function AnomalyList({ entries, thresholds }: AnomalyListProps) {
  const [page, setPage] = useState(0);

  // biome-ignore lint/correctness/useExhaustiveDependencies: reset page when entries change
  useEffect(() => setPage(0), [entries]);

  if (entries.length === 0) return null;

  const pageCount = Math.ceil(entries.length / PAGE_SIZE);
  const pageEntries = entries.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <div className="space-y-2">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Date</TableHead>
            <TableHead className="text-right">Hours</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pageEntries.map((e) => (
            <TableRow key={`${e.userId}-${e.date}`}>
              <TableCell>{e.userName}</TableCell>
              <TableCell>{e.date}</TableCell>
              <TableCell
                className={`text-right font-medium ${
                  e.severity === "critical" ? "text-red-500" : "text-amber-500"
                }`}
              >
                {e.totalHours}h
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {pageCount > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {page + 1} of {pageCount}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p - 1)}
              disabled={page === 0}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= pageCount - 1}
            >
              Next
            </Button>
          </div>
        </div>
      )}
      <p className="text-xs text-muted-foreground">
        Thresholds:{" "}
        <span className="text-amber-500">
          Warning &ge; {thresholds.warningHigh}h
        </span>
        {" · "}
        <span className="text-red-500">
          Critical &ge; {thresholds.criticalHigh}h
        </span>
      </p>
    </div>
  );
}
