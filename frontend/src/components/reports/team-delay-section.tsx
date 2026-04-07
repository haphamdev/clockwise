import { useDelayHeatmap } from '@/lib/reports/use-delay-heatmap';
import { Skeleton } from '@/components/ui/skeleton';
import { DelayHeatmap } from './delay-heatmap';
import type { ReportBaseParams } from '@/lib/reports/types';

interface TeamDelaySectionProps {
  filters: ReportBaseParams;
}

export function TeamDelaySection({ filters }: TeamDelaySectionProps) {
  const { data, isLoading } = useDelayHeatmap(filters);

  return (
    <div className="space-y-2">
      <div>
        <h3 className="text-sm font-medium text-muted-foreground">Logging Delay</h3>
        <p className="text-xs text-muted-foreground">
          Shows how quickly team members log their hours. Each cell shows the 75th percentile delay
          &mdash; 75% of entries were logged within this many days. Cells with fewer than{' '}
          {data?.minEntries ?? 5} entries are grayed out.
        </p>
      </div>
      {isLoading ? (
        <Skeleton className="h-40 w-full" />
      ) : (
        <DelayHeatmap cells={data?.cells ?? []} minEntries={data?.minEntries ?? 5} />
      )}
    </div>
  );
}
