import { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { formatDateISO, parseDateISO, type TimeWindow } from '@/lib/dates/time-window-utils';
import type { DateRange } from 'react-day-picker';

interface TimeWindowCustomProps {
  value: TimeWindow;
  onChange: (window: TimeWindow) => void;
  allowFutureDates?: boolean;
}

export function TimeWindowCustom({
  value,
  onChange,
  allowFutureDates = false,
}: TimeWindowCustomProps) {
  // Tracks intermediate selection: first click sets `from`, second completes range
  const [draft, setDraft] = useState<DateRange | undefined>(undefined);

  const selected: DateRange = draft ?? {
    from: parseDateISO(value.dateFrom),
    to: parseDateISO(value.dateTo),
  };

  const handleDayClick = (day: Date) => {
    if (!draft) {
      // First click — start a fresh range with the exact clicked date
      setDraft({ from: day, to: undefined });
    } else if (draft.from) {
      // Second click — complete range, ensure from <= to
      const [start, end] = draft.from <= day ? [draft.from, day] : [day, draft.from];
      setDraft(undefined);
      onChange({ dateFrom: formatDateISO(start), dateTo: formatDateISO(end) });
    }
  };

  return (
    <div className="flex justify-end p-3">
      <Calendar
        mode="range"
        selected={selected}
        // No-op: bypass Calendar's built-in range selection in favor of
        // manual onDayClick two-click logic (first click = start, second = end)
        onSelect={() => {}}
        onDayClick={handleDayClick}
        numberOfMonths={1}
        disabled={!allowFutureDates ? { after: new Date() } : undefined}
        weekStartsOn={1}
      />
    </div>
  );
}
