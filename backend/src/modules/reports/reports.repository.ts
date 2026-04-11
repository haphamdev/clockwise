import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import type { ReportGranularity, ReportGroupBy } from "./dto/reports-query.dto";

interface FilterParams {
  orgId: string;
  dateFrom: string;
  dateTo: string;
  userIds?: string[];
  teamIds?: string[];
  projectIds?: string[];
}

interface TimeSeriesRow {
  period_start: Date;
  group_id: string;
  group_label: string;
  stack_id: string | null;
  stack_label: string | null;
  value: number;
  entry_count: bigint;
}

interface WeekdayRow {
  group_id: string;
  group_label: string;
  weekday: number;
  value: number;
}

interface DelayRow {
  bucket: number;
  count: bigint;
}

interface DailyAnomalyRow {
  user_id: string;
  user_name: string;
  date: Date;
  weekday: number;
  total_hours: number;
}

interface DelayHeatmapRow {
  user_id: string;
  user_name: string;
  weekday: number;
  p75_delay: number;
  entry_count: number;
}

// Validated column references — never from user input
const GROUP_COLS: Record<ReportGroupBy, { id: string; label: string }> = {
  user: { id: "tl.user_id", label: "u.name" },
  project: { id: "tl.project_id", label: "p.name" },
  team: { id: "t.id", label: "t.name" },
};

const GRANULARITY_VALUES: Record<ReportGranularity, string> = {
  day: "day",
  week: "week",
  month: "month",
  quarter: "quarter",
};

