import { useState } from 'react';
import { CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TimeWindowPresets } from '@/components/ui/time-window-presets';
import { TimeWindowCustom } from '@/components/ui/time-window-custom';
import {
  formatTimeWindowLabel,
  type TimeWindow,
  type TimeWindowPreset,
} from '@/lib/dates/time-window-utils';

type Tab = 'presets' | 'custom';

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
  const [activePreset, setActivePreset] = useState<TimeWindowPreset | null>(
    value.preset ?? null,
  );
  const [lastTab, setLastTab] = useState<Tab>(value.preset ? 'presets' : 'custom');

  const handlePresetChange = (window: TimeWindow) => {
    setActivePreset(window.preset ?? null);
    setLastTab('presets');
    onChange(window);
    setOpen(false);
  };

  const handleCustomChange = (window: TimeWindow) => {
    setActivePreset(null);
    setLastTab('custom');
    onChange(window);
    setOpen(false);
  };

  const enriched: TimeWindow = activePreset
    ? { ...value, preset: activePreset }
    : value;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className={className}>
          <CalendarDays className="mr-1.5 h-4 w-4" />
          {formatTimeWindowLabel(enriched)}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0">
        <Tabs defaultValue={lastTab} key={lastTab}>
          <TabsList className="w-full">
            <TabsTrigger value="presets" className="flex-1">Presets</TabsTrigger>
            <TabsTrigger value="custom" className="flex-1">Custom Range</TabsTrigger>
          </TabsList>
          <TabsContent value="presets" className="mt-0">
            <TimeWindowPresets value={enriched} onChange={handlePresetChange} />
          </TabsContent>
          <TabsContent value="custom" className="mt-0">
            <TimeWindowCustom
              value={enriched}
              onChange={handleCustomChange}
              allowFutureDates={allowFutureDates}
            />
          </TabsContent>
        </Tabs>
      </PopoverContent>
    </Popover>
  );
}
