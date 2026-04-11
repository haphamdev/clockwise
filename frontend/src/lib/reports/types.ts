export type ReportGroupBy = "user" | "project" | "team";
export type ReportGranularity = "day" | "week" | "month" | "quarter";

export interface ReportBaseParams {
  dateFrom: string;
  dateTo: string;
  teamIds?: string[];
  userIds?: string[];
  projectIds?: string[];
}

export interface TimeSeriesParams extends ReportBaseParams {
  granularity: ReportGranularity;
  groupBy: ReportGroupBy;
  stackBy?: ReportGroupBy;
}

export interface WeekdayDistributionParams extends ReportBaseParams {
  groupBy: ReportGroupBy;
}

export type LoggingDelayParams = ReportBaseParams;
export type SummaryParams = ReportBaseParams;

// Response types

export interface TimeSeriesBreakdownItem {
  id: string;
  label: string;
  value: number;
}

export interface TimeSeriesItem {
  id: string;
  label: string;
  value: number;
  breakdown?: TimeSeriesBreakdownItem[];
}

export interface TimeSeriesBucket {
  periodStart: string;
  periodEnd: string;
  series: TimeSeriesItem[];
}

export interface TimeSeriesResponse {
  buckets: TimeSeriesBucket[];
  summary: { totalHours: number; entries: number };
}

export interface WeekdayRow {
  id: string;
  label: string;
  weekdays: number[];
}

export interface WeekdayDistributionResponse {
  rows: WeekdayRow[];
  totals: number[];
}

export interface LoggingDelayBucket {
  label: string;
  maxDays: number | null;
  count: number;
  percentage: number;
}

export interface LoggingDelayResponse {
  buckets: LoggingDelayBucket[];
}

export interface SummaryResponse {
  totalHours: number;
  avgHoursPerDay: number;
  uniqueProjects: number;
  uniqueUsers: number;
  uniqueTeams: number;
  totalEntries: number;
}

export type AnomaliesParams = ReportBaseParams;

export type AnomalySeverity = "warning" | "critical";

export interface AnomalyEntry {
  userId: string;
  userName: string;
  date: string;
  weekday: number;
  totalHours: number;
  severity: AnomalySeverity;
}

export interface AnomaliesResponse {
  entries: AnomalyEntry[];
  thresholds: { warningHigh: number; criticalHigh: number };
}

export type DelayHeatmapParams = ReportBaseParams;

export interface DelayHeatmapCell {
  userId: string;
  userName: string;
  weekday: number;
  p75Delay: number;
  entryCount: number;
}

export interface DelayHeatmapResponse {
  cells: DelayHeatmapCell[];
  minEntries: number;
}
