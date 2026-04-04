import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

export type ChartMode = 'stacked' | 'grouped';

interface ChartModeToggleProps {
  value: ChartMode;
  onChange: (value: ChartMode) => void;
}

export function ChartModeToggle({ value, onChange }: ChartModeToggleProps) {
  return (
    <Tabs value={value} onValueChange={(v) => onChange(v as ChartMode)}>
      <TabsList className="h-8">
        <TabsTrigger value="stacked" className="px-3 py-1 text-xs">
          Stacked
        </TabsTrigger>
        <TabsTrigger value="grouped" className="px-3 py-1 text-xs">
          Grouped
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
