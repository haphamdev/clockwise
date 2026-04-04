import { Injectable } from '@nestjs/common';
import { ReportsRepository } from './reports.repository';
import { ReportInvalidDateRangeException } from '../../common/exceptions/report.exceptions';
import type {
  TimeSeriesQueryDto,
  WeekdayDistributionQueryDto,
  LoggingDelayQueryDto,
  SummaryQueryDto,
  ReportGranularity,
} from './dto/reports-query.dto';
import type {
  TimeSeriesResponseDto,
  WeekdayDistributionResponseDto,
  LoggingDelayResponseDto,
  SummaryResponseDto,
} from './dto/reports-response.dto';

const DELAY_BUCKETS = [
  { label: 'Same day', maxDays: 0 },
  { label: '1-2 days', maxDays: 2 },
  { label: '3-5 days', maxDays: 5 },
  { label: '6+ days', maxDays: null },
] as const;

@Injectable()
export class ReportsService {
  constructor(private readonly reportsRepository: ReportsRepository) {}

  async getTimeSeries(
    orgId: string,
    userId: string,
    isAdmin: boolean,
    query: TimeSeriesQueryDto,
  ): Promise<TimeSeriesResponseDto> {
    this.validateDateRange(query.dateFrom, query.dateTo);
    const scopedUserIds = await this.resolveScopedUserIds(userId, isAdmin, query.userIds);

    const rows = await this.reportsRepository.findTimeSeries({
      orgId,
      dateFrom: query.dateFrom,
      dateTo: query.dateTo,
      granularity: query.granularity,
      groupBy: query.groupBy,
      stackBy: query.stackBy,
      userIds: scopedUserIds,
      teamIds: query.teamIds,
      projectIds: query.projectIds,
    });

    // Note: when groupBy='team', a user in multiple teams produces duplicate rows.
    // The per-series values are correct for each team, but summary.totalHours and
    // summary.entries may overcount. The frontend should use /reports/summary for
    // accurate KPI totals (that endpoint has no team-join duplication).

    // Group rows into buckets
    const bucketMap = new Map<
      string,
      {
        periodStart: string;
        seriesMap: Map<string, { id: string; label: string; value: number; breakdownMap: Map<string, { id: string; label: string; value: number }> }>;
        totalEntries: number;
      }
    >();

    let totalHours = 0;
    let totalEntries = 0;

    for (const row of rows) {
      const periodKey = row.period_start.toISOString().slice(0, 10);

      if (!bucketMap.has(periodKey)) {
        bucketMap.set(periodKey, {
          periodStart: periodKey,
          seriesMap: new Map(),
          totalEntries: 0,
        });
      }
      const bucket = bucketMap.get(periodKey)!;

      if (!bucket.seriesMap.has(row.group_id)) {
        bucket.seriesMap.set(row.group_id, {
          id: row.group_id,
          label: row.group_label,
          value: 0,
          breakdownMap: new Map(),
        });
      }
      const seriesItem = bucket.seriesMap.get(row.group_id)!;

      if (row.stack_id && row.stack_label) {
        seriesItem.breakdownMap.set(row.stack_id, {
          id: row.stack_id,
          label: row.stack_label,
          value: row.value,
        });
        seriesItem.value += row.value;
      } else {
        seriesItem.value += row.value;
      }

      const entryCount = Number(row.entry_count);
      bucket.totalEntries += entryCount;
      totalHours += row.value;
      totalEntries += entryCount;
    }

    const buckets = Array.from(bucketMap.values())
      .sort((a, b) => a.periodStart.localeCompare(b.periodStart))
      .map((bucket) => ({
        periodStart: bucket.periodStart,
        periodEnd: this.computePeriodEnd(bucket.periodStart, query.granularity),
        series: Array.from(bucket.seriesMap.values()).map((item) => ({
          id: item.id,
          label: item.label,
          value: Math.round(item.value * 100) / 100,
          ...(item.breakdownMap.size > 0 && {
            breakdown: Array.from(item.breakdownMap.values()).map((b) => ({
              ...b,
              value: Math.round(b.value * 100) / 100,
            })),
          }),
        })),
      }));

    return {
      buckets,
      summary: {
        totalHours: Math.round(totalHours * 100) / 100,
        entries: totalEntries,
      },
    };
  }

