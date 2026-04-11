import type {
  AnomaliesParams,
  DelayHeatmapParams,
  LoggingDelayParams,
  SummaryParams,
  TimeSeriesParams,
  WeekdayDistributionParams,
} from "./types";

export const reportsKeys = {
  all: ["reports"] as const,
  timeSeries: (params: TimeSeriesParams) =>
    [...reportsKeys.all, "time-series", params] as const,
  weekdayDistribution: (params: WeekdayDistributionParams) =>
    [...reportsKeys.all, "weekday-distribution", params] as const,
  loggingDelay: (params: LoggingDelayParams) =>
    [...reportsKeys.all, "logging-delay", params] as const,
  summary: (params: SummaryParams) =>
    [...reportsKeys.all, "summary", params] as const,
  anomalies: (params: AnomaliesParams) =>
    [...reportsKeys.all, "anomalies", params] as const,
  delayHeatmap: (params: DelayHeatmapParams) =>
    [...reportsKeys.all, "delay-heatmap", params] as const,
};
