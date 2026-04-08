import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ImportPreviewTable } from './import-preview-table';
import type { ImportType, ImportPreviewResponse } from '@/lib/import/types';

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

  return (
    <div className="space-y-4">
      <div className="flex gap-4 text-sm">
        <span className="text-green-600 dark:text-green-400">
          {validCount} valid {validCount === 1 ? 'row' : 'rows'}
        </span>
        {errorCount > 0 && (
          <span className="text-destructive">
            {errorCount} {errorCount === 1 ? 'error' : 'errors'}
          </span>
        )}
        <span className="text-muted-foreground">{preview.totalRows} total</span>
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
