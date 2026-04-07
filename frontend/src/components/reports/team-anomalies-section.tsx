import { useAnomalies } from '@/lib/reports/use-anomalies';
import { Skeleton } from '@/components/ui/skeleton';
import { AnomalyHeatmap } from './anomaly-heatmap';
import { AnomalyList } from './anomaly-list';
import type { ReportBaseParams } from '@/lib/reports/types';

interface TeamAnomaliesSectionProps {
  filters: ReportBaseParams;
}

export function TeamAnomaliesSection({ filters }: TeamAnomaliesSectionProps) {
  const { data: anomalyData, isLoading } = useAnomalies(filters);

  return (
    <div className="space-y-2">
      <div>
        <h3 className="text-sm font-medium text-muted-foreground">Overtime Anomalies</h3>
        <p className="text-xs text-muted-foreground">
          Days where a member logged &ge;{anomalyData?.thresholds.warningHigh ?? 10}h. Highlights
          potential overwork patterns.
        </p>
      </div>
      {isLoading ? (
        <Skeleton className="h-40 w-full" />
      ) : (
        <>
          <AnomalyHeatmap entries={anomalyData?.entries ?? []} />
          <AnomalyList
            entries={anomalyData?.entries ?? []}
            thresholds={anomalyData?.thresholds ?? { warningHigh: 10, criticalHigh: 12 }}
          />
        </>
      )}
    </div>
  );
}
