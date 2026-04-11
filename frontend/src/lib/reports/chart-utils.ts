import { formatPeriodLabel } from "./granularity-utils";
import type { ReportGranularity, TimeSeriesBucket } from "./types";

export const CHART_COLORS = Array.from(
  { length: 10 },
  (_, i) => `var(--chart-${i + 1})`,
);

/** Convert X-axis two-line label into a single-line tooltip label.
 *  "Mar\n2–8" → "Mar 2 - 8"  (same-month: month on first line, dates on second)
 *  "Jan 26\nFeb 1" → "Jan 26 - Feb 1"  (cross-month: each line has month + day) */
export function formatTooltipLabel(label: string): string {
  if (!label.includes("\n")) return label;
  const [line1, line2] = label.split("\n");
  // Same-month: line1 is just the month name (no digit), line2 is the date range
  if (/^\d/.test(line2)) return `${line1} ${line2.replace("–", " - ")}`;
  // Cross-month: both lines have month + day
  return `${line1} - ${line2}`;
}

export interface SeriesKey {
  id: string;
  label: string;
}

export interface ChartRow {
  label: string;
  [key: string]: string | number;
}

function getEndDate(startDate: Date, granularity: ReportGranularity): Date {
  const d = new Date(startDate); // avoid mutating input

  switch (granularity) {
    case "day":
      return d; // same day

    case "week": {
      // week starts Monday → end is Sunday
      const end = new Date(d);
      end.setUTCDate(d.getUTCDate() + 6);
      return end;
    }

    case "month": {
      // move to first day of next month, then go back 1 day
      const end = new Date(d);
      end.setUTCMonth(d.getUTCMonth() + 1);
      end.setUTCDate(0); // day 0 = last day of previous month
      return end;
    }

    case "quarter": {
      const end = new Date(d);
      // move to next quarter
      end.setUTCMonth(d.getUTCMonth() + 3);
      end.setUTCDate(1); // first day of next quarter
      end.setUTCDate(0); // step back → last day of current quarter
      return end;
    }
  }
}

/** Generate all period start dates between dateFrom and dateTo for a given granularity. */
export function generatePeriodStarts(
  dateFrom: string,
  dateTo: string,
  granularity: ReportGranularity,
): { start: string; end: string }[] {
  const periods: { start: string; end: string }[] = [];
  const end = new Date(`${dateTo}T00:00:00Z`);
  const d = new Date(`${dateFrom}T00:00:00Z`);

  // Align start to granularity boundary
  switch (granularity) {
    case "week": {
      // Align to Monday
      const dow = d.getUTCDay();
      const diff = dow === 0 ? -6 : 1 - dow;
      d.setUTCDate(d.getUTCDate() + diff);
      break;
    }
    case "month":
      d.setUTCDate(1);
      break;
    case "quarter":
      d.setUTCMonth(Math.floor(d.getUTCMonth() / 3) * 3);
      d.setUTCDate(1);
      break;
  }

  while (d <= end) {
    periods.push({
      start: d.toISOString().slice(0, 10),
      end: getEndDate(d, granularity).toISOString().slice(0, 10),
    });
    switch (granularity) {
      case "day":
        d.setUTCDate(d.getUTCDate() + 1);
        break;
      case "week":
        d.setUTCDate(d.getUTCDate() + 7);
        break;
      case "month":
        d.setUTCMonth(d.getUTCMonth() + 1);
        break;
      case "quarter":
        d.setUTCMonth(d.getUTCMonth() + 3);
        break;
    }
  }

  return periods;
}

/** Collect all unique series keys (id + label) across all buckets, preserving insertion order. */
export function collectSeriesKeys(buckets: TimeSeriesBucket[]): SeriesKey[] {
  const map = new Map<string, string>();
  for (const b of buckets) {
    for (const s of b.series) {
      if (!map.has(s.id)) map.set(s.id, s.label);
    }
  }
  return Array.from(map, ([id, label]) => ({ id, label }));
}

/** Fill missing periods and transform buckets into flat rows for recharts. */
export function buildChartRows(
  buckets: TimeSeriesBucket[],
  dateFrom: string,
  dateTo: string,
  granularity: ReportGranularity,
): ChartRow[] {
  const bucketMap = new Map(buckets.map((b) => [b.periodStart, b]));
  const allPeriods = generatePeriodStarts(dateFrom, dateTo, granularity);

  return allPeriods.map(({ start: periodStart, end: periodEnd }) => {
    const row: ChartRow = {
      label: formatPeriodLabel(periodStart, periodEnd, granularity),
    };
    const bucket = bucketMap.get(periodStart);
    if (bucket) {
      for (const s of bucket.series) {
        row[s.id] = s.value;
      }
    }
    return row;
  });
}

/** Compute cumulative average rows. Returns the input rows unchanged if < 2 rows. */
export function buildAvgRows(
  rows: ChartRow[],
  seriesKeys: SeriesKey[],
): ChartRow[] {
  if (rows.length < 2) return rows;

  const cumSums = new Map<string, number>();
  let totalCumSum = 0;

  return rows.map((row, i) => {
    const avg: ChartRow = { label: row.label };
    const count = i + 1;
    let periodTotal = 0;
    for (const sk of seriesKeys) {
      const prev = cumSums.get(sk.id) ?? 0;
      const v = row[sk.id];
      const val = typeof v === "number" ? v : 0;
      const sum = prev + val;
      cumSums.set(sk.id, sum);
      avg[`${sk.id}_avg`] = Math.round((sum / count) * 100) / 100;
      periodTotal += val;
    }
    totalCumSum += periodTotal;
    avg._total_avg = Math.round((totalCumSum / count) * 100) / 100;
    return avg;
  });
}

/** Merge value rows with average rows, recomputing _total_avg for visible series only. */
export function mergeChartData(
  rows: ChartRow[],
  avgRows: ChartRow[],
  seriesKeys: SeriesKey[],
  hiddenIds: Set<string>,
): ChartRow[] {
  const hasAvg = avgRows !== rows;
  return rows.map((row, i) => {
    const merged: ChartRow = { ...row, ...(hasAvg ? avgRows[i] : {}) };
    if (hasAvg) {
      let visibleTotal = 0;
      for (const sk of seriesKeys) {
        if (!hiddenIds.has(sk.id)) {
          const v = merged[`${sk.id}_avg`];
          if (typeof v === "number") visibleTotal += v;
        }
      }
      merged._total_avg = Math.round(visibleTotal * 100) / 100;
    }
    return merged;
  });
}

export type ChartMode = "stacked" | "grouped";

export interface ChartLayers {
  values: boolean;
  trend: boolean;
}

export const DEFAULT_LAYERS: ChartLayers = { values: true, trend: true };

/** Compute fixed Y axis max based on full dataset, accounting for chart mode. */
export function computeYMax(
  rows: ChartRow[],
  seriesKeys: SeriesKey[],
  mode: ChartMode,
): number {
  let max = 0;
  for (const row of rows) {
    let stackedTotal = 0;
    for (const sk of seriesKeys) {
      const v = row[sk.id];
      const val = typeof v === "number" ? v : 0;
      stackedTotal += val;
      if (mode === "grouped" && val > max) max = val;
    }
    if (mode === "stacked" && stackedTotal > max) max = stackedTotal;
  }
  return Math.ceil(max);
}
