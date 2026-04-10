export type DateFormat = 'YYYY-MM-DD' | 'DD/MM/YYYY' | 'MM/DD/YYYY';
export type TimeFormat = '12h' | '24h';

export interface OrgSettings {
  orgName: string;
  expectedHoursPerWeek: number;
  dailyWarningThreshold: number;
  weeklyWarningThreshold: number;
  dateFormat: DateFormat;
  timeFormat: TimeFormat;
  csvMaxRows: number;
  trackSaturday: boolean;
  trackSunday: boolean;
}

export interface UpdateOrgSettingsPayload {
  orgName?: string;
  expectedHoursPerWeek?: number;
  dailyWarningThreshold?: number;
  weeklyWarningThreshold?: number;
  dateFormat?: DateFormat;
  timeFormat?: TimeFormat;
  csvMaxRows?: number;
  trackSaturday?: boolean;
  trackSunday?: boolean;
}
