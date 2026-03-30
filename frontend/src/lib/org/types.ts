export type DateFormat = 'YYYY-MM-DD' | 'DD/MM/YYYY' | 'MM/DD/YYYY';

export interface OrgSettings {
  orgName: string;
  expectedHoursPerWeek: number;
  dailyWarningThreshold: number;
  weeklyWarningThreshold: number;
  dateFormat: DateFormat;
  csvMaxRows: number;
}

export interface UpdateOrgSettingsPayload {
  orgName?: string;
  expectedHoursPerWeek?: number;
  dailyWarningThreshold?: number;
  weeklyWarningThreshold?: number;
  dateFormat?: DateFormat;
  csvMaxRows?: number;
}
