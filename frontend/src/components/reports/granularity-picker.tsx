import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GRANULARITY_OPTIONS } from '@/lib/reports/granularity-utils';
import type { ReportGranularity } from '@/lib/reports/types';

interface GranularityPickerProps {
  value: ReportGranularity;
  onChange: (value: ReportGranularity) => void;
}

export function GranularityPicker({ value, onChange }: GranularityPickerProps) {
  return (
    <Tabs value={value} onValueChange={(v) => onChange(v as ReportGranularity)}>
      <TabsList className="h-8">
        {GRANULARITY_OPTIONS.map((opt) => (
          <TabsTrigger key={opt.value} value={opt.value} className="px-3 py-1 text-xs">
            {opt.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
