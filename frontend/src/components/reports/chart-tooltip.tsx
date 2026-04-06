import type { TooltipContentProps } from 'recharts/types/component/Tooltip';
import type { SeriesKey } from '@/lib/reports/chart-utils';
import type { ChartMode } from './chart-toolbar';
import { CHART_COLORS, formatTooltipLabel } from '@/lib/reports/chart-utils';

export interface ChartVisibility {
  hiddenIds: Set<string>;
  showValues: boolean;
  showTrend: boolean;
}

interface ChartTooltipProps extends Partial<TooltipContentProps> {
  seriesKeys: SeriesKey[];
  mode: ChartMode;
  visibility: ChartVisibility;
}

export function ChartTooltip({
  active,
  payload,
  label: tooltipLabel,
  seriesKeys,
  mode,
  visibility,
}: ChartTooltipProps) {
  if (!active || !payload?.length) return null;

  const { hiddenIds, showValues, showTrend } = visibility;

  const barValues = new Map<string, number>();
  const avgValues = new Map<string, number>();
  let totalAvg: number | undefined;
  for (const entry of payload) {
    const key = entry.dataKey as string;
    if (key === '_total_avg') {
      totalAvg = Number(entry.value ?? 0);
    } else if (key.endsWith('_avg')) {
      avgValues.set(key.replace('_avg', ''), Number(entry.value ?? 0));
    } else {
      barValues.set(key, Number(entry.value ?? 0));
    }
  }

  const isStacked = mode === 'stacked';
  // Pre-build index lookup so we get stable color assignment without O(n) indexOf per series
  const colorIndex = new Map(seriesKeys.map((sk, i) => [sk.id, i]));
  let total = 0;
  const lines = seriesKeys
    .filter((sk) => !hiddenIds.has(sk.id))
    .flatMap((sk) => {
      const i = colorIndex.get(sk.id)!;
      const value = showValues ? (barValues.get(sk.id) ?? 0) : undefined;
      if (value !== undefined) total += value;
      const avg = showTrend && !isStacked ? avgValues.get(sk.id) : undefined;
      if (value === undefined && avg === undefined) return [];
      return [
        <p
          key={sk.id}
          style={{ color: CHART_COLORS[i % CHART_COLORS.length], margin: '2px 0' }}
        >
          {sk.label}:{value !== undefined && ` ${value}h`}
          {avg !== undefined && <span style={{ opacity: 0.7 }}> (avg. {avg}h)</span>}
        </p>,
      ];
    });

  return (
    <div
      style={{
        background: 'var(--bg-light)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        fontSize: 12,
        padding: '8px 12px',
      }}
    >
      <p style={{ marginBottom: 4, fontWeight: 500 }}>
        {formatTooltipLabel(String(tooltipLabel ?? ''))}
      </p>
      {lines}
      {isStacked && (showValues || (showTrend && totalAvg !== undefined)) && (
        <p
          style={{
            color: 'var(--text)',
            margin: '4px 0 0',
            borderTop: '1px solid var(--border-muted)',
            paddingTop: 4,
          }}
        >
          {showValues && <>Total: {Math.round(total * 100) / 100}h</>}
          {showTrend && totalAvg !== undefined && (
            <span style={{ opacity: showValues ? 0.7 : 1 }}>
              {showValues ? ' ' : ''}(avg. {totalAvg}h)
            </span>
          )}
        </p>
      )}
    </div>
  );
}
