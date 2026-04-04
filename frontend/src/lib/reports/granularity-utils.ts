import type { ReportGranularity } from './types';

export const GRANULARITY_OPTIONS: { value: ReportGranularity; label: string }[] = [
  { value: 'day', label: 'D' },
  { value: 'week', label: 'W' },
  { value: 'month', label: 'M' },
  { value: 'quarter', label: 'Q' },
];

/** Pick a sensible default granularity based on the date range width. */
export function autoGranularity(dateFrom: string, dateTo: string): ReportGranularity {
  const from = new Date(dateFrom + 'T00:00:00');
  const to = new Date(dateTo + 'T00:00:00');
  const days = Math.round((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));

  if (days <= 14) return 'day';
  if (days <= 90) return 'week';
  if (days <= 365) return 'month';
  return 'quarter';
}

/** Format a period start date for chart x-axis labels. */
export function formatPeriodLabel(dateStr: string, granularity: ReportGranularity): string {
  const d = new Date(dateStr + 'T00:00:00');
  const month = d.toLocaleString('en', { month: 'short' });
  const day = d.getDate();

  switch (granularity) {
    case 'day':
      return `${month} ${day}`;
    case 'week':
      return `${month} ${day}`;
    case 'month':
      return `${month} ${d.getFullYear().toString().slice(2)}`;
    case 'quarter': {
      const q = Math.floor(d.getMonth() / 3) + 1;
      return `Q${q} ${d.getFullYear().toString().slice(2)}`;
    }
  }
}
