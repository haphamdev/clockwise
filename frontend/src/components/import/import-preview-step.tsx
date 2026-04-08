import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ImportPreviewTable } from './import-preview-table';
import type { ImportType, ImportPreviewResponse } from '@/lib/import/types';

function getMinutesRemaining(deadline: number): number {
  return Math.max(0, Math.ceil((deadline - Date.now()) / 60_000));
}

export function PreviewStep({
  type,
  preview,
  onExecute,
  onBack,
  isPending,
  error,
}: {
  type: ImportType;
  preview: ImportPreviewResponse;
  onExecute: () => void;
  onBack: () => void;
  isPending: boolean;
  error: string | null;
}) {
  const validCount = preview.validRows.length;
  const errorCount = preview.errors.length;

  const [deadline] = useState(() =>
    preview.expiresInSeconds ? Date.now() + preview.expiresInSeconds * 1000 : null,
  );

  const [minutesLeft, setMinutesLeft] = useState(() =>
    deadline ? getMinutesRemaining(deadline) : null,
  );

  useEffect(() => {
    if (!deadline) return;
    const interval = setInterval(() => {
      setMinutesLeft(getMinutesRemaining(deadline));
    }, 30_000);
    return () => clearInterval(interval);
  }, [deadline]);

  const isExpired = minutesLeft !== null && minutesLeft <= 0;

  if (isExpired) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertDescription>
            This preview has expired. Please go back and upload your file again.
          </AlertDescription>
        </Alert>
        <div className="flex justify-end">
          <Button variant="outline" onClick={onBack}>
            Start Over
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 text-sm">
        <span className="text-green-600 dark:text-green-400">
          {validCount} valid {validCount === 1 ? 'row' : 'rows'}
        </span>
        {errorCount > 0 && (
          <span className="text-destructive">
            {errorCount} {errorCount === 1 ? 'error' : 'errors'}
          </span>
        )}
        <span className="text-muted-foreground">{preview.totalRows} total</span>
        {minutesLeft !== null && (
          <span className="ml-auto text-muted-foreground">
            Expires in {minutesLeft} {minutesLeft === 1 ? 'minute' : 'minutes'}
          </span>
        )}
      </div>
      <ImportPreviewTable type={type} validRows={preview.validRows} errors={preview.errors} />
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onBack} disabled={isPending}>
          Back
        </Button>
        <Button onClick={onExecute} disabled={isPending || validCount === 0}>
          {isPending ? (
            <>
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              Starting...
            </>
          ) : (
            `Import ${validCount} ${validCount === 1 ? 'row' : 'rows'}`
          )}
        </Button>
      </div>
    </div>
  );
}
