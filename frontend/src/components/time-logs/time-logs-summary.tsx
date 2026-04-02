interface TimeLogsSummaryProps {
  totalHours: number;
  total: number;
}

export function TimeLogsSummary({ totalHours, total }: TimeLogsSummaryProps) {
  return (
    <div className="flex items-center gap-4 text-sm text-muted-foreground">
      <span>
        Total: <strong className="text-foreground">{totalHours.toFixed(2)}h</strong>
      </span>
      <span>{total} entries</span>
    </div>
  );
}
