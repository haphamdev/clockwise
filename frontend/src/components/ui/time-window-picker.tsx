import { useState, useCallback } from 'react';
import { CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { TimeWindowPresets } from '@/components/ui/time-window-presets';
import { TimeWindowCustom } from '@/components/ui/time-window-custom';
import {
  formatTimeWindowLabel,
  type TimeWindow,
  type TimeWindowPreset,
} from '@/lib/dates/time-window-utils';

export type DraftSource = 'preset' | 'rolling' | 'calendar';

export interface Draft {
  dateFrom: string;
  dateTo: string;
  preset?: TimeWindowPreset;
  source: DraftSource;
  calendarPendingFrom?: string;
}

function makeDraft(value: TimeWindow): Draft {
  return {
    dateFrom: value.dateFrom,
    dateTo: value.dateTo,
    preset: value.preset,
    source: value.preset ? 'preset' : 'calendar',
  };
}

interface TimeWindowPickerProps {
  value: TimeWindow;
  onChange: (window: TimeWindow) => void;
  allowFutureDates?: boolean;
  className?: string;
}

export function TimeWindowPicker({
  value,
  onChange,
  allowFutureDates = false,
  className,
}: TimeWindowPickerProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Draft>(() => makeDraft(value));
  const [activePreset, setActivePreset] = useState<TimeWindowPreset | null>(
    value.preset ?? null,
  );

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (nextOpen) {
        setDraft(makeDraft({ ...value, preset: activePreset ?? value.preset }));
      }
      setOpen(nextOpen);
    },
    [value, activePreset],
  );

  const handleApply = useCallback(() => {
    const window: TimeWindow = {
      dateFrom: draft.dateFrom,
      dateTo: draft.dateTo,
      preset: draft.preset,
    };
    setActivePreset(draft.preset ?? null);
    onChange(window);
    setOpen(false);
  }, [draft, onChange]);

  const isMidClick = !!draft.calendarPendingFrom;

  const enriched: TimeWindow = activePreset
    ? { ...value, preset: activePreset }
    : value;

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="outline" className={className}>
          <CalendarDays className="mr-1.5 h-4 w-4" />
          {formatTimeWindowLabel(enriched)}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0">
        <div className="p-3 pb-0">
          <TimeWindowPresets draft={draft} onDraftChange={setDraft} />
        </div>
        <Separator className="my-2" />
        <TimeWindowCustom
          draft={draft}
          onDraftChange={setDraft}
          allowFutureDates={allowFutureDates}
        />
        <Separator />
        <div className="flex justify-end p-3">
          <Button size="sm" onClick={handleApply} disabled={isMidClick}>
            Apply
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
