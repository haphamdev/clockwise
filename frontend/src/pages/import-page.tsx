import { useSearchParams } from 'react-router-dom';
import { PageHeader } from '@/components/ui/page-header';
import { ImportWizard } from '@/components/import/import-wizard';
import { ImportHistory } from '@/components/import/import-history';
import { ImportTypeSelector } from '@/components/import/import-type-selector';
import { useAuth } from '@/lib/auth/use-auth';
import { IMPORT_TYPE_CONFIG, isValidImportType } from '@/lib/import/import-type-config';
import type { ImportType } from '@/lib/import/types';

export function ImportPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const isAdmin = user?.isAdmin ?? false;

  const rawType = searchParams.get('type') || 'time-log';
  const type: ImportType =
    isValidImportType(rawType) && (!IMPORT_TYPE_CONFIG[rawType].adminOnly || isAdmin)
      ? rawType
      : 'time-log';

  const config = IMPORT_TYPE_CONFIG[type];

  const handleTypeChange = (newType: ImportType) => {
    setSearchParams({ type: newType });
  };

  return (
    <div className="space-y-8">
      <PageHeader title={config.pageTitle} description={config.pageDescription} />
      {isAdmin && <ImportTypeSelector value={type} onChange={handleTypeChange} />}
      <ImportWizard key={type} type={type} />
      <ImportHistory type={type} />
    </div>
  );
}
