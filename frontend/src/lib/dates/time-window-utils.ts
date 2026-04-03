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
  preset?: TimeWindowPreset;
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
      return { dateFrom: formatDateISO(today), dateTo: formatDateISO(today), preset };
    case 'yesterday': {
      const d = subDays(today, 1);
      return { dateFrom: formatDateISO(d), dateTo: formatDateISO(d), preset };
    }
    case 'this-week':
      return { dateFrom: formatDateISO(startOfWeek(today, weekOpts)), dateTo: formatDateISO(today), preset };
    case 'last-week': {
      const prev = subWeeks(today, 1);
      return {
        dateFrom: formatDateISO(startOfWeek(prev, weekOpts)),
        dateTo: formatDateISO(endOfWeek(prev, weekOpts)),
        preset,
      };
    }
    case 'this-month':
      return { dateFrom: formatDateISO(startOfMonth(today)), dateTo: formatDateISO(today), preset };
    case 'last-month': {
      const prev = subMonths(today, 1);
      return {
        dateFrom: formatDateISO(startOfMonth(prev)),
        dateTo: formatDateISO(endOfMonth(prev)),
        preset,
      };
    }
    case 'this-quarter':
      return { dateFrom: formatDateISO(startOfQuarter(today)), dateTo: formatDateISO(today), preset };
    case 'last-quarter': {
      const prev = subQuarters(today, 1);
      return {
        dateFrom: formatDateISO(startOfQuarter(prev)),
        dateTo: formatDateISO(endOfQuarter(prev)),
        preset,
      };
    }
  }
}

export const PRESET_LABELS: Record<TimeWindowPreset, string> = {
  today: 'Today',
  yesterday: 'Yesterday',
  'this-week': 'This week',
  'last-week': 'Last week',
  'this-month': 'This month',
  'last-month': 'Last month',
  'this-quarter': 'This quarter',
  'last-quarter': 'Last quarter',
};

export const ALL_PRESETS = Object.keys(PRESET_LABELS) as TimeWindowPreset[];

export const ROLLING_MAX: Record<RollingUnit, number> = {
  days: 365,
  weeks: 52,
  months: 24,
};

export function resolveRolling(
  n: number,
  unit: RollingUnit,
  today = new Date(),
): TimeWindow {
  const sub = unit === 'days' ? subDays : unit === 'weeks' ? subWeeks : subMonths;
  return { dateFrom: formatDateISO(sub(today, n)), dateTo: formatDateISO(today) };
}

export function isPresetMatch(window: TimeWindow): boolean {
  return window.preset !== undefined;
}

export function detectRolling(
  window: TimeWindow,
  today = new Date(),
): { n: number; unit: RollingUnit } | null {
  if (window.dateTo !== formatDateISO(today)) return null;

  // Try months first (1-24)
  for (let n = 1; n <= ROLLING_MAX.months; n++) {
    if (resolveRolling(n, 'months', today).dateFrom === window.dateFrom) {
      return { n, unit: 'months' };
    }
  }

  // Calculate day difference using midnight dates to avoid time-of-day drift
  const from = parseDateISO(window.dateFrom);
  const todayMidnight = parseDateISO(window.dateTo);
  const diffDays = Math.round(
    (todayMidnight.getTime() - from.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (diffDays > 0 && diffDays % 7 === 0) {
    return { n: diffDays / 7, unit: 'weeks' };
  }

  if (diffDays > 0) {
    return { n: diffDays, unit: 'days' };
  }

  return null;
}

export function defaultTimeWindow(today = new Date()): TimeWindow {
  return resolveRolling(30, 'days', today);
}

export function formatTimeWindowLabel(window: TimeWindow): string {
  if (window.preset) {
    return PRESET_LABELS[window.preset];
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
