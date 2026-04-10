import { useSearchParams } from 'react-router-dom';
import { PageHeader } from '@/components/ui/page-header';
import { ImportWizard } from '@/components/import/import-wizard';
import { ImportHistory } from '@/components/import/import-history';
import { ImportTypeSelector } from '@/components/import/import-type-selector';
import { useAuth } from '@/lib/auth/use-auth';
import { IMPORT_TYPE_CONFIG, isValidImportType } from '@/lib/import/import-type-config';
import { useDocumentTitle } from '@/hooks/use-document-title';
import type { ImportType } from '@/lib/import/types';

export function ImportPage() {
  useDocumentTitle('Clockwise - Import');
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const isAdmin = user?.isAdmin ?? false;

  const rawType = searchParams.get('type');
  const resolvedType: ImportType | null =
    rawType && isValidImportType(rawType) && (!IMPORT_TYPE_CONFIG[rawType].adminOnly || isAdmin)
      ? rawType
      : isAdmin
        ? null
        : 'time-log';

  const config = resolvedType ? IMPORT_TYPE_CONFIG[resolvedType] : null;

  const handleTypeChange = (newType: ImportType) => {
    setSearchParams({ type: newType });
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title={config?.pageTitle ?? 'Import'}
        description={config?.pageDescription ?? 'Select an import type to get started.'}
      />
      {isAdmin && <ImportTypeSelector value={resolvedType} onChange={handleTypeChange} />}
      {resolvedType && <ImportWizard key={resolvedType} type={resolvedType} />}
      <ImportHistory type={resolvedType ?? undefined} />
    </div>
  );
}
