import type {
  TimeSeriesParams,
  WeekdayDistributionParams,
  LoggingDelayParams,
  SummaryParams,
} from './types';

export const reportsKeys = {
  all: ['reports'] as const,
  timeSeries: (params: TimeSeriesParams) => [...reportsKeys.all, 'time-series', params] as const,
  weekdayDistribution: (params: WeekdayDistributionParams) =>
    [...reportsKeys.all, 'weekday-distribution', params] as const,
  loggingDelay: (params: LoggingDelayParams) =>
    [...reportsKeys.all, 'logging-delay', params] as const,
  summary: (params: SummaryParams) => [...reportsKeys.all, 'summary', params] as const,
};
