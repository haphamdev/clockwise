import { useTheme } from 'next-themes';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useUpdateUserPreferences } from '@/lib/user-preferences/use-update-user-preferences';
import type { Theme } from '@/lib/user-preferences/types';

const THEME_OPTIONS: { value: Theme; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
];

export function ThemePreferenceForm({ currentTheme }: { currentTheme: Theme }) {
  const { setTheme } = useTheme();
  const { mutate, isPending } = useUpdateUserPreferences();

  function handleChange(value: string) {
    const theme = value as Theme;
    setTheme(theme);
    mutate({ theme });
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Theme</label>
      <Select value={currentTheme} onValueChange={handleChange} disabled={isPending}>
        <SelectTrigger className="w-48">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {THEME_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-xs text-muted-foreground">
        Choose how the app looks. System follows your OS preference.
      </p>
    </div>
  );
}
