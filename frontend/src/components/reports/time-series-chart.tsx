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
import type { LegendPayload } from 'recharts/types/component/DefaultLegendContent';
import type { ReportGranularity, TimeSeriesBucket } from '@/lib/reports/types';
import { DEFAULT_LAYERS } from './chart-toolbar';
import type { ChartMode, ChartLayers } from './chart-toolbar';
import {
  CHART_COLORS,
  collectSeriesKeys,
  buildChartRows,
  buildAvgRows,
  mergeChartData,
  computeYMax,
} from '@/lib/reports/chart-utils';
import { CustomTick } from './custom-tick';
import { ChartTooltip } from './chart-tooltip';
import type { ChartVisibility } from './chart-tooltip';

interface TimeSeriesChartProps {
  buckets: TimeSeriesBucket[];
  dateFrom: string;
  dateTo: string;
  granularity: ReportGranularity;
  mode: ChartMode;
  layers?: ChartLayers;
}

export function TimeSeriesChart({
  buckets,
  dateFrom,
  dateTo,
  granularity,
  mode,
  layers = DEFAULT_LAYERS,
}: TimeSeriesChartProps) {
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());

  const showValues = layers.values;
  const showTrend = layers.trend;

  const visibility = useMemo<ChartVisibility>(
    () => ({ hiddenIds, showValues, showTrend }),
    [hiddenIds, showValues, showTrend],
  );

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
    () => (showTrend ? buildAvgRows(rows, seriesKeys) : rows),
    [rows, seriesKeys, showTrend],
  );

  const data = useMemo(
    () => mergeChartData(rows, avgRows, seriesKeys, hiddenIds),
    [rows, avgRows, seriesKeys, hiddenIds],
  );

  const yMax = useMemo(() => computeYMax(rows, seriesKeys, mode), [rows, seriesKeys, mode]);

  if (seriesKeys.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
        No data for this period
      </div>
    );
  }

  if (!showValues && !showTrend) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
        No visible layers
      </div>
    );
  }

  const stackId = mode === 'stacked' ? 'stack' : undefined;

  return (
    <ResponsiveContainer width="100%" height={320}>
      <ComposedChart data={data} margin={{ top: 4, right: 4, bottom: 4, left: -8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-muted)" />
        <XAxis dataKey="label" tick={CustomTick} tickLine={false} axisLine={false} />
        <YAxis
          tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
          tickLine={false}
          axisLine={false}
          width={40}
          domain={[0, yMax > 0 ? yMax : 'auto']}
          allowDataOverflow
        />
        <Tooltip
          content={
            <ChartTooltip seriesKeys={seriesKeys} mode={mode} visibility={visibility} />
          }
        />
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
            hide={!showValues || hiddenIds.has(sk.id)}
          />
        ))}
        {showTrend &&
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
