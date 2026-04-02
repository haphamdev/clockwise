import { useState, useRef, useEffect } from 'react';
import { Upload, Download, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ImportPreviewTable } from './import-preview-table';
import { useImportPreview } from '@/lib/import/use-import-preview';
import { useImportExecute } from '@/lib/import/use-import-execute';
import { useImportJob } from '@/lib/import/use-import-job';
import { downloadTemplate } from '@/lib/import/import-api';
import type { ImportPreviewResponse } from '@/lib/import/types';
import { useQueryClient } from '@tanstack/react-query';
import { timeLogsKeys } from '@/lib/time-logs/time-logs-keys';
import { importKeys } from '@/lib/import/import-keys';

type Step = 'upload' | 'preview' | 'importing' | 'done';

interface ImportCsvDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ImportCsvDialog({ open, onOpenChange }: ImportCsvDialogProps) {
  const [step, setStep] = useState<Step>('upload');
  const [preview, setPreview] = useState<ImportPreviewResponse | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const queryClient = useQueryClient();
  const importPreview = useImportPreview();
  const importExecute = useImportExecute();
  const { data: jobData } = useImportJob(step === 'importing' ? jobId : null);

  // Transition to done when job completes or fails
  useEffect(() => {
    if (step === 'importing' && jobData && (jobData.status === 'completed' || jobData.status === 'failed')) {
      setStep('done');
    }
  }, [step, jobData]);

  const reset = () => {
    // Clean up job polling query cache (#5)
    queryClient.removeQueries({ queryKey: importKeys.jobs() });
    setStep('upload');
    setPreview(null);
    setJobId(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleOpenChange = (nextOpen: boolean) => {
    // Prevent closing during import (#4)
    if (!nextOpen && step === 'importing') return;
    if (!nextOpen) reset();
    onOpenChange(nextOpen);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input so re-selecting the same file triggers onChange (#2)
    if (fileInputRef.current) fileInputRef.current.value = '';

    setError(null);

    if (!file.name.endsWith('.csv')) {
      setError('Please select a CSV file.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('File is too large. Maximum size is 5MB.');
      return;
    }

    const csvContent = await file.text();
    importPreview.mutate(
      { type: 'time-log', csvContent },
      {
        onSuccess: (data) => {
          setPreview(data);
          setStep('preview');
        },
        onError: (err) => {
          setError(err instanceof Error ? err.message : 'Failed to parse CSV file.');
        },
      },
    );
  };

  const handleExecute = () => {
    if (!preview?.previewToken) return;
    importExecute.mutate(
      { type: 'time-log', previewToken: preview.previewToken },
      {
        onSuccess: (data) => {
          setJobId(data.jobId);
          setStep('importing');
        },
        onError: (err) => {
          setError(err instanceof Error ? err.message : 'Failed to start import.');
        },
      },
    );
  };

  const handleDone = () => {
    queryClient.invalidateQueries({ queryKey: timeLogsKeys.all });
    handleOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="max-w-2xl"
        // Prevent closing during import via overlay click or Escape (#4)
        onInteractOutside={step === 'importing' ? (e) => e.preventDefault() : undefined}
        onEscapeKeyDown={step === 'importing' ? (e) => e.preventDefault() : undefined}
      >
        <DialogHeader>
          <DialogTitle>Import Time Logs</DialogTitle>
          <DialogDescription>
            Upload a CSV file to bulk import time log entries.
          </DialogDescription>
        </DialogHeader>

        {step === 'upload' && (
          <UploadStep
            fileInputRef={fileInputRef}
            onFileSelect={handleFileSelect}
            isPending={importPreview.isPending}
            error={error}
          />
        )}

        {step === 'preview' && preview && (
          <PreviewStep
            preview={preview}
            onExecute={handleExecute}
            onBack={reset}
            isPending={importExecute.isPending}
            error={error}
          />
        )}

        {step === 'importing' && (
          <ImportingStep />
        )}

        {step === 'done' && jobData && (
          <DoneStep
            status={jobData.status}
            imported={jobData.imported}
            totalRows={jobData.totalRows}
            errorCount={jobData.errors.length}
            onDone={handleDone}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function UploadStep({
  fileInputRef,
  onFileSelect,
  isPending,
  error,
}: {
  fileInputRef: React.MutableRefObject<HTMLInputElement | null>;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isPending: boolean;
  error: string | null;
}) {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await downloadTemplate('time-log');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center gap-4 rounded-lg border-2 border-dashed p-8">
        <Upload className="h-8 w-8 text-muted-foreground" />
        <div className="text-center">
          <p className="text-sm font-medium">Select a CSV file to upload</p>
          <p className="text-xs text-muted-foreground">Maximum file size: 5MB</p>
        </div>
        <input
          ref={(el) => { fileInputRef.current = el; }}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={onFileSelect}
          disabled={isPending}
        />
        <Button
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={isPending}
        >
          {isPending ? (
            <>
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              Parsing...
            </>
          ) : (
            'Choose File'
          )}
        </Button>
      </div>
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <DialogFooter>
        <button
          type="button"
          onClick={handleDownload}
          disabled={downloading}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground disabled:opacity-50"
        >
          <Download className="mr-1.5 h-4 w-4" />
          {downloading ? 'Downloading...' : 'Download CSV template'}
        </button>
      </DialogFooter>
    </div>
  );
}

function PreviewStep({
  preview,
  onExecute,
  onBack,
  isPending,
  error,
}: {
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
        <span className="text-muted-foreground">
          {preview.totalRows} total
        </span>
      </div>
      <ImportPreviewTable
        validRows={preview.validRows}
        errors={preview.errors}
      />
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <DialogFooter>
        <Button variant="outline" onClick={onBack} disabled={isPending}>
          Back
        </Button>
        <Button
          onClick={onExecute}
          disabled={isPending || validCount === 0}
        >
          {isPending ? (
            <>
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              Starting...
            </>
          ) : (
            `Import ${validCount} ${validCount === 1 ? 'row' : 'rows'}`
          )}
        </Button>
      </DialogFooter>
    </div>
  );
}

function ImportingStep() {
  return (
    <div className="flex flex-col items-center gap-4 py-8">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
      <div className="text-center">
        <p className="font-medium">Importing time logs...</p>
        <p className="text-sm text-muted-foreground">
          This may take a moment. Please don't close this dialog.
        </p>
      </div>
    </div>
  );
}

function DoneStep({
  status,
  imported,
  totalRows,
  errorCount,
  onDone,
}: {
  status: string;
  imported: number;
  totalRows: number;
  errorCount: number;
  onDone: () => void;
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
      <DialogFooter>
        <Button onClick={onDone}>Done</Button>
      </DialogFooter>
    </div>
  );
}
