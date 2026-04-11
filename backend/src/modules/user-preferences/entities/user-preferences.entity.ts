export type DateFormat = "YYYY-MM-DD" | "DD/MM/YYYY" | "MM/DD/YYYY";
export type TimeFormat = "12h" | "24h";
export type Theme = "light" | "dark" | "system";
export type WeekStartDay = "monday" | "sunday";

export interface UserPreferencesEntity {
  theme: Theme;
  dateFormat: DateFormat | null;
  timeFormat: TimeFormat | null;
  timezone: string;
  defaultProjectId: string | null;
  weekStartDay: WeekStartDay;
}

export const DEFAULT_USER_PREFERENCES: UserPreferencesEntity = {
  theme: "system",
  dateFormat: null,
  timeFormat: null,
  timezone: "UTC",
  defaultProjectId: null,
  weekStartDay: "monday",
};