@Injectable()
export class ReportsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findTimeSeries(
    params: FilterParams & {
      granularity: ReportGranularity;
      groupBy: ReportGroupBy;
      stackBy?: ReportGroupBy;
    },
  ): Promise<TimeSeriesRow[]> {
    const groupCol = GROUP_COLS[params.groupBy];
    const stackCol = params.stackBy ? GROUP_COLS[params.stackBy] : null;
    const gran = GRANULARITY_VALUES[params.granularity];
    const needsTeamJoin =
      params.groupBy === "team" || params.stackBy === "team";

    const selectStack = stackCol
      ? Prisma.raw(
          `${stackCol.id} AS stack_id, ${stackCol.label} AS stack_label,`,
        )
      : Prisma.raw("NULL AS stack_id, NULL AS stack_label,");

    const groupByStack = stackCol
      ? Prisma.raw(`, ${stackCol.id}, ${stackCol.label}`)
      : Prisma.empty;

    const teamJoin = needsTeamJoin
      ? Prisma.raw(
          "JOIN team_member tm ON tm.user_id = tl.user_id " +
            "JOIN team t ON t.id = tm.team_id AND t.is_archived = false",
        )
      : Prisma.empty;

    const conditions = this.buildConditions(params, needsTeamJoin);

    return this.prisma.$queryRaw<TimeSeriesRow[]>(
      Prisma.sql`
        SELECT
          ${Prisma.raw(`date_trunc('${gran}', tl.date)`)} AS period_start,
          ${Prisma.raw(groupCol.id)} AS group_id,
          ${Prisma.raw(groupCol.label)} AS group_label,
          ${selectStack}
          SUM(tl.hours)::float AS value,
          COUNT(tl.id) AS entry_count
        FROM time_log tl
        JOIN "user" u ON u.id = tl.user_id
        JOIN project p ON p.id = tl.project_id
        ${teamJoin}
        WHERE ${Prisma.join(conditions, " AND ")}
        GROUP BY period_start, ${Prisma.raw(groupCol.id)}, ${Prisma.raw(groupCol.label)} ${groupByStack}
        ORDER BY period_start, ${Prisma.raw(groupCol.label)}
      `,
    );
  }

  async findWeekdayDistribution(
    params: FilterParams & { groupBy: ReportGroupBy },
  ): Promise<WeekdayRow[]> {
    const groupCol = GROUP_COLS[params.groupBy];
    const needsTeamJoin = params.groupBy === "team";

    const teamJoin = needsTeamJoin
      ? Prisma.raw(
          "JOIN team_member tm ON tm.user_id = tl.user_id " +
            "JOIN team t ON t.id = tm.team_id AND t.is_archived = false",
        )
      : Prisma.empty;

    const conditions = this.buildConditions(params, needsTeamJoin);

    return this.prisma.$queryRaw<WeekdayRow[]>(
      Prisma.sql`
        SELECT
          ${Prisma.raw(groupCol.id)} AS group_id,
          ${Prisma.raw(groupCol.label)} AS group_label,
          ((EXTRACT(DOW FROM tl.date)::int + 6) % 7) AS weekday,
          SUM(tl.hours)::float AS value
        FROM time_log tl
        JOIN "user" u ON u.id = tl.user_id
        JOIN project p ON p.id = tl.project_id
        ${teamJoin}
        WHERE ${Prisma.join(conditions, " AND ")}
        GROUP BY ${Prisma.raw(groupCol.id)}, ${Prisma.raw(groupCol.label)}, weekday
        ORDER BY ${Prisma.raw(groupCol.label)}, weekday
      `,
    );
  }

  async findLoggingDelay(params: FilterParams): Promise<DelayRow[]> {
    const conditions = this.buildConditions(params, false);

    return this.prisma.$queryRaw<DelayRow[]>(
      Prisma.sql`
        SELECT
          CASE
            WHEN GREATEST(DATE(tl.created_at) - tl.date, 0) = 0 THEN 0
            WHEN GREATEST(DATE(tl.created_at) - tl.date, 0) <= 2 THEN 1
            WHEN GREATEST(DATE(tl.created_at) - tl.date, 0) <= 5 THEN 2
            ELSE 3
          END AS bucket,
          COUNT(*) AS count
        FROM time_log tl
        JOIN "user" u ON u.id = tl.user_id
        JOIN project p ON p.id = tl.project_id
        WHERE ${Prisma.join(conditions, " AND ")}
        GROUP BY bucket
        ORDER BY bucket
      `,
    );
  }

  async findSummary(params: FilterParams): Promise<{
    totalHours: number;
    totalEntries: number;
    uniqueProjects: number;
    uniqueUsers: number;
    uniqueTeams: number;
    distinctDays: number;
  }> {
    const conditions = this.buildConditions(params, false);

    const rows = await this.prisma.$queryRaw<
      Array<{
        total_hours: number;
        total_entries: bigint;
        unique_projects: bigint;
        unique_users: bigint;
        distinct_days: bigint;
      }>
    >(
      Prisma.sql`
        SELECT
          COALESCE(SUM(tl.hours)::float, 0) AS total_hours,
          COUNT(tl.id) AS total_entries,
          COUNT(DISTINCT tl.project_id) AS unique_projects,
          COUNT(DISTINCT tl.user_id) AS unique_users,
          COUNT(DISTINCT tl.date) AS distinct_days
        FROM time_log tl
        JOIN "user" u ON u.id = tl.user_id
        JOIN project p ON p.id = tl.project_id
        WHERE ${Prisma.join(conditions, " AND ")}
      `,
    );

    const row = rows[0];

    // Separate query for unique teams — uses hasTeamJoin=true so teamIds
    // filter applies directly to the joined tm table, avoiding over-counting
    const teamConditions = this.buildConditions(params, true);
    const teamRows = await this.prisma.$queryRaw<
      Array<{ unique_teams: bigint }>
    >(
      Prisma.sql`
        SELECT COUNT(DISTINCT tm.team_id) AS unique_teams
        FROM time_log tl
        JOIN "user" u ON u.id = tl.user_id
        JOIN project p ON p.id = tl.project_id
        JOIN team_member tm ON tm.user_id = tl.user_id
        JOIN team t ON t.id = tm.team_id AND t.is_archived = false
        WHERE ${Prisma.join(teamConditions, " AND ")}
      `,
    );

    return {
      totalHours: row.total_hours,
      totalEntries: Number(row.total_entries),
      uniqueProjects: Number(row.unique_projects),
      uniqueUsers: Number(row.unique_users),
      uniqueTeams: Number(teamRows[0].unique_teams),
      distinctDays: Number(row.distinct_days),
    };
  }

  async findDailyAnomalies(
    params: FilterParams & { warningThreshold: number },
  ): Promise<DailyAnomalyRow[]> {
    const conditions = this.buildConditions(params, false);

    return this.prisma.$queryRaw<DailyAnomalyRow[]>(
      Prisma.sql`
        SELECT
          tl.user_id,
          u.name AS user_name,
          tl.date,
          ((EXTRACT(DOW FROM tl.date)::int + 6) % 7) AS weekday,
          SUM(tl.hours)::float AS total_hours
        FROM time_log tl
        JOIN "user" u ON u.id = tl.user_id
        JOIN project p ON p.id = tl.project_id
        WHERE ${Prisma.join(conditions, " AND ")}
        GROUP BY tl.user_id, u.name, tl.date
        HAVING SUM(tl.hours) >= ${params.warningThreshold}
        ORDER BY tl.date DESC, u.name
      `,
    );
  }

  async findLoggingDelayHeatmap(
    params: FilterParams & { minEntries: number },
  ): Promise<DelayHeatmapRow[]> {
    const conditions = this.buildConditions(params, false);

    return this.prisma.$queryRaw<DelayHeatmapRow[]>(
      Prisma.sql`
        SELECT
          tl.user_id,
          u.name AS user_name,
          ((EXTRACT(DOW FROM tl.date)::int + 6) % 7) AS weekday,
          PERCENTILE_CONT(0.75) WITHIN GROUP (
            ORDER BY GREATEST((tl.created_at::date - tl.date)::int, 0)
          )::float AS p75_delay,
          COUNT(*)::int AS entry_count
        FROM time_log tl
        JOIN "user" u ON u.id = tl.user_id
        JOIN project p ON p.id = tl.project_id
        WHERE ${Prisma.join(conditions, " AND ")}
        GROUP BY tl.user_id, u.name, ((EXTRACT(DOW FROM tl.date)::int + 6) % 7)
        HAVING COUNT(*) >= ${params.minEntries}
        ORDER BY u.name, weekday
      `,
    );
  }

  async findManagedUserIds(managerId: string): Promise<string[]> {
    const memberships = await this.prisma.teamMember.findMany({
      where: {
        userId: managerId,
        role: "manager",
        team: { isArchived: false },
      },
      select: { teamId: true },
    });

    const teamIds = memberships.map((m) => m.teamId);
    if (teamIds.length === 0) return [];

    const members = await this.prisma.teamMember.findMany({
      where: { teamId: { in: teamIds } },
      select: { userId: true },
      distinct: ["userId"],
    });

    return members.map((m) => m.userId);
  }

  private buildConditions(
    params: FilterParams,
    hasTeamJoin: boolean,
  ): Prisma.Sql[] {
    const conditions: Prisma.Sql[] = [
      Prisma.sql`u.org_id = ${params.orgId}`,
      Prisma.sql`u.status = 'active'`,
      Prisma.sql`tl.date >= ${params.dateFrom}::date`,
      Prisma.sql`tl.date <= ${params.dateTo}::date`,
      Prisma.sql`tl.status = 'active'`,
    ];

    if (params.userIds?.length) {
      conditions.push(
        Prisma.sql`tl.user_id IN (${Prisma.join(params.userIds)})`,
      );
    }

    if (params.projectIds?.length) {
      conditions.push(
        Prisma.sql`tl.project_id IN (${Prisma.join(params.projectIds)})`,
      );
    }

    if (params.teamIds?.length) {
      if (hasTeamJoin) {
        conditions.push(
          Prisma.sql`tm.team_id IN (${Prisma.join(params.teamIds)})`,
        );
      } else {
        conditions.push(
          Prisma.sql`EXISTS (
            SELECT 1 FROM team_member tm2
            WHERE tm2.user_id = tl.user_id
            AND tm2.team_id IN (${Prisma.join(params.teamIds)})
          )`,
        );
      }
    }

    return conditions;
  }
}
