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
import type { TooltipContentProps } from 'recharts/types/component/Tooltip';
import type { LegendPayload } from 'recharts/types/component/DefaultLegendContent';
import type { ReportGranularity, TimeSeriesBucket } from '@/lib/reports/types';
import type { ChartMode } from './chart-mode-toggle';
import {
  collectSeriesKeys,
  buildChartRows,
  buildAvgRows,
  mergeChartData,
  computeYMax,
} from '@/lib/reports/chart-utils';

const CHART_COLORS = Array.from({ length: 10 }, (_, i) => `var(--chart-${i + 1})`);

interface TimeSeriesChartProps {
  buckets: TimeSeriesBucket[];
  dateFrom: string;
  dateTo: string;
  granularity: ReportGranularity;
  mode: ChartMode;
  showAverage?: boolean;
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

  const handleLegendClick = useCallback((entry: LegendPayload) => {
    const id = String(entry.dataKey ?? '');
    if (!id) return;
    setHiddenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const seriesKeys = useMemo(() => collectSeriesKeys(buckets), [buckets]);

  const rows = useMemo(
    () => buildChartRows(buckets, dateFrom, dateTo, granularity),
    [buckets, dateFrom, dateTo, granularity],
  );

  const avgRows = useMemo(
    () => (showAverage ? buildAvgRows(rows, seriesKeys) : rows),
    [rows, seriesKeys, showAverage],
  );

  const data = useMemo(
    () => mergeChartData(rows, avgRows, seriesKeys, hiddenIds),
    [rows, avgRows, seriesKeys, hiddenIds],
  );

  const yMax = useMemo(
    () => computeYMax(rows, seriesKeys, mode),
    [rows, seriesKeys, mode],
  );

  const renderTooltip = useMemo(() => {
    return function ChartTooltip({ active, payload, label: tooltipLabel }: TooltipContentProps) {
      if (!active || !payload?.length) return null;

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
      let total = 0;
      const lines = seriesKeys
        .filter((sk) => !hiddenIds.has(sk.id))
        .map((sk) => {
          const i = seriesKeys.indexOf(sk);
          const value = barValues.get(sk.id) ?? 0;
          total += value;
          const avg = !isStacked ? avgValues.get(sk.id) : undefined;
          return (
            <p
              key={sk.id}
              style={{ color: CHART_COLORS[i % CHART_COLORS.length], margin: '2px 0' }}
            >
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
            <p
              style={{
                color: 'var(--text)',
                margin: '4px 0 0',
                borderTop: '1px solid var(--border-muted)',
                paddingTop: 4,
              }}
            >
              Total: {Math.round(total * 100) / 100}h
              {totalAvg !== undefined && <span style={{ opacity: 0.7 }}> (avg. {totalAvg}h)</span>}
            </p>
          )}
        </div>
      );
    };
  }, [seriesKeys, mode, hiddenIds]);

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
          formatter={(_value: unknown, entry: LegendPayload) => {
            const id = String(entry.dataKey ?? '');
            const hidden = hiddenIds.has(id);
            return <span style={{ opacity: hidden ? 0.35 : 1 }}>{String(entry.value ?? '')}</span>;
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
