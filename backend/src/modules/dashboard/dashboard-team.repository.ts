import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";

interface TeamHoursRow {
  teamId: string;
  teamName: string;
  memberCount: number;
  hoursThisWeek: number;
  hoursLastWeek: number;
  hoursThisMonth: number;
  hoursLastMonth: number;
}

interface NotLoggedRow {
  team_id: string;
  user_id: string;
  user_name: string;
}

interface ThresholdBreachRow {
  team_id: string;
  daily_count: number;
  weekly_count: number;
}

interface ActiveProjectRow {
  team_id: string;
  project_id: string;
  project_name: string;
  rn: number;
  total_count: bigint;
}

interface OrgOverviewResult {
  users: { active: number; deactivated: number };
  teams: { active: number; archived: number };
  projects: { active: number; archived: number };
}

@Injectable()
export class DashboardTeamRepository {
  constructor(private readonly prisma: PrismaService) {}

  // NOTE: A user who belongs to multiple teams will have their hours counted
  // in each team's total. This is intentional — each team sees the full hours
  // of its members, even if those hours overlap with another team's view.
  async findTeamHoursByPeriod(
    teamIds: string[],
    today: string,
  ): Promise<TeamHoursRow[]> {
    const rows = await this.prisma.$queryRaw<
      Array<{
        team_id: string;
        team_name: string;
        member_count: bigint;
        hours_this_week: number;
        hours_last_week: number;
        hours_this_month: number;
        hours_last_month: number;
      }>
    >(
      Prisma.sql`
        SELECT
          t.id AS team_id,
          t.name AS team_name,
          (SELECT COUNT(*) FROM team_member tm2 WHERE tm2.team_id = t.id)::bigint AS member_count,
          COALESCE(SUM(tl.hours) FILTER(
            WHERE tl.date >= date_trunc('week', ${today}::date)
              AND tl.date <= ${today}::date
          ), 0)::float AS hours_this_week,
          COALESCE(SUM(tl.hours) FILTER(
            WHERE tl.date >= date_trunc('week', ${today}::date) - interval '7 days'
              AND tl.date < date_trunc('week', ${today}::date)
          ), 0)::float AS hours_last_week,
          COALESCE(SUM(tl.hours) FILTER(
            WHERE tl.date >= date_trunc('month', ${today}::date)
              AND tl.date <= ${today}::date
          ), 0)::float AS hours_this_month,
          COALESCE(SUM(tl.hours) FILTER(
            WHERE tl.date >= date_trunc('month', ${today}::date) - interval '1 month'
              AND tl.date < date_trunc('month', ${today}::date)
          ), 0)::float AS hours_last_month
        FROM team t
        JOIN team_member tm ON tm.team_id = t.id
        LEFT JOIN time_log tl
          ON tl.user_id = tm.user_id
          AND tl.status = 'active'
          AND tl.date >= date_trunc('month', ${today}::date) - interval '1 month'
          AND tl.date <= ${today}::date
        WHERE t.id IN (${Prisma.join(teamIds)})
          AND t.is_archived = false
        GROUP BY t.id, t.name
      `,
    );

    return rows.map((r) => ({
      teamId: r.team_id,
      teamName: r.team_name,
      memberCount: Number(r.member_count),
      hoursThisWeek: r.hours_this_week,
      hoursLastWeek: r.hours_last_week,
      hoursThisMonth: r.hours_this_month,
      hoursLastMonth: r.hours_last_month,
    }));
  }

  async findUsersNotLoggedThisWeek(
    teamIds: string[],
    weekStart: string,
    weekEnd: string,
  ): Promise<Array<{ teamId: string; userId: string; userName: string }>> {
    const rows = await this.prisma.$queryRaw<NotLoggedRow[]>(
      Prisma.sql`
        SELECT
          tm.team_id,
          u.id AS user_id,
          u.name AS user_name
        FROM team_member tm
        JOIN "user" u ON u.id = tm.user_id AND u.status = 'active'
        WHERE tm.team_id IN (${Prisma.join(teamIds)})
          AND NOT EXISTS (
            SELECT 1 FROM time_log tl
            WHERE tl.user_id = u.id
              AND tl.status = 'active'
              AND tl.date >= ${weekStart}::date
              AND tl.date <= ${weekEnd}::date
          )
        ORDER BY u.name
      `,
    );

    return rows.map((r) => ({
      teamId: r.team_id,
      userId: r.user_id,
      userName: r.user_name,
    }));
  }

