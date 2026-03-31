export interface OrgSettingsEntity {
  orgName: string;
  expectedHoursPerWeek: number;
  dailyWarningThreshold: number;
  weeklyWarningThreshold: number;
  dateFormat: 'YYYY-MM-DD' | 'DD/MM/YYYY' | 'MM/DD/YYYY';
  timeFormat: '12h' | '24h';
  csvMaxRows: number;
}

export const DEFAULT_ORG_SETTINGS: Omit<OrgSettingsEntity, 'orgName'> = {
  expectedHoursPerWeek: 40,
  dailyWarningThreshold: 12,
  weeklyWarningThreshold: 60,
  dateFormat: 'YYYY-MM-DD',
  timeFormat: '12h',
  csvMaxRows: 500,
};
