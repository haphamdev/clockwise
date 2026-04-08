import { Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

export function ImportingStep({
  importingText,
  totalRows,
  imported,
  errorCount,
}: {
  importingText: string;
  totalRows: number;
  imported: number;
  errorCount: number;
}) {
  const processed = imported + errorCount;
  const percent = totalRows > 0 ? Math.round((processed / totalRows) * 100) : 0;

  return (
    <div className="flex flex-col items-center gap-4 py-8">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
      <div className="w-full max-w-xs space-y-2">
        <Progress value={percent} />
        <div className="text-center">
          <p className="font-medium">{importingText}</p>
          <p className="text-sm text-muted-foreground">
            {processed} of {totalRows} processed
            {processed > 0 && ` — ${imported} imported`}
            {errorCount > 0 && `, ${errorCount} failed`}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Please don't close this page.
          </p>
        </div>
      </div>
    </div>
  );
}