  async findThresholdBreaches(
    teamIds: string[],
    weekStart: string,
    weekEnd: string,
    monthStart: string,
    today: string,
    dailyThreshold: number,
    weeklyThreshold: number,
  ): Promise<
    Array<{ teamId: string; dailyCount: number; weeklyCount: number }>
  > {
    const rows = await this.prisma.$queryRaw<ThresholdBreachRow[]>(
      Prisma.sql`
        WITH daily_agg AS (
          SELECT
            tm.team_id,
            tl.user_id,
            tl.date,
            SUM(tl.hours) AS daily_hours
          FROM time_log tl
          JOIN team_member tm ON tm.user_id = tl.user_id
          WHERE tm.team_id IN (${Prisma.join(teamIds)})
            AND tl.status = 'active'
            AND tl.date >= ${monthStart}::date
            AND tl.date <= ${today}::date
          GROUP BY tm.team_id, tl.user_id, tl.date
          HAVING SUM(tl.hours) > ${dailyThreshold}
        ),
        weekly_agg AS (
          SELECT
            tm.team_id,
            tl.user_id,
            SUM(tl.hours) AS weekly_hours
          FROM time_log tl
          JOIN team_member tm ON tm.user_id = tl.user_id
          WHERE tm.team_id IN (${Prisma.join(teamIds)})
            AND tl.status = 'active'
            AND tl.date >= ${weekStart}::date
            AND tl.date <= ${weekEnd}::date
          GROUP BY tm.team_id, tl.user_id
          HAVING SUM(tl.hours) > ${weeklyThreshold}
        )
        SELECT
          t.id AS team_id,
          COALESCE((SELECT COUNT(*) FROM daily_agg da WHERE da.team_id = t.id), 0)::int AS daily_count,
          COALESCE((SELECT COUNT(*) FROM weekly_agg wa WHERE wa.team_id = t.id), 0)::int AS weekly_count
        FROM team t
        WHERE t.id IN (${Prisma.join(teamIds)})
      `,
    );

    return rows.map((r) => ({
      teamId: r.team_id,
      dailyCount: r.daily_count,
      weeklyCount: r.weekly_count,
    }));
  }

  async findActiveProjectsByTeam(
    teamIds: string[],
    limit: number,
  ): Promise<
    Array<{
      teamId: string;
      projectId: string;
      projectName: string;
      totalCount: number;
    }>
  > {
    const rows = await this.prisma.$queryRaw<ActiveProjectRow[]>(
      Prisma.sql`
        WITH ranked AS (
          SELECT
            pt.team_id,
            p.id AS project_id,
            p.name AS project_name,
            MAX(tl.date) AS max_date,
            ROW_NUMBER() OVER (
              PARTITION BY pt.team_id
              ORDER BY MAX(tl.date) DESC NULLS LAST, p.name
            ) AS rn,
            COUNT(*) OVER (PARTITION BY pt.team_id) AS total_count
          FROM project_team pt
          JOIN project p ON p.id = pt.project_id AND p.status = 'active'
          LEFT JOIN time_log tl
            ON tl.project_id = p.id
            AND tl.status = 'active'
          WHERE pt.team_id IN (${Prisma.join(teamIds)})
            AND pt.is_deleted = false
          GROUP BY pt.team_id, p.id, p.name
        )
        SELECT team_id, project_id, project_name, rn, total_count
        FROM ranked
        WHERE rn <= ${limit}
        ORDER BY team_id, rn
      `,
    );

    return rows.map((r) => ({
      teamId: r.team_id,
      projectId: r.project_id,
      projectName: r.project_name,
      totalCount: Number(r.total_count),
    }));
  }

  async findOrgOverview(orgId: string): Promise<OrgOverviewResult> {
    const [userRows, teamRows, projectRows] = await Promise.all([
      this.prisma.$queryRaw<Array<{ active: bigint; deactivated: bigint }>>(
        Prisma.sql`
          SELECT
            COUNT(*) FILTER(WHERE status = 'active') AS active,
            COUNT(*) FILTER(WHERE status = 'deactivated') AS deactivated
          FROM "user"
          WHERE org_id = ${orgId}
        `,
      ),
      this.prisma.$queryRaw<Array<{ active: bigint; archived: bigint }>>(
        Prisma.sql`
          SELECT
            COUNT(*) FILTER(WHERE is_archived = false) AS active,
            COUNT(*) FILTER(WHERE is_archived = true) AS archived
          FROM team
          WHERE org_id = ${orgId}
        `,
      ),
      this.prisma.$queryRaw<Array<{ active: bigint; archived: bigint }>>(
        Prisma.sql`
          SELECT
            COUNT(*) FILTER(WHERE status = 'active') AS active,
            COUNT(*) FILTER(WHERE status = 'archived') AS archived
          FROM project
          WHERE org_id = ${orgId}
        `,
      ),
    ]);

    return {
      users: {
        active: Number(userRows[0].active),
        deactivated: Number(userRows[0].deactivated),
      },
      teams: {
        active: Number(teamRows[0].active),
        archived: Number(teamRows[0].archived),
      },
      projects: {
        active: Number(projectRows[0].active),
        archived: Number(projectRows[0].archived),
      },
    };
  }

  async findManagedTeamIds(userId: string): Promise<string[]> {
    const memberships = await this.prisma.teamMember.findMany({
      where: { userId, role: "manager", team: { isArchived: false } },
      select: { teamId: true },
    });
    return memberships.map((m) => m.teamId);
  }

  async findAllActiveTeamIds(orgId: string): Promise<string[]> {
    const teams = await this.prisma.team.findMany({
      where: { orgId, isArchived: false },
      select: { id: true },
    });
    return teams.map((t) => t.id);
  }
}
