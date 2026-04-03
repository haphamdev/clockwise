import { useState } from 'react';
import { CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TimeWindowPresets } from '@/components/ui/time-window-presets';
import { TimeWindowCustom } from '@/components/ui/time-window-custom';
import { formatTimeWindowLabel, type TimeWindow } from '@/lib/dates/time-window-utils';

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

  const handleChange = (window: TimeWindow) => {
    onChange(window);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className={className}>
          <CalendarDays className="mr-1.5 h-4 w-4" />
          {formatTimeWindowLabel(value)}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0">
        <Tabs defaultValue="presets">
          <TabsList className="w-full">
            <TabsTrigger value="presets" className="flex-1">Presets</TabsTrigger>
            <TabsTrigger value="custom" className="flex-1">Custom Range</TabsTrigger>
          </TabsList>
          <TabsContent value="presets" className="mt-0">
            <TimeWindowPresets value={value} onChange={handleChange} />
          </TabsContent>
          <TabsContent value="custom" className="mt-0">
            <TimeWindowCustom
              value={value}
              onChange={handleChange}
              allowFutureDates={allowFutureDates}
            />
          </TabsContent>
        </Tabs>
      </PopoverContent>
    </Popover>
  );
}
