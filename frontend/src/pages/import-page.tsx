import { useSearchParams } from 'react-router-dom';
import { PageHeader } from '@/components/ui/page-header';
import { ImportWizard } from '@/components/import/import-wizard';
import { ImportHistory } from '@/components/import/import-history';

export function ImportPage() {
  const type = useSearchParams()[0].get('type') || 'time-log';

  return (
    <div className="space-y-8">
      <PageHeader
        title="Import Time Logs"
        description="Upload a CSV file to bulk import time log entries."
      />
      <ImportWizard type={type} />
      <ImportHistory type={type} />
    </div>
  );
}
