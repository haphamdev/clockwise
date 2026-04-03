import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  resolvePreset,
  resolveRolling,
  detectRolling,
  isPresetMatch,
  ALL_PRESETS,
  PRESET_LABELS,
  ROLLING_MAX,
  type TimeWindow,
  type TimeWindowPreset,
  type RollingUnit,
} from '@/lib/dates/time-window-utils';

interface TimeWindowPresetsProps {
  value: TimeWindow;
  onChange: (window: TimeWindow) => void;
}

function isActivePreset(preset: TimeWindowPreset, value: TimeWindow) {
  return value.preset === preset;
}

export function TimeWindowPresets({ value, onChange }: TimeWindowPresetsProps) {
  const today = new Date();
  const detected = isPresetMatch(value) ? null : detectRolling(value, today);
  const [rollingN, setRollingN] = useState(detected ? String(detected.n) : '7');
  const [rollingUnit, setRollingUnit] = useState<RollingUnit>(detected?.unit ?? 'days');

  const handlePresetClick = (preset: TimeWindowPreset) => {
    onChange(resolvePreset(preset, today));
  };

  const handleRollingApply = () => {
    const n = parseInt(rollingN, 10);
    if (!n || n <= 0) return;
    const clamped = Math.min(n, ROLLING_MAX[rollingUnit]);
    setRollingN(String(clamped));
    onChange(resolveRolling(clamped, rollingUnit, today));
  };

  return (
    <div className="p-3 space-y-3">
      <div className="grid grid-cols-2 gap-1.5">
        {ALL_PRESETS.map((preset) => (
          <Button
            key={preset}
            variant={isActivePreset(preset, value) ? 'secondary' : 'ghost'}
            size="sm"
            className="justify-start text-xs"
            onClick={() => handlePresetClick(preset)}
          >
            {PRESET_LABELS[preset]}
          </Button>
        ))}
      </div>

      <Separator />

      <div>
        <Label className="text-xs text-muted-foreground">Rolling window</Label>
        <div className="flex items-center gap-2 mt-1.5">
          <span className="text-sm text-muted-foreground">Last</span>
          <Input
            type="text"
            inputMode="numeric"
            value={rollingN}
            onChange={(e) => {
              const v = e.target.value.replace(/\D/g, '').slice(0, 3);
              setRollingN(v);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRollingApply();
            }}
            className="w-16 h-8 text-sm"
          />
          <Select value={rollingUnit} onValueChange={(v) => setRollingUnit(v as RollingUnit)}>
            <SelectTrigger className="w-24 h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="days">days</SelectItem>
              <SelectItem value="weeks">weeks</SelectItem>
              <SelectItem value="months">months</SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" variant="outline" className="h-8" onClick={handleRollingApply}>
            Apply
          </Button>
        </div>
      </div>
    </div>
  );
}
