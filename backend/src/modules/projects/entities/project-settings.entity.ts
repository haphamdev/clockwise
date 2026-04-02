export interface ProjectSettingsEntity {
  dailyHourLimit: number | null;
  weeklyHourLimit: number | null;
}

export const DEFAULT_PROJECT_SETTINGS: ProjectSettingsEntity = {
  dailyHourLimit: null,
  weeklyHourLimit: null,
};
