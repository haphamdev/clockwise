import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useUpdateUserPreferences } from '@/lib/user-preferences/use-update-user-preferences';
import type { WeekStartDay } from '@/lib/user-preferences/types';

interface WeekStartPreferenceFormProps {
  currentWeekStartDay: WeekStartDay;
}

export function WeekStartPreferenceForm({
  currentWeekStartDay,
}: WeekStartPreferenceFormProps) {
  const { mutate, isPending } = useUpdateUserPreferences();

  function handleChange(value: string) {
    mutate({ weekStartDay: value as WeekStartDay });
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Week starts on</label>
      <RadioGroup
        value={currentWeekStartDay}
        onValueChange={handleChange}
        disabled={isPending}
        className="flex gap-4"
      >
        <div className="flex items-center gap-2">
          <RadioGroupItem value="monday" id="week-monday" />
          <Label htmlFor="week-monday" className="cursor-pointer">Monday</Label>
        </div>
        <div className="flex items-center gap-2">
          <RadioGroupItem value="sunday" id="week-sunday" />
          <Label htmlFor="week-sunday" className="cursor-pointer">Sunday</Label>
        </div>
      </RadioGroup>
    </div>
  );
}
