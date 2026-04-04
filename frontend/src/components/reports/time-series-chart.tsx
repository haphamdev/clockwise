import { useCallback, useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import type { TooltipProps } from 'recharts';
import { formatPeriodLabel } from '@/lib/reports/granularity-utils';
import type { ReportGranularity, TimeSeriesBucket } from '@/lib/reports/types';
import type { ChartMode } from './chart-mode-toggle';

const CHART_COLORS = Array.from({ length: 10 }, (_, i) => `var(--chart-${i + 1})`);

interface TimeSeriesChartProps {
  buckets: TimeSeriesBucket[];
  dateFrom: string;
  dateTo: string;
  granularity: ReportGranularity;
  mode: ChartMode;
  showAverage?: boolean;
}

/** Generate all period start dates between dateFrom and dateTo for a given granularity. */
function generatePeriodStarts(dateFrom: string, dateTo: string, granularity: ReportGranularity): string[] {
  const starts: string[] = [];
  const end = new Date(dateTo + 'T00:00:00Z');
  const d = new Date(dateFrom + 'T00:00:00Z');

  // Align start to granularity boundary
  switch (granularity) {
    case 'week': {
      // Align to Monday
      const dow = d.getUTCDay();
      const diff = dow === 0 ? -6 : 1 - dow;
      d.setUTCDate(d.getUTCDate() + diff);
      break;
    }
    case 'month':
      d.setUTCDate(1);
      break;
    case 'quarter':
      d.setUTCMonth(Math.floor(d.getUTCMonth() / 3) * 3);
      d.setUTCDate(1);
      break;
  }

  while (d <= end) {
    starts.push(d.toISOString().slice(0, 10));
    switch (granularity) {
      case 'day':
        d.setUTCDate(d.getUTCDate() + 1);
        break;
      case 'week':
        d.setUTCDate(d.getUTCDate() + 7);
        break;
      case 'month':
        d.setUTCMonth(d.getUTCMonth() + 1);
        break;
      case 'quarter':
        d.setUTCMonth(d.getUTCMonth() + 3);
        break;
    }
  }

  return starts;
}

interface ChartRow {
  label: string;
  [key: string]: string | number;
}

export function TimeSeriesChart({
  buckets,
  dateFrom,
  dateTo,
  granularity,
  mode,
  showAverage = true,
}: TimeSeriesChartProps) {
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());

  const handleLegendClick = useCallback((entry: { dataKey?: string }) => {
    const id = entry.dataKey as string;
    if (!id) return;
    setHiddenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  // Collect all unique series keys across all buckets
  const seriesKeys = useMemo(() => {
    const map = new Map<string, string>();
    for (const b of buckets) {
      for (const s of b.series) {
        if (!map.has(s.id)) map.set(s.id, s.label);
      }
    }
    return Array.from(map, ([id, label]) => ({ id, label }));
  }, [buckets]);

  // Fill missing periods and transform into flat rows for recharts
  const { rows, avgRows } = useMemo(() => {
    const bucketMap = new Map(buckets.map((b) => [b.periodStart, b]));
    const allPeriods = generatePeriodStarts(dateFrom, dateTo, granularity);

    const rows: ChartRow[] = allPeriods.map((periodStart) => {
      const row: ChartRow = { label: formatPeriodLabel(periodStart, granularity) };
      const bucket = bucketMap.get(periodStart);
      if (bucket) {
        for (const s of bucket.series) {
          row[s.id] = s.value;
        }
      }
      return row;
    });

    // Cumulative average: total so far / number of periods so far
    if (!showAverage || rows.length < 2) return { rows, avgRows: rows };

    const cumSums = new Map<string, number>();
    let totalCumSum = 0;
    const avgRows: ChartRow[] = rows.map((row, i) => {
      const avg: ChartRow = { label: row.label };
      const count = i + 1;
      let periodTotal = 0;
      for (const sk of seriesKeys) {
        const prev = cumSums.get(sk.id) ?? 0;
        const v = rows[i][sk.id];
        const val = typeof v === 'number' ? v : 0;
        const sum = prev + val;
        cumSums.set(sk.id, sum);
        avg[`${sk.id}_avg`] = Math.round((sum / count) * 100) / 100;
        periodTotal += val;
      }
      totalCumSum += periodTotal;
      avg._total_avg = Math.round((totalCumSum / count) * 100) / 100;
      return avg;
    });
    return { rows, avgRows };
  }, [buckets, dateFrom, dateTo, granularity, seriesKeys, showAverage]);

  // Merge rows and avg rows; recompute _total_avg based on visible series
  const data = useMemo(
    () =>
      rows.map((row, i) => {
        const merged: ChartRow = { ...row, ...(avgRows !== rows ? avgRows[i] : {}) };
        if (avgRows !== rows) {
          let visibleTotal = 0;
          for (const sk of seriesKeys) {
            if (!hiddenIds.has(sk.id)) {
              const v = merged[`${sk.id}_avg`];
              if (typeof v === 'number') visibleTotal += v;
            }
          }
          merged._total_avg = Math.round(visibleTotal * 100) / 100;
        }
        return merged;
      }),
    [rows, avgRows, seriesKeys, hiddenIds],
  );

  // Fixed Y axis max based on full dataset, accounting for chart mode
  // Stacked: max is sum of all series per period; Grouped: max is single highest value
  const yMax = useMemo(() => {
    let max = 0;
    for (const row of rows) {
      let stackedTotal = 0;
      for (const sk of seriesKeys) {
        const v = row[sk.id];
        const val = typeof v === 'number' ? v : 0;
        stackedTotal += val;
        if (mode === 'grouped' && val > max) max = val;
      }
      if (mode === 'stacked' && stackedTotal > max) max = stackedTotal;
    }
    return Math.ceil(max);
  }, [rows, seriesKeys, mode]);

  const hasAvg = showAverage && avgRows !== rows;

  const renderTooltip = useMemo(() => {
    return function ChartTooltip({ active, payload, label: tooltipLabel }: TooltipProps<number, string>) {
      if (!active || !payload?.length) return null;

      // Collect bar values and avg values from payload
      const barValues = new Map<string, number>();
      const avgValues = new Map<string, number>();
      let totalAvg: number | undefined;
      for (const entry of payload) {
        const key = entry.dataKey as string;
        if (key === '_total_avg') {
          totalAvg = entry.value ?? 0;
        } else if (key.endsWith('_avg')) {
          avgValues.set(key.replace('_avg', ''), entry.value ?? 0);
        } else {
          barValues.set(key, entry.value ?? 0);
        }
      }

      const isStacked = mode === 'stacked';
      let total = 0;
      const lines = seriesKeys
        .filter((sk) => !hiddenIds.has(sk.id))
        .map((sk) => {
          const i = seriesKeys.indexOf(sk);
          const value = barValues.get(sk.id) ?? 0;
          total += value;
          const avg = !isStacked ? avgValues.get(sk.id) : undefined;
          return (
            <p key={sk.id} style={{ color: CHART_COLORS[i % CHART_COLORS.length], margin: '2px 0' }}>
              {sk.label}: {value}h
              {avg !== undefined && <span style={{ opacity: 0.7 }}> (avg. {avg}h)</span>}
            </p>
          );
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
          <p style={{ marginBottom: 4, fontWeight: 500 }}>{tooltipLabel}</p>
          {lines}
          {isStacked && (
            <p style={{ color: 'var(--text)', margin: '4px 0 0', borderTop: '1px solid var(--border-muted)', paddingTop: 4 }}>
              Total: {Math.round(total * 100) / 100}h
              {totalAvg !== undefined && <span style={{ opacity: 0.7 }}> (avg. {totalAvg}h)</span>}
            </p>
          )}
        </div>
      );
    };
  }, [seriesKeys, hasAvg, mode, hiddenIds]);

  if (seriesKeys.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
        No data for this period
      </div>
    );
  }

  const stackId = mode === 'stacked' ? 'stack' : undefined;

  return (
    <ResponsiveContainer width="100%" height={320}>
      <ComposedChart data={data} margin={{ top: 4, right: 4, bottom: 4, left: -8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-muted)" />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
          tickLine={false}
          axisLine={false}
          width={40}
          domain={[0, yMax > 0 ? yMax : 'auto']}
          allowDataOverflow
        />
        <Tooltip content={renderTooltip} />
        <Legend
          wrapperStyle={{ fontSize: 12, cursor: 'pointer' }}
          iconType="square"
          iconSize={10}
          onClick={handleLegendClick}
          formatter={(value: string, entry: { dataKey?: string }) => {
            const id = entry.dataKey as string;
            const hidden = hiddenIds.has(id);
            return <span style={{ opacity: hidden ? 0.35 : 1 }}>{value}</span>;
          }}
        />
        {seriesKeys.map((sk, i) => (
          <Bar
            key={sk.id}
            dataKey={sk.id}
            name={sk.label}
            fill={CHART_COLORS[i % CHART_COLORS.length]}
            stackId={stackId}
            radius={stackId ? undefined : [2, 2, 0, 0]}
            maxBarSize={48}
            hide={hiddenIds.has(sk.id)}
          />
        ))}
        {showAverage &&
          avgRows !== rows &&
          (stackId ? (
            <Line
              dataKey="_total_avg"
              name="Total avg"
              stroke="var(--text-muted)"
              strokeWidth={2}
              strokeDasharray="4 2"
              dot={false}
              legendType="none"
            />
          ) : (
            seriesKeys.map((sk, i) => (
              <Line
                key={`${sk.id}_avg`}
                dataKey={`${sk.id}_avg`}
                name={`${sk.label} (avg)`}
                stroke={CHART_COLORS[i % CHART_COLORS.length]}
                strokeWidth={2}
                strokeDasharray="4 2"
                dot={false}
                hide={hiddenIds.has(sk.id)}
                legendType="none"
              />
            ))
          ))}
      </ComposedChart>
    </ResponsiveContainer>
  );
}
