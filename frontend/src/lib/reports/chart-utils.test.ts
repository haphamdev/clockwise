import { describe, it, expect } from 'vitest';
import type { TimeSeriesBucket } from './types';
import type { ChartRow, SeriesKey } from './chart-utils';
import {
  formatTooltipLabel,
  generatePeriodStarts,
  collectSeriesKeys,
  buildChartRows,
  buildAvgRows,
  mergeChartData,
  computeYMax,
} from './chart-utils';

// ---------------------------------------------------------------------------
// formatTooltipLabel
// ---------------------------------------------------------------------------
describe('formatTooltipLabel', () => {
  it('returns single-line labels unchanged', () => {
    expect(formatTooltipLabel('Apr 1')).toBe('Apr 1');
    expect(formatTooltipLabel('Mar 26')).toBe('Mar 26');
    expect(formatTooltipLabel('Q1 26')).toBe('Q1 26');
  });

  it('formats same-month week: month + date range', () => {
    expect(formatTooltipLabel('Mar\n2–8')).toBe('Mar 2 - 8');
    expect(formatTooltipLabel('Jan\n19–25')).toBe('Jan 19 - 25');
  });

  it('formats cross-month week with separator', () => {
    expect(formatTooltipLabel('Jan 26\nFeb 1')).toBe('Jan 26 - Feb 1');
    expect(formatTooltipLabel('Mar 30\nApr 5')).toBe('Mar 30 - Apr 5');
  });

  it('handles empty string', () => {
    expect(formatTooltipLabel('')).toBe('');
  });
});

// ---------------------------------------------------------------------------
// generatePeriodStarts
// ---------------------------------------------------------------------------
describe('generatePeriodStarts', () => {
  it('generates daily periods', () => {
    const result = generatePeriodStarts('2026-04-01', '2026-04-04', 'day');
    expect(result).toEqual([
      { start: '2026-04-01', end: '2026-04-01' },
      { start: '2026-04-02', end: '2026-04-02' },
      { start: '2026-04-03', end: '2026-04-03' },
      { start: '2026-04-04', end: '2026-04-04' },
    ]);
  });

  it('generates weekly periods aligned to Monday', () => {
    // 2026-04-01 is a Wednesday → aligns back to Monday 2026-03-30
    const result = generatePeriodStarts('2026-04-01', '2026-04-14', 'week');
    expect(result).toEqual([
      { start: '2026-03-30', end: '2026-04-05' },
      { start: '2026-04-06', end: '2026-04-12' },
      { start: '2026-04-13', end: '2026-04-19' },
    ]);
  });

  it('aligns Sunday to previous Monday for weekly', () => {
    // 2026-04-05 is a Sunday → aligns back to Monday 2026-03-30
    const result = generatePeriodStarts('2026-04-05', '2026-04-12', 'week');
    expect(result).toEqual([
      { start: '2026-03-30', end: '2026-04-05' },
      { start: '2026-04-06', end: '2026-04-12' },
    ]);
  });

  it('generates monthly periods aligned to 1st', () => {
    const result = generatePeriodStarts('2026-03-15', '2026-06-10', 'month');
    expect(result).toEqual([
      { start: '2026-03-01', end: '2026-03-31' },
      { start: '2026-04-01', end: '2026-04-30' },
      { start: '2026-05-01', end: '2026-05-31' },
      { start: '2026-06-01', end: '2026-06-30' },
    ]);
  });

  it('generates quarterly periods aligned to quarter start', () => {
    // Feb 2026 → aligns to Jan 1 (Q1)
    const result = generatePeriodStarts('2026-02-15', '2026-08-01', 'quarter');
    expect(result).toEqual([
      { start: '2026-01-01', end: '2026-03-31' },
      { start: '2026-04-01', end: '2026-06-30' },
      { start: '2026-07-01', end: '2026-09-30' },
    ]);
  });

  it('returns single period when dateFrom equals dateTo for day', () => {
    const result = generatePeriodStarts('2026-04-01', '2026-04-01', 'day');
    expect(result).toEqual([{ start: '2026-04-01', end: '2026-04-01' }]);
  });

  it('returns empty array when dateFrom is after dateTo', () => {
    const result = generatePeriodStarts('2026-04-05', '2026-04-01', 'day');
    expect(result).toEqual([]);
  });

  it('handles year boundary for monthly', () => {
    const result = generatePeriodStarts('2025-11-01', '2026-02-15', 'month');
    expect(result).toEqual([
      { start: '2025-11-01', end: '2025-11-30' },
      { start: '2025-12-01', end: '2025-12-31' },
      { start: '2026-01-01', end: '2026-01-31' },
      { start: '2026-02-01', end: '2026-02-28' },
    ]);
  });

  it('weekly period starting on Monday stays on Monday', () => {
    // 2026-03-30 is a Monday
    const result = generatePeriodStarts('2026-03-30', '2026-04-06', 'week');
    expect(result).toEqual([
      { start: '2026-03-30', end: '2026-04-05' },
      { start: '2026-04-06', end: '2026-04-12' },
    ]);
  });
});

