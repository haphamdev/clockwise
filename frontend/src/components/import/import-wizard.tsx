import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Upload, Download, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ImportPreviewTable } from './import-preview-table';
import { useImportPreview } from '@/lib/import/use-import-preview';
import { useImportExecute } from '@/lib/import/use-import-execute';
import { useImportJob } from '@/lib/import/use-import-job';
import { downloadTemplate } from '@/lib/import/import-api';
import { importKeys } from '@/lib/import/import-keys';
import { IMPORT_TYPE_CONFIG } from '@/lib/import/import-type-config';
import { projectsKeys } from '@/lib/projects/projects-keys';
import { teamsKeys } from '@/lib/teams/teams-keys';
import { timeLogsKeys } from '@/lib/time-logs/time-logs-keys';
import { invitationsKeys } from '@/lib/invitations/invitations-keys';
import { auditLogsKeys } from '@/lib/audit-logs/audit-logs-keys';
import { useQueryClient } from '@tanstack/react-query';
import type { ImportType, ImportPreviewResponse } from '@/lib/import/types';

const IMPORT_INVALIDATION_KEYS: Record<ImportType, readonly (readonly string[])[]> = {
  'time-log': [timeLogsKeys.all, auditLogsKeys.all],
  team: [teamsKeys.all, auditLogsKeys.all],
  project: [projectsKeys.all, auditLogsKeys.all],
  invitation: [invitationsKeys.all, auditLogsKeys.all],
};

type Step = 'upload' | 'preview' | 'importing' | 'done';

interface ImportWizardProps {
  type: ImportType;
}

export function ImportWizard({ type }: ImportWizardProps) {
  const config = IMPORT_TYPE_CONFIG[type];
  const [step, setStep] = useState<Step>('upload');
  const [preview, setPreview] = useState<ImportPreviewResponse | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const queryClient = useQueryClient();
  const importPreview = useImportPreview();
  const importExecute = useImportExecute();
  const { data: jobData } = useImportJob(jobId);

  useEffect(() => {
    if (step === 'importing' && jobData && (jobData.status === 'completed' || jobData.status === 'failed')) {
      setStep('done');
      queryClient.invalidateQueries({ queryKey: importKeys.jobList(type) });
      if (jobData.status === 'completed') {
        for (const key of IMPORT_INVALIDATION_KEYS[type]) {
          queryClient.invalidateQueries({ queryKey: key });
        }
      }
    }
  }, [step, jobData, queryClient, type]);

  const reset = () => {
    queryClient.removeQueries({ queryKey: importKeys.jobs() });
    setStep('upload');
    setPreview(null);
    setJobId(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
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
      { type, csvContent },
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
      { type, previewToken: preview.previewToken },
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Upload CSV</CardTitle>
        <CardDescription>
          {step === 'upload' && config.uploadDescription}
          {step === 'preview' && 'Review the rows below, then confirm the import.'}
          {step === 'importing' && 'Your import is being processed...'}
          {step === 'done' && (jobData?.status === 'completed' ? 'Import complete.' : 'Import failed.')}
        </CardDescription>
      </CardHeader>

      <CardContent>
        {step === 'upload' && (
          <UploadStep
            fileInputRef={fileInputRef}
            onFileSelect={handleFileSelect}
            isPending={importPreview.isPending}
            error={error}
            type={type}
          />
        )}

        {step === 'preview' && preview && (
          <PreviewStep
            type={type}
            preview={preview}
            onExecute={handleExecute}
            onBack={reset}
            isPending={importExecute.isPending}
            error={error}
          />
        )}

        {step === 'importing' && (
          <ImportingStep
            importingText={config.importingText}
            totalRows={jobData?.totalRows ?? 0}
            imported={jobData?.imported ?? 0}
            errorCount={jobData?.errorCount ?? 0}
          />
        )}

        {step === 'done' && jobData && (
          <DoneStep
            status={jobData.status}
            imported={jobData.imported}
            totalRows={jobData.totalRows}
            errorCount={jobData.errors.length}
            onReset={reset}
            doneLink={config.doneLink}
            doneLinkLabel={config.doneLinkLabel}
          />
        )}
      </CardContent>
    </Card>
  );
}

function UploadStep({
  fileInputRef,
  onFileSelect,
  isPending,
  error,
  type,
}: {
  fileInputRef: React.MutableRefObject<HTMLInputElement | null>;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isPending: boolean;
  error: string | null;
  type: string;
}) {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await downloadTemplate(type);
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
      <div>
        <button
          type="button"
          onClick={handleDownload}
          disabled={downloading}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground disabled:opacity-50"
        >
          <Download className="mr-1.5 h-4 w-4" />
          {downloading ? 'Downloading...' : 'Download CSV template'}
        </button>
      </div>
    </div>
  );
}

function PreviewStep({
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

function ImportingStep({
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

function DoneStep({
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
