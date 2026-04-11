import { apiClient } from "@/lib/api-client";
import type {
  AnomaliesParams,
  AnomaliesResponse,
  DelayHeatmapParams,
  DelayHeatmapResponse,
  LoggingDelayParams,
  LoggingDelayResponse,
  ReportBaseParams,
  SummaryParams,
  SummaryResponse,
  TimeSeriesParams,
  TimeSeriesResponse,
  WeekdayDistributionParams,
  WeekdayDistributionResponse,
} from "./types";

function buildSearchParams(params: ReportBaseParams): URLSearchParams {
  const sp = new URLSearchParams();
  sp.set("dateFrom", params.dateFrom);
  sp.set("dateTo", params.dateTo);
  if (params.teamIds?.length) sp.set("teamIds", params.teamIds.join(","));
  if (params.userIds?.length) sp.set("userIds", params.userIds.join(","));
  if (params.projectIds?.length)
    sp.set("projectIds", params.projectIds.join(","));
  return sp;
}

export function fetchTimeSeries(params: TimeSeriesParams) {
  const sp = buildSearchParams(params);
  sp.set("granularity", params.granularity);
  sp.set("groupBy", params.groupBy);
  if (params.stackBy) sp.set("stackBy", params.stackBy);
  return apiClient<TimeSeriesResponse>(`/reports/time-series?${sp.toString()}`);
}

export function fetchWeekdayDistribution(params: WeekdayDistributionParams) {
  const sp = buildSearchParams(params);
  sp.set("groupBy", params.groupBy);
  return apiClient<WeekdayDistributionResponse>(
    `/reports/weekday-distribution?${sp.toString()}`,
  );
}

export function fetchLoggingDelay(params: LoggingDelayParams) {
  const sp = buildSearchParams(params);
  return apiClient<LoggingDelayResponse>(
    `/reports/logging-delay?${sp.toString()}`,
  );
}

export function fetchReportSummary(params: SummaryParams) {
  const sp = buildSearchParams(params);
  return apiClient<SummaryResponse>(`/reports/summary?${sp.toString()}`);
}

export function fetchAnomalies(params: AnomaliesParams) {
  const sp = buildSearchParams(params);
  return apiClient<AnomaliesResponse>(`/reports/anomalies?${sp.toString()}`);
}

export function fetchDelayHeatmap(params: DelayHeatmapParams) {
  const sp = buildSearchParams(params);
  return apiClient<DelayHeatmapResponse>(
    `/reports/logging-delay-heatmap?${sp.toString()}`,
  );
}