// ---------------------------------------------------------------------------
// collectSeriesKeys
// ---------------------------------------------------------------------------
describe('collectSeriesKeys', () => {
  it('collects unique series keys preserving insertion order', () => {
    const buckets: TimeSeriesBucket[] = [
      {
        periodStart: '2026-04-01',
        periodEnd: '2026-04-01',
        series: [
          { id: 'p1', label: 'Project A', value: 5 },
          { id: 'p2', label: 'Project B', value: 3 },
        ],
      },
      {
        periodStart: '2026-04-02',
        periodEnd: '2026-04-02',
        series: [
          { id: 'p2', label: 'Project B', value: 4 },
          { id: 'p3', label: 'Project C', value: 2 },
        ],
      },
    ];
    expect(collectSeriesKeys(buckets)).toEqual([
      { id: 'p1', label: 'Project A' },
      { id: 'p2', label: 'Project B' },
      { id: 'p3', label: 'Project C' },
    ]);
  });

  it('returns empty array for empty buckets', () => {
    expect(collectSeriesKeys([])).toEqual([]);
  });

  it('deduplicates by id, keeping first label', () => {
    const buckets: TimeSeriesBucket[] = [
      {
        periodStart: '2026-04-01',
        periodEnd: '2026-04-01',
        series: [{ id: 'p1', label: 'Name V1', value: 1 }],
      },
      {
        periodStart: '2026-04-02',
        periodEnd: '2026-04-02',
        series: [{ id: 'p1', label: 'Name V2', value: 2 }],
      },
    ];
    expect(collectSeriesKeys(buckets)).toEqual([{ id: 'p1', label: 'Name V1' }]);
  });

  it('handles bucket with empty series array', () => {
    const buckets: TimeSeriesBucket[] = [
      { periodStart: '2026-04-01', periodEnd: '2026-04-01', series: [] },
    ];
    expect(collectSeriesKeys(buckets)).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// buildChartRows
// ---------------------------------------------------------------------------
describe('buildChartRows', () => {
  const buckets: TimeSeriesBucket[] = [
    {
      periodStart: '2026-04-01',
      periodEnd: '2026-04-01',
      series: [
        { id: 'p1', label: 'A', value: 5 },
        { id: 'p2', label: 'B', value: 3 },
      ],
    },
    {
      periodStart: '2026-04-03',
      periodEnd: '2026-04-03',
      series: [{ id: 'p1', label: 'A', value: 2 }],
    },
  ];

  it('fills missing periods with zero-value rows', () => {
    const rows = buildChartRows(buckets, '2026-04-01', '2026-04-03', 'day');
    expect(rows).toHaveLength(3);
    // Apr 1 has data
    expect(rows[0].p1).toBe(5);
    expect(rows[0].p2).toBe(3);
    // Apr 2 is missing — no series keys set
    expect(rows[1].p1).toBeUndefined();
    expect(rows[1].p2).toBeUndefined();
    // Apr 3 has partial data
    expect(rows[2].p1).toBe(2);
    expect(rows[2].p2).toBeUndefined();
  });

  it('each row has a label', () => {
    const rows = buildChartRows(buckets, '2026-04-01', '2026-04-03', 'day');
    expect(rows[0].label).toBe('Apr 1');
    expect(rows[1].label).toBe('Apr 2');
    expect(rows[2].label).toBe('Apr 3');
  });

  it('returns empty array when dateFrom is after dateTo', () => {
    const rows = buildChartRows([], '2026-04-05', '2026-04-01', 'day');
    expect(rows).toEqual([]);
  });

  it('returns rows with no series data when buckets are empty', () => {
    const rows = buildChartRows([], '2026-04-01', '2026-04-02', 'day');
    expect(rows).toHaveLength(2);
    expect(Object.keys(rows[0])).toEqual(['label']);
  });
});

// ---------------------------------------------------------------------------
// buildAvgRows
// ---------------------------------------------------------------------------
describe('buildAvgRows', () => {
  const keys: SeriesKey[] = [
    { id: 'p1', label: 'A' },
    { id: 'p2', label: 'B' },
  ];

  it('returns input rows unchanged when fewer than 2 rows', () => {
    const rows: ChartRow[] = [{ label: 'Apr 1', p1: 10 }];
    const result = buildAvgRows(rows, keys);
    expect(result).toBe(rows); // same reference
  });

  it('computes cumulative average correctly', () => {
    const rows: ChartRow[] = [
      { label: 'Apr 1', p1: 10, p2: 0 },
      { label: 'Apr 2', p1: 0, p2: 6 },
      { label: 'Apr 3', p1: 5, p2: 3 },
    ];
    const avg = buildAvgRows(rows, keys);
    expect(avg).toHaveLength(3);

    // Period 1: p1=10/1=10, p2=0/1=0, total=10/1=10
    expect(avg[0].p1_avg).toBe(10);
    expect(avg[0].p2_avg).toBe(0);
    expect(avg[0]._total_avg).toBe(10);

    // Period 2: p1=10/2=5, p2=6/2=3, total=16/2=8
    expect(avg[1].p1_avg).toBe(5);
    expect(avg[1].p2_avg).toBe(3);
    expect(avg[1]._total_avg).toBe(8);

    // Period 3: p1=15/3=5, p2=9/3=3, total=24/3=8
    expect(avg[2].p1_avg).toBe(5);
    expect(avg[2].p2_avg).toBe(3);
    expect(avg[2]._total_avg).toBe(8);
  });

  it('handles consecutive zeros — average decays', () => {
    const rows: ChartRow[] = [
      { label: 'Apr 1', p1: 6 },
      { label: 'Apr 2', p1: 0 },
      { label: 'Apr 3', p1: 0 },
    ];
    const singleKey: SeriesKey[] = [{ id: 'p1', label: 'A' }];
    const avg = buildAvgRows(rows, singleKey);

    expect(avg[0].p1_avg).toBe(6);       // 6/1
    expect(avg[1].p1_avg).toBe(3);       // 6/2
    expect(avg[2].p1_avg).toBe(2);       // 6/3
  });

  it('treats missing series values as 0', () => {
    const rows: ChartRow[] = [
      { label: 'Apr 1', p1: 4 },          // p2 is missing
      { label: 'Apr 2', p1: 2, p2: 6 },
    ];
    const avg = buildAvgRows(rows, keys);

    // Period 1: p2 missing → treated as 0
    expect(avg[0].p2_avg).toBe(0);
    // Period 2: p2 cumulative = 0+6=6, avg=6/2=3
    expect(avg[1].p2_avg).toBe(3);
  });

  it('rounds to 2 decimal places', () => {
    const rows: ChartRow[] = [
      { label: 'Apr 1', p1: 1 },
      { label: 'Apr 2', p1: 1 },
      { label: 'Apr 3', p1: 1 },
    ];
    const singleKey: SeriesKey[] = [{ id: 'p1', label: 'A' }];
    const avg = buildAvgRows(rows, singleKey);

    // 1/1=1, 2/2=1, 3/3=1 — all exact, but test the rounding mechanism
    expect(avg[0].p1_avg).toBe(1);
    expect(avg[1].p1_avg).toBe(1);
    expect(avg[2].p1_avg).toBe(1);
  });

  it('rounds fractional averages to 2 decimals', () => {
    const rows: ChartRow[] = [
      { label: 'Apr 1', p1: 1 },
      { label: 'Apr 2', p1: 0 },
      { label: 'Apr 3', p1: 0 },
    ];
    const singleKey: SeriesKey[] = [{ id: 'p1', label: 'A' }];
    const avg = buildAvgRows(rows, singleKey);

    expect(avg[1].p1_avg).toBe(0.5);     // 1/2
    expect(avg[2].p1_avg).toBe(0.33);    // 1/3 → 0.33
  });
});

// ---------------------------------------------------------------------------
// mergeChartData
// ---------------------------------------------------------------------------
describe('mergeChartData', () => {
  const keys: SeriesKey[] = [
    { id: 'p1', label: 'A' },
    { id: 'p2', label: 'B' },
  ];

  it('merges rows and avg rows together', () => {
    const rows: ChartRow[] = [{ label: 'Apr 1', p1: 10, p2: 5 }];
    const avgRows: ChartRow[] = [{ label: 'Apr 1', p1_avg: 10, p2_avg: 5, _total_avg: 15 }];

    const data = mergeChartData(rows, avgRows, keys, new Set());
    expect(data[0].p1).toBe(10);
    expect(data[0].p1_avg).toBe(10);
    expect(data[0]._total_avg).toBe(15);
  });

  it('recomputes _total_avg excluding hidden series', () => {
    const rows: ChartRow[] = [{ label: 'Apr 1', p1: 10, p2: 5 }];
    const avgRows: ChartRow[] = [{ label: 'Apr 1', p1_avg: 10, p2_avg: 5, _total_avg: 15 }];

    const hidden = new Set(['p2']);
    const data = mergeChartData(rows, avgRows, keys, hidden);
    // Only p1_avg=10 is visible
    expect(data[0]._total_avg).toBe(10);
  });

  it('sets _total_avg to 0 when all series are hidden', () => {
    const rows: ChartRow[] = [{ label: 'Apr 1', p1: 10, p2: 5 }];
    const avgRows: ChartRow[] = [{ label: 'Apr 1', p1_avg: 10, p2_avg: 5, _total_avg: 15 }];

    const hidden = new Set(['p1', 'p2']);
    const data = mergeChartData(rows, avgRows, keys, hidden);
    expect(data[0]._total_avg).toBe(0);
  });

  it('returns rows as-is when avgRows is the same reference (no averages)', () => {
    const rows: ChartRow[] = [{ label: 'Apr 1', p1: 10 }];
    const data = mergeChartData(rows, rows, keys, new Set());
    expect(data[0]).toEqual({ label: 'Apr 1', p1: 10 });
    expect(data[0]._total_avg).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// computeYMax
// ---------------------------------------------------------------------------
describe('computeYMax', () => {
  const keys: SeriesKey[] = [
    { id: 'p1', label: 'A' },
    { id: 'p2', label: 'B' },
  ];

  it('stacked mode: max is sum of all series per period', () => {
    const rows: ChartRow[] = [
      { label: 'Apr 1', p1: 5, p2: 3 },
      { label: 'Apr 2', p1: 2, p2: 1 },
    ];
    // Stacked: max period sum = 5+3=8
    expect(computeYMax(rows, keys, 'stacked')).toBe(8);
  });

  it('grouped mode: max is single highest value', () => {
    const rows: ChartRow[] = [
      { label: 'Apr 1', p1: 5, p2: 3 },
      { label: 'Apr 2', p1: 2, p2: 7 },
    ];
    // Grouped: max single = 7
    expect(computeYMax(rows, keys, 'grouped')).toBe(7);
  });

  it('returns 0 for empty rows', () => {
    expect(computeYMax([], keys, 'stacked')).toBe(0);
  });

  it('returns 0 when all values are 0', () => {
    const rows: ChartRow[] = [{ label: 'Apr 1', p1: 0, p2: 0 }];
    expect(computeYMax(rows, keys, 'stacked')).toBe(0);
  });

  it('treats missing series values as 0', () => {
    const rows: ChartRow[] = [{ label: 'Apr 1', p1: 4 }]; // p2 missing
    expect(computeYMax(rows, keys, 'stacked')).toBe(4);
  });

  it('ceils fractional values', () => {
    const rows: ChartRow[] = [{ label: 'Apr 1', p1: 3.2, p2: 4.1 }];
    // Stacked: 3.2+4.1=7.3 → ceil → 8
    expect(computeYMax(rows, keys, 'stacked')).toBe(8);
    // Grouped: max(3.2, 4.1) = 4.1 → ceil → 5
    expect(computeYMax(rows, keys, 'grouped')).toBe(5);
  });

  it('works with single series', () => {
    const singleKey: SeriesKey[] = [{ id: 'p1', label: 'A' }];
    const rows: ChartRow[] = [
      { label: 'Apr 1', p1: 10 },
      { label: 'Apr 2', p1: 15 },
    ];
    // Both modes should give 15 with single series
    expect(computeYMax(rows, singleKey, 'stacked')).toBe(15);
    expect(computeYMax(rows, singleKey, 'grouped')).toBe(15);
  });
});
