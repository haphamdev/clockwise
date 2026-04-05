import { useState, useEffect, useRef } from 'react';
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
  PRESET_LABELS,
  ROLLING_MAX,
  type TimeWindowPreset,
  type RollingUnit,
} from '@/lib/dates/time-window-utils';
import type { Draft } from '@/components/ui/time-window-picker';

const ROW_1: TimeWindowPreset[] = ['today', 'this-week', 'this-month', 'this-quarter'];
const ROW_2: TimeWindowPreset[] = ['yesterday', 'last-week', 'last-month', 'last-quarter'];

interface TimeWindowPresetsProps {
  draft: Draft;
  onDraftChange: (draft: Draft) => void;
}

export function TimeWindowPresets({ draft, onDraftChange }: TimeWindowPresetsProps) {
  const today = new Date();
  const detected =
    !isPresetMatch(draft) ? detectRolling(draft, today) : null;
  const [rollingN, setRollingN] = useState(detected ? String(detected.n) : '7');
  const [rollingUnit, setRollingUnit] = useState<RollingUnit>(detected?.unit ?? 'days');
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Sync rolling inputs when draft changes from outside (e.g. popover reopen)
  useEffect(() => {
    const det = !isPresetMatch(draft) ? detectRolling(draft, new Date()) : null;
    if (det) {
      setRollingN(String(det.n));
      setRollingUnit(det.unit);
    }
  }, [draft.dateFrom, draft.dateTo, draft.preset]);

  const applyRolling = (n: number, unit: RollingUnit) => {
    if (!n || n <= 0) return;
    const clamped = Math.min(n, ROLLING_MAX[unit]);
    const resolved = resolveRolling(clamped, unit, today);
    onDraftChange({
      dateFrom: resolved.dateFrom,
      dateTo: resolved.dateTo,
      source: 'rolling',
    });
  };

  const handleNumberChange = (raw: string) => {
    const v = raw.replace(/\D/g, '').slice(0, 3);
    setRollingN(v);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const n = parseInt(v, 10);
      if (n > 0) applyRolling(n, rollingUnit);
    }, 300);
  };

  const handleUnitChange = (unit: RollingUnit) => {
    setRollingUnit(unit);
    const n = parseInt(rollingN, 10);
    if (n > 0) applyRolling(n, unit);
  };

  useEffect(() => () => clearTimeout(debounceRef.current), []);

  const handlePresetClick = (preset: TimeWindowPreset) => {
    const resolved = resolvePreset(preset, today);
    onDraftChange({
      dateFrom: resolved.dateFrom,
      dateTo: resolved.dateTo,
      preset,
      source: 'preset',
    });
  };

  const isActive = (preset: TimeWindowPreset) =>
    draft.source === 'preset' && draft.preset === preset;

  const renderPresetButton = (preset: TimeWindowPreset) => (
    <Button
      key={preset}
      variant={isActive(preset) ? 'secondary' : 'ghost'}
      size="sm"
      className="justify-start text-xs"
      onClick={() => handlePresetClick(preset)}
    >
      {PRESET_LABELS[preset]}
    </Button>
  );

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-4 gap-1">
        {ROW_1.map(renderPresetButton)}
        {ROW_2.map(renderPresetButton)}
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
            onChange={(e) => handleNumberChange(e.target.value)}
            className="w-16 h-8 text-sm"
          />
          <Select value={rollingUnit} onValueChange={(v) => handleUnitChange(v as RollingUnit)}>
            <SelectTrigger className="w-24 h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="days">days</SelectItem>
              <SelectItem value="weeks">weeks</SelectItem>
              <SelectItem value="months">months</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
