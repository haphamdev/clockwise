import { useState, useEffect } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { formatDateISO, parseDateISO } from '@/lib/dates/time-window-utils';
import type { DateRange } from 'react-day-picker';
import type { Draft } from '@/components/ui/time-window-picker';

interface TimeWindowCustomProps {
  draft: Draft;
  onDraftChange: (draft: Draft) => void;
  allowFutureDates?: boolean;
}

export function TimeWindowCustom({
  draft,
  onDraftChange,
  allowFutureDates = false,
}: TimeWindowCustomProps) {
  const [month, setMonth] = useState(() => parseDateISO(draft.dateFrom));

  // Scroll calendar to draft.dateFrom when changed by preset/rolling
  useEffect(() => {
    if (draft.source !== 'calendar') {
      setMonth(parseDateISO(draft.dateFrom));
    }
  }, [draft.dateFrom, draft.source]);

  const selected: DateRange = draft.calendarPendingFrom
    ? { from: parseDateISO(draft.calendarPendingFrom), to: undefined }
    : { from: parseDateISO(draft.dateFrom), to: parseDateISO(draft.dateTo) };

  const handleDayClick = (day: Date) => {
    if (!draft.calendarPendingFrom) {
      // First click — start fresh custom range
      onDraftChange({
        dateFrom: draft.dateFrom,
        dateTo: draft.dateTo,
        source: 'calendar',
        calendarPendingFrom: formatDateISO(day),
      });
    } else {
      // Second click — resolve range
      const first = parseDateISO(draft.calendarPendingFrom);
      const [start, end] = first <= day ? [first, day] : [day, first];
      onDraftChange({
        dateFrom: formatDateISO(start),
        dateTo: formatDateISO(end),
        source: 'calendar',
      });
    }
  };

  return (
    <div className="flex justify-center px-3">
      <Calendar
        mode="range"
        selected={selected}
        onSelect={() => {}}
        onDayClick={handleDayClick}
        month={month}
        onMonthChange={setMonth}
        numberOfMonths={1}
        fixedWeeks
        disabled={!allowFutureDates ? { after: new Date() } : undefined}
        weekStartsOn={1}
      />
    </div>
  );
}
