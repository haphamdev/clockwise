import { useEffect, useMemo, useState } from 'react';
import { format, formatDistanceToNow, differenceInDays, isToday, isYesterday } from 'date-fns';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useEffectiveFormats } from '@/lib/user-preferences/use-effective-formats';
import { DATE_TOKENS, TIME_TOKENS, toDate } from '@/lib/org/format-date';
import type { DateFormat, TimeFormat } from '@/lib/org/types';

type TimeDisplayMode = 'date' | 'datetime';

interface TimeDisplayProps {
  value: string | Date | null | undefined;
  mode?: TimeDisplayMode;
  absolute?: boolean;
  fallback?: string;
  className?: string;
}

function useRelativeTime(date: Date | null, enabled: boolean) {
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!date || !enabled) return;

    function schedule() {
      const ageMs = Date.now() - date!.getTime();
      let delay: number;
      if (ageMs < 60 * 60 * 1000) delay = 30_000;
      else if (ageMs < 24 * 60 * 60 * 1000) delay = 30 * 60_000;
      else delay = 60 * 60_000;

      return setTimeout(() => {
        setTick((t) => t + 1);
        timerId = schedule();
      }, delay);
    }

    let timerId = schedule();
    return () => clearTimeout(timerId);
  }, [date, enabled]);
}

function computeDisplay(
  date: Date,
  mode: TimeDisplayMode,
  dateFormat: DateFormat,
  timeFormat: TimeFormat,
  absolute: boolean,
): { text: string; isRelative: boolean } {
  const daysDiff = Math.abs(differenceInDays(new Date(), date));
  const showRelative = !absolute && daysDiff < 7;

  if (showRelative) {
    if (mode === 'date') {
      if (isToday(date)) return { text: 'Today', isRelative: true };
      if (isYesterday(date)) return { text: 'Yesterday', isRelative: true };
    }
    return { text: formatDistanceToNow(date, { addSuffix: true }), isRelative: true };
  }

  const dateToken = DATE_TOKENS[dateFormat];
  const text =
    mode === 'datetime'
      ? format(date, `${dateToken} ${TIME_TOKENS[timeFormat]}`)
      : format(date, dateToken);
  return { text, isRelative: false };
}

function computeTooltip(
  date: Date,
  mode: TimeDisplayMode,
  dateFormat: DateFormat,
  timeFormat: TimeFormat,
): string {
  const dateToken = DATE_TOKENS[dateFormat];
  return mode === 'date'
    ? format(date, dateToken)
    : format(date, `${dateToken} ${TIME_TOKENS[timeFormat]}`);
}

export function TimeDisplay({
  value,
  mode = 'date',
  absolute = false,
  fallback,
  className,
}: TimeDisplayProps) {
  const { dateFormat, timeFormat } = useEffectiveFormats();

  const date = useMemo(() => (value ? toDate(value) : null), [value]);
  useRelativeTime(date, !absolute);

  if (!date) {
    return fallback ? <span className={className}>{fallback}</span> : null;
  }

  const { text, isRelative } = computeDisplay(date, mode, dateFormat, timeFormat, absolute);

  if (!isRelative) {
    return <span className={className}>{text}</span>;
  }

  const tooltip = computeTooltip(date, mode, dateFormat, timeFormat);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={className}>{text}</span>
        </TooltipTrigger>
        <TooltipContent>{tooltip}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
