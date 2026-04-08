import { PageHeader } from '@/components/ui/page-header';
import { ReportsFilterBar } from '@/components/reports/reports-filter-bar';
import { useDocumentTitle } from '@/hooks/use-document-title';
import type { TimeWindow } from '@/lib/dates/time-window-utils';
import type { ReportGranularity } from '@/lib/reports/types';

interface ReportPageShellProps {
  title: string;
  description: string;
  dateFrom: string;
  dateTo: string;
  granularity: ReportGranularity;
  onTimeWindowChange: (window: TimeWindow) => void;
  onGranularityChange: (value: ReportGranularity) => void;
  children: React.ReactNode;
}

export function ReportPageShell({
  title,
  description,
  dateFrom,
  dateTo,
  granularity,
  onTimeWindowChange,
  onGranularityChange,
  children,
}: ReportPageShellProps) {
  useDocumentTitle(`Clockwise - ${title}`);

  return (
    <div className="space-y-4">
      <PageHeader title={title} description={description} />

      <div className="sticky top-14 z-30 -mx-4 bg-background/80 px-4 py-2 backdrop-blur-sm sm:-mx-6 sm:px-6">
        <ReportsFilterBar
          dateFrom={dateFrom}
          dateTo={dateTo}
          granularity={granularity}
          onTimeWindowChange={onTimeWindowChange}
          onGranularityChange={onGranularityChange}
        />
      </div>

      {children}
    </div>
  );
}
