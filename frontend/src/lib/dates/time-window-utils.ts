import {
  format,
  subDays,
  subWeeks,
  subMonths,
  subQuarters,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfQuarter,
  endOfQuarter,
  isSameDay,
} from 'date-fns';

export interface TimeWindow {
  dateFrom: string; // YYYY-MM-DD
  dateTo: string; // YYYY-MM-DD
}

export type TimeWindowPreset =
  | 'today'
  | 'yesterday'
  | 'this-week'
  | 'last-week'
  | 'this-month'
  | 'last-month'
  | 'this-quarter'
  | 'last-quarter';

export type RollingUnit = 'days' | 'weeks' | 'months';

export function formatDateISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function parseDateISO(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

const weekOpts = { weekStartsOn: 1 as const };

export function resolvePreset(
  preset: TimeWindowPreset,
  today = new Date(),
): TimeWindow {
  switch (preset) {
    case 'today':
      return { dateFrom: formatDateISO(today), dateTo: formatDateISO(today) };
    case 'yesterday': {
      const d = subDays(today, 1);
      return { dateFrom: formatDateISO(d), dateTo: formatDateISO(d) };
    }
    case 'this-week':
      return { dateFrom: formatDateISO(startOfWeek(today, weekOpts)), dateTo: formatDateISO(today) };
    case 'last-week': {
      const prev = subWeeks(today, 1);
      return {
        dateFrom: formatDateISO(startOfWeek(prev, weekOpts)),
        dateTo: formatDateISO(endOfWeek(prev, weekOpts)),
      };
    }
    case 'this-month':
      return { dateFrom: formatDateISO(startOfMonth(today)), dateTo: formatDateISO(today) };
    case 'last-month': {
      const prev = subMonths(today, 1);
      return {
        dateFrom: formatDateISO(startOfMonth(prev)),
        dateTo: formatDateISO(endOfMonth(prev)),
      };
    }
    case 'this-quarter':
      return { dateFrom: formatDateISO(startOfQuarter(today)), dateTo: formatDateISO(today) };
    case 'last-quarter': {
      const prev = subQuarters(today, 1);
      return {
        dateFrom: formatDateISO(startOfQuarter(prev)),
        dateTo: formatDateISO(endOfQuarter(prev)),
      };
    }
  }
}

export function resolveRolling(
  n: number,
  unit: RollingUnit,
  today = new Date(),
): TimeWindow {
  const sub = unit === 'days' ? subDays : unit === 'weeks' ? subWeeks : subMonths;
  return { dateFrom: formatDateISO(sub(today, n)), dateTo: formatDateISO(today) };
}

export function defaultTimeWindow(today = new Date()): TimeWindow {
  return resolveRolling(30, 'days', today);
}

const PRESET_LABELS: Record<TimeWindowPreset, string> = {
  today: 'Today',
  yesterday: 'Yesterday',
  'this-week': 'This week',
  'last-week': 'Last week',
  'this-month': 'This month',
  'last-month': 'Last month',
  'this-quarter': 'This quarter',
  'last-quarter': 'Last quarter',
};

const ALL_PRESETS = Object.keys(PRESET_LABELS) as TimeWindowPreset[];

export { PRESET_LABELS, ALL_PRESETS };

export function formatTimeWindowLabel(
  window: TimeWindow,
  today = new Date(),
): string {
  for (const preset of ALL_PRESETS) {
    const resolved = resolvePreset(preset, today);
    if (resolved.dateFrom === window.dateFrom && resolved.dateTo === window.dateTo) {
      return PRESET_LABELS[preset];
    }
  }

  const from = parseDateISO(window.dateFrom);
  const to = parseDateISO(window.dateTo);

  if (isSameDay(from, to)) {
    return format(from, 'MMM d, yyyy');
  }

  if (from.getFullYear() === to.getFullYear()) {
    return `${format(from, 'MMM d')} – ${format(to, 'MMM d, yyyy')}`;
  }

  return `${format(from, 'MMM d, yyyy')} – ${format(to, 'MMM d, yyyy')}`;
}
