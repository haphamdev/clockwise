import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";

interface UserHoursRow {
  today: number;
  thisWeek: number;
  lastWeek: number;
  thisMonth: number;
  lastMonth: number;
}

interface GapRow {
  date: Date;
  hours: number;
}

interface RecentLogRow {
  id: string;
  date: Date;
  project_name: string;
  task_labels: string[];
  hours: number;
}

interface ProjectSummaryRow {
  project_id: string;
  project_name: string;
  hours_this_week: number;
  total_entries: bigint;
}

@Injectable()
export class DashboardPersonalRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findUserHoursByPeriod(
    userId: string,
    today: string,
  ): Promise<UserHoursRow> {
    const rows = await this.prisma.$queryRaw<
      Array<{
        today: number;
        this_week: number;
        last_week: number;
        this_month: number;
        last_month: number;
      }>
    >(
      Prisma.sql`
        SELECT
          COALESCE(SUM(hours) FILTER(
            WHERE date = ${today}::date
          ), 0)::float AS today,
          COALESCE(SUM(hours) FILTER(
            WHERE date >= date_trunc('week', ${today}::date)
              AND date <= ${today}::date
          ), 0)::float AS this_week,
          COALESCE(SUM(hours) FILTER(
            WHERE date >= date_trunc('week', ${today}::date) - interval '7 days'
              AND date < date_trunc('week', ${today}::date)
          ), 0)::float AS last_week,
          COALESCE(SUM(hours) FILTER(
            WHERE date >= date_trunc('month', ${today}::date)
              AND date <= ${today}::date
          ), 0)::float AS this_month,
          COALESCE(SUM(hours) FILTER(
            WHERE date >= date_trunc('month', ${today}::date) - interval '1 month'
              AND date < date_trunc('month', ${today}::date)
          ), 0)::float AS last_month
        FROM time_log
        WHERE user_id = ${userId}
          AND status = 'active'
          AND date >= date_trunc('month', ${today}::date) - interval '1 month'
          AND date <= ${today}::date
      `,
    );

    const row = rows[0];
    return {
      today: row.today,
      thisWeek: row.this_week,
      lastWeek: row.last_week,
      thisMonth: row.this_month,
      lastMonth: row.last_month,
    };
  }

  async findGaps(
    userId: string,
    monthStart: string,
    today: string,
    workdays: number[],
    threshold: number,
  ): Promise<Array<{ date: string; hours: number }>> {
    const rows = await this.prisma.$queryRaw<GapRow[]>(
      Prisma.sql`
        SELECT
          d.date,
          COALESCE(SUM(tl.hours), 0)::float AS hours
        FROM generate_series(
          ${monthStart}::date,
          ${today}::date,
          '1 day'::interval
        ) AS d(date)
        LEFT JOIN time_log tl
          ON tl.date = d.date
          AND tl.user_id = ${userId}
          AND tl.status = 'active'
        WHERE EXTRACT(ISODOW FROM d.date)::int = ANY(${workdays}::int[])
        GROUP BY d.date
        HAVING COALESCE(SUM(tl.hours), 0) < ${threshold}
        ORDER BY d.date
      `,
    );

    return rows.map((r) => ({
      date:
        r.date instanceof Date
          ? r.date.toISOString().slice(0, 10)
          : String(r.date).slice(0, 10),
      hours: r.hours,
    }));
  }

  async findRecentLogs(
    userId: string,
    orgId: string,
    limit: number,
  ): Promise<
    Array<{
      id: string;
      date: string;
      projectName: string;
      taskLabels: string[];
      hours: number;
    }>
  > {
    const rows = await this.prisma.$queryRaw<RecentLogRow[]>(
      Prisma.sql`
        SELECT
          tl.id,
          tl.date,
          p.name AS project_name,
          COALESCE(
            array_agg(DISTINCT tk.label) FILTER(WHERE tk.label IS NOT NULL),
            '{}'::text[]
          ) AS task_labels,
          tl.hours::float AS hours
        FROM time_log tl
        JOIN project p ON p.id = tl.project_id
        LEFT JOIN time_log_task tlt ON tlt.time_log_id = tl.id
        LEFT JOIN task tk ON tk.id = tlt.task_id
        JOIN "user" u ON u.id = tl.user_id
        WHERE tl.user_id = ${userId}
          AND u.org_id = ${orgId}
          AND tl.status = 'active'
        GROUP BY tl.id, tl.date, p.name, tl.hours
        ORDER BY tl.date DESC, tl.created_at DESC
        LIMIT ${limit}
      `,
    );

    return rows.map((r) => ({
      id: r.id,
      date:
        r.date instanceof Date
          ? r.date.toISOString().slice(0, 10)
          : String(r.date).slice(0, 10),
      projectName: r.project_name,
      taskLabels: r.task_labels,
      hours: r.hours,
    }));
  }

  async findProjectSummaries(
    userId: string,
    today: string,
  ): Promise<
    Array<{
      projectId: string;
      projectName: string;
      hoursThisWeek: number;
      entriesThisWeek: number;
    }>
  > {
    const rows = await this.prisma.$queryRaw<ProjectSummaryRow[]>(
      Prisma.sql`
        SELECT
          p.id AS project_id,
          p.name AS project_name,
          COALESCE(SUM(tl.hours), 0)::float AS hours_this_week,
          COUNT(tl.id) AS total_entries
        FROM project p
        JOIN project_team pt ON pt.project_id = p.id AND pt.is_deleted = false
        JOIN team_member tm ON tm.team_id = pt.team_id AND tm.user_id = ${userId}
        LEFT JOIN time_log tl
          ON tl.project_id = p.id
          AND tl.user_id = ${userId}
          AND tl.status = 'active'
          AND tl.date >= date_trunc('week', ${today}::date)
          AND tl.date <= ${today}::date
        WHERE p.status = 'active'
        GROUP BY p.id, p.name
        ORDER BY hours_this_week DESC, p.name
      `,
    );

    return rows.map((r) => ({
      projectId: r.project_id,
      projectName: r.project_name,
      hoursThisWeek: r.hours_this_week,
      entriesThisWeek: Number(r.total_entries),
    }));
  }
}
