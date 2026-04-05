import { Label } from '@/components/ui/label';
import { FilterBar } from '@/components/ui/filter-bar';
import { TimeWindowPicker } from '@/components/ui/time-window-picker';
import { GranularityPicker } from './granularity-picker';
import type { TimeWindow } from '@/lib/dates/time-window-utils';
import type { ReportGranularity } from '@/lib/reports/types';

interface ReportsFilterBarProps {
  dateFrom: string;
  dateTo: string;
  granularity: ReportGranularity;
  onTimeWindowChange: (window: TimeWindow) => void;
  onGranularityChange: (value: ReportGranularity) => void;
}

export function ReportsFilterBar({
  dateFrom,
  dateTo,
  granularity,
  onTimeWindowChange,
  onGranularityChange,
}: ReportsFilterBarProps) {
  return (
    <FilterBar>
      <div className="flex flex-col gap-1">
        <Label className="text-xs">Date range</Label>
        <TimeWindowPicker
          value={{ dateFrom, dateTo }}
          onChange={onTimeWindowChange}
        />
      </div>
      <div className="flex flex-col gap-1">
        <Label className="text-xs">Granularity</Label>
        <GranularityPicker value={granularity} onChange={onGranularityChange} />
      </div>
    </FilterBar>
  );
}
