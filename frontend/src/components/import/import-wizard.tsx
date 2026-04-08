import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useImportPreview } from '@/lib/import/use-import-preview';
import { useImportExecute } from '@/lib/import/use-import-execute';
import { useImportJob } from '@/lib/import/use-import-job';
import { importKeys } from '@/lib/import/import-keys';
import { IMPORT_TYPE_CONFIG } from '@/lib/import/import-type-config';
import { projectsKeys } from '@/lib/projects/projects-keys';
import { teamsKeys } from '@/lib/teams/teams-keys';
import { timeLogsKeys } from '@/lib/time-logs/time-logs-keys';
import { invitationsKeys } from '@/lib/invitations/invitations-keys';
import { auditLogsKeys } from '@/lib/audit-logs/audit-logs-keys';
import { UploadStep } from './import-upload-step';
import { PreviewStep } from './import-preview-step';
import { ImportingStep } from './import-importing-step';
import { DoneStep } from './import-done-step';
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

  const queryClient = useQueryClient();
  const importPreview = useImportPreview();
  const importExecute = useImportExecute();
  const { data: jobData } = useImportJob(jobId);

  useEffect(() => {
    if (step === 'importing' && jobData && (jobData.status === 'completed' || jobData.status === 'failed')) {
      setStep('done');
      queryClient.invalidateQueries({ queryKey: importKeys.jobLists() });
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
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
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
