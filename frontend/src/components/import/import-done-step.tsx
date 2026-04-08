import { Link } from 'react-router-dom';
import { CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function DoneStep({
  status,
  imported,
  totalRows,
  errorCount,
  onReset,
  doneLink,
  doneLinkLabel,
}: {
  status: string;
  imported: number;
  totalRows: number;
  errorCount: number;
  onReset: () => void;
  doneLink: string;
  doneLinkLabel: string;
}) {
  const isSuccess = status === 'completed';

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center gap-4 py-6">
        {isSuccess ? (
          <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
        ) : (
          <XCircle className="h-10 w-10 text-destructive" />
        )}
        <div className="text-center">
          <p className="font-medium">
            {isSuccess ? 'Import complete' : 'Import failed'}
          </p>
          <p className="text-sm text-muted-foreground">
            {isSuccess
              ? `${imported} of ${totalRows} rows imported successfully.`
              : 'An error occurred during import.'}
          </p>
          {isSuccess && errorCount > 0 && (
            <p className="text-sm text-destructive">
              {errorCount} {errorCount === 1 ? 'row' : 'rows'} failed to import.
            </p>
          )}
        </div>
      </div>
      <div className="flex justify-center gap-3">
        <Button variant="outline" asChild>
          <Link to={doneLink}>{doneLinkLabel}</Link>
        </Button>
        <Button onClick={onReset}>Import Another</Button>
      </div>
    </div>
  );
}
