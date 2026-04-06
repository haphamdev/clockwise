import { ApiProperty } from '@nestjs/swagger';

export class TimeSeriesBreakdownItemDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  label: string;

  @ApiProperty()
  value: number;
}

export class TimeSeriesItemDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  label: string;

  @ApiProperty()
  value: number;

  @ApiProperty({ type: [TimeSeriesBreakdownItemDto], required: false })
  breakdown?: TimeSeriesBreakdownItemDto[];
}

export class TimeSeriesBucketDto {
  @ApiProperty()
  periodStart: string;

  @ApiProperty()
  periodEnd: string;

  @ApiProperty({ type: [TimeSeriesItemDto] })
  series: TimeSeriesItemDto[];
}

export class TimeSeriesSummaryDto {
  @ApiProperty()
  totalHours: number;

  @ApiProperty()
  entries: number;
}

export class TimeSeriesResponseDto {
  @ApiProperty({ type: [TimeSeriesBucketDto] })
  buckets: TimeSeriesBucketDto[];

  @ApiProperty({ type: TimeSeriesSummaryDto })
  summary: TimeSeriesSummaryDto;
}

export class WeekdayRowDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  label: string;

  @ApiProperty({ type: [Number], description: 'Hours per weekday, index 0=Mon, 6=Sun' })
  weekdays: number[];
}

export class WeekdayDistributionResponseDto {
  @ApiProperty({ type: [WeekdayRowDto] })
  rows: WeekdayRowDto[];

  @ApiProperty({ type: [Number] })
  totals: number[];
}

export class LoggingDelayBucketDto {
  @ApiProperty()
  label: string;

  @ApiProperty({ nullable: true })
  maxDays: number | null;

  @ApiProperty()
  count: number;

  @ApiProperty()
  percentage: number;
}

export class LoggingDelayResponseDto {
  @ApiProperty({ type: [LoggingDelayBucketDto] })
  buckets: LoggingDelayBucketDto[];
}

export class SummaryResponseDto {
  @ApiProperty()
  totalHours: number;

  @ApiProperty()
  avgHoursPerDay: number;

  @ApiProperty()
  uniqueProjects: number;

  @ApiProperty()
  uniqueUsers: number;

  @ApiProperty()
  uniqueTeams: number;

  @ApiProperty()
  totalEntries: number;
}

export class AnomalyThresholdsDto {
  @ApiProperty()
  warningHigh: number;

  @ApiProperty()
  criticalHigh: number;
}

export class AnomalyEntryDto {
  @ApiProperty()
  userId: string;

  @ApiProperty()
  userName: string;

  @ApiProperty({ description: 'YYYY-MM-DD' })
  date: string;

  @ApiProperty({ description: '0=Mon, 6=Sun' })
  weekday: number;

  @ApiProperty()
  totalHours: number;

  @ApiProperty({ enum: ['warning', 'critical'] })
  severity: 'warning' | 'critical';
}

export class AnomaliesResponseDto {
  @ApiProperty({ type: [AnomalyEntryDto] })
  entries: AnomalyEntryDto[];

  @ApiProperty({ type: AnomalyThresholdsDto })
  thresholds: AnomalyThresholdsDto;
}
