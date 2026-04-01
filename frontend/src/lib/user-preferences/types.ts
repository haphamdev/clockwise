import type { DateFormat, TimeFormat } from '@/lib/org/types';

export type Theme = 'light' | 'dark' | 'system';
export type WeekStartDay = 'monday' | 'sunday';

export interface UserPreferences {
  theme: Theme;
  dateFormat: DateFormat | null;
  timeFormat: TimeFormat | null;
  timezone: string;
  defaultProjectId: string | null;
  weekStartDay: WeekStartDay;
}

export interface UpdateUserPreferencesPayload {
  theme?: Theme;
  dateFormat?: DateFormat | null;
  timeFormat?: TimeFormat | null;
  timezone?: string;
  defaultProjectId?: string | null;
  weekStartDay?: WeekStartDay;
}