  async getWeekdayDistribution(
    orgId: string,
    userId: string,
    isAdmin: boolean,
    query: WeekdayDistributionQueryDto,
  ): Promise<WeekdayDistributionResponseDto> {
    this.validateDateRange(query.dateFrom, query.dateTo);
    const scopedUserIds = await this.resolveScopedUserIds(userId, isAdmin, query.userIds);

    const rows = await this.reportsRepository.findWeekdayDistribution({
      orgId,
      dateFrom: query.dateFrom,
      dateTo: query.dateTo,
      groupBy: query.groupBy,
      userIds: scopedUserIds,
      teamIds: query.teamIds,
      projectIds: query.projectIds,
    });

    // Group rows by entity, filling all 7 weekday slots
    const entityMap = new Map<string, { id: string; label: string; weekdays: number[] }>();
    const totals = [0, 0, 0, 0, 0, 0, 0];

    for (const row of rows) {
      if (!entityMap.has(row.group_id)) {
        entityMap.set(row.group_id, {
          id: row.group_id,
          label: row.group_label,
          weekdays: [0, 0, 0, 0, 0, 0, 0],
        });
      }
      const entity = entityMap.get(row.group_id)!;
      const day = row.weekday;
      entity.weekdays[day] = Math.round(row.value * 100) / 100;
      totals[day] += row.value;
    }

    return {
      rows: Array.from(entityMap.values()),
      totals: totals.map((t) => Math.round(t * 100) / 100),
    };
  }

  async getLoggingDelay(
    orgId: string,
    userId: string,
    isAdmin: boolean,
    query: LoggingDelayQueryDto,
  ): Promise<LoggingDelayResponseDto> {
    this.validateDateRange(query.dateFrom, query.dateTo);
    const scopedUserIds = await this.resolveScopedUserIds(userId, isAdmin, query.userIds);

    const rows = await this.reportsRepository.findLoggingDelay({
      orgId,
      dateFrom: query.dateFrom,
      dateTo: query.dateTo,
      userIds: scopedUserIds,
      teamIds: query.teamIds,
      projectIds: query.projectIds,
    });

    const bucketCounts = [0, 0, 0, 0];
    for (const row of rows) {
      bucketCounts[row.bucket] = Number(row.count);
    }

    const total = bucketCounts.reduce((sum, c) => sum + c, 0);

    return {
      buckets: DELAY_BUCKETS.map((def, i) => ({
        label: def.label,
        maxDays: def.maxDays,
        count: bucketCounts[i],
        percentage: total > 0 ? Math.round((bucketCounts[i] / total) * 1000) / 10 : 0,
      })),
    };
  }

  async getSummary(
    orgId: string,
    userId: string,
    isAdmin: boolean,
    query: SummaryQueryDto,
  ): Promise<SummaryResponseDto> {
    this.validateDateRange(query.dateFrom, query.dateTo);
    const scopedUserIds = await this.resolveScopedUserIds(userId, isAdmin, query.userIds);

    const result = await this.reportsRepository.findSummary({
      orgId,
      dateFrom: query.dateFrom,
      dateTo: query.dateTo,
      userIds: scopedUserIds,
      teamIds: query.teamIds,
      projectIds: query.projectIds,
    });

    return {
      totalHours: Math.round(result.totalHours * 100) / 100,
      avgHoursPerDay: result.distinctDays > 0
        ? Math.round((result.totalHours / result.distinctDays) * 100) / 100
        : 0,
      uniqueProjects: result.uniqueProjects,
      uniqueUsers: result.uniqueUsers,
      uniqueTeams: result.uniqueTeams,
      totalEntries: result.totalEntries,
    };
  }

  private validateDateRange(dateFrom: string, dateTo: string): void {
    if (dateFrom > dateTo) {
      throw new ReportInvalidDateRangeException();
    }
  }

  private async resolveScopedUserIds(
    currentUserId: string,
    isAdmin: boolean,
    requestedUserIds?: string[],
  ): Promise<string[] | undefined> {
    if (isAdmin) return requestedUserIds;

    const managedIds = await this.reportsRepository.findManagedUserIds(currentUserId);
    const scope =
      managedIds.length > 0
        ? [...new Set([currentUserId, ...managedIds])]
        : [currentUserId];

    if (requestedUserIds?.length) {
      return requestedUserIds.filter((id) => scope.includes(id));
    }

    return scope;
  }

  private computePeriodEnd(periodStart: string, granularity: ReportGranularity): string {
    const d = new Date(periodStart + 'T00:00:00Z');

    switch (granularity) {
      case 'day':
        return periodStart;
      case 'week':
        d.setUTCDate(d.getUTCDate() + 6);
        return d.toISOString().slice(0, 10);
      case 'month':
        d.setUTCMonth(d.getUTCMonth() + 1);
        d.setUTCDate(0); // last day of previous month
        return d.toISOString().slice(0, 10);
      case 'quarter':
        d.setUTCMonth(d.getUTCMonth() + 3);
        d.setUTCDate(0);
        return d.toISOString().slice(0, 10);
    }
  }
}
