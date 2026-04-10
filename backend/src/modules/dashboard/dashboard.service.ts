import { Injectable } from '@nestjs/common';
import { DashboardPersonalRepository } from './dashboard-personal.repository';
import { DashboardTeamRepository } from './dashboard-team.repository';
import { OrgService } from '../org/org.service';
import type { MySummaryResponseDto } from './dto/my-summary-response.dto';
import type { TeamBreakdownResponseDto } from './dto/team-breakdown-response.dto';
import type { OrgOverviewResponseDto } from './dto/org-overview-response.dto';

const RECENT_LOGS_LIMIT = 5;
const ACTIVE_PROJECTS_LIMIT = 5;
const GAP_THRESHOLD_HOURS = 1;

@Injectable()
export class DashboardService {
  constructor(
    private readonly personalRepo: DashboardPersonalRepository,
    private readonly teamRepo: DashboardTeamRepository,
    private readonly orgService: OrgService,
  ) {}

  async getMySummary(userId: string, orgId: string): Promise<MySummaryResponseDto> {
    const settings = await this.orgService.getSettings(orgId);
    const workdays = this.buildWorkdays(settings.trackSaturday, settings.trackSunday);
    const today = this.getToday();
    const monthStart = today.slice(0, 7) + '-01';

    const [hours, gaps, recentLogs, projectSummaries] = await Promise.all([
      this.personalRepo.findUserHoursByPeriod(userId, today),
      this.personalRepo.findGaps(userId, monthStart, today, workdays, GAP_THRESHOLD_HOURS),
      this.personalRepo.findRecentLogs(userId, orgId, RECENT_LOGS_LIMIT),
      this.personalRepo.findProjectSummaries(userId, today),
    ]);

    return {
      myHours: {
        today: hours.today,
        thisWeek: hours.thisWeek,
        lastWeek: hours.lastWeek,
        weekOverWeekPct: this.computeChangePercent(hours.thisWeek, hours.lastWeek),
        thisMonth: hours.thisMonth,
        lastMonth: hours.lastMonth,
        monthOverMonthPct: this.computeChangePercent(hours.thisMonth, hours.lastMonth),
      },
      gaps,
      recentLogs,
      projectSummaries,
    };
  }

  async getTeamBreakdown(
    userId: string,
    orgId: string,
    isAdmin: boolean,
  ): Promise<TeamBreakdownResponseDto> {
    const teamIds = isAdmin
      ? await this.teamRepo.findAllActiveTeamIds(orgId)
      : await this.teamRepo.findManagedTeamIds(userId);

    if (teamIds.length === 0) {
      return { teams: [] };
    }

    const settings = await this.orgService.getSettings(orgId);
    const today = this.getToday();
    const weekStart = this.getWeekStart(today);
    const monthStart = today.slice(0, 7) + '-01';

    const [teamHours, notLogged, breaches, activeProjects] = await Promise.all([
      this.teamRepo.findTeamHoursByPeriod(teamIds, today),
      this.teamRepo.findUsersNotLoggedThisWeek(teamIds, weekStart, today),
      this.teamRepo.findThresholdBreaches(
        teamIds,
        weekStart,
        today,
        monthStart,
        today,
        settings.dailyWarningThreshold,
        settings.weeklyWarningThreshold,
      ),
      this.teamRepo.findActiveProjectsByTeam(teamIds, ACTIVE_PROJECTS_LIMIT),
    ]);

    const notLoggedByTeam = new Map<string, Array<{ userId: string; userName: string }>>();
    for (const row of notLogged) {
      if (!notLoggedByTeam.has(row.teamId)) {
        notLoggedByTeam.set(row.teamId, []);
      }
      notLoggedByTeam.get(row.teamId)!.push({ userId: row.userId, userName: row.userName });
    }

    const breachesByTeam = new Map<string, { dailyCount: number; weeklyCount: number }>();
    for (const row of breaches) {
      breachesByTeam.set(row.teamId, { dailyCount: row.dailyCount, weeklyCount: row.weeklyCount });
    }

    const projectsByTeam = new Map<string, { projects: Array<{ projectId: string; projectName: string }>; totalCount: number }>();
    for (const row of activeProjects) {
      if (!projectsByTeam.has(row.teamId)) {
        projectsByTeam.set(row.teamId, { projects: [], totalCount: row.totalCount });
      }
      projectsByTeam.get(row.teamId)!.projects.push({ projectId: row.projectId, projectName: row.projectName });
    }

    const teams = teamHours.map((th) => {
      const projData = projectsByTeam.get(th.teamId);
      return {
        teamId: th.teamId,
        teamName: th.teamName,
        memberCount: th.memberCount,
        hoursThisWeek: th.hoursThisWeek,
        weekOverWeekPct: this.computeChangePercent(th.hoursThisWeek, th.hoursLastWeek),
        hoursThisMonth: th.hoursThisMonth,
        monthOverMonthPct: this.computeChangePercent(th.hoursThisMonth, th.hoursLastMonth),
        notLoggedThisWeek: notLoggedByTeam.get(th.teamId) ?? [],
        thresholdBreaches: breachesByTeam.get(th.teamId) ?? { dailyCount: 0, weeklyCount: 0 },
        activeProjects: projData?.projects ?? [],
        activeProjectCount: projData?.totalCount ?? 0,
      };
    });

    return { teams };
  }

  async getOrgOverview(orgId: string): Promise<OrgOverviewResponseDto> {
    return this.teamRepo.findOrgOverview(orgId);
  }

  private computeChangePercent(current: number, previous: number): number | null {
    if (previous === 0) return null;
    return Math.round(((current - previous) / previous) * 100);
  }

  private buildWorkdays(trackSaturday: boolean, trackSunday: boolean): number[] {
    const workdays = [1, 2, 3, 4, 5];
    if (trackSaturday) workdays.push(6);
    if (trackSunday) workdays.push(7);
    return workdays;
  }

  /** Returns today's date in UTC. All date boundaries (today, week, month) use UTC. */
  private getToday(): string {
    return new Date().toISOString().slice(0, 10);
  }

  /** Returns the Monday of the ISO week containing `today` (UTC). */
  private getWeekStart(today: string): string {
    const d = new Date(today + 'T00:00:00Z');
    const day = d.getUTCDay();
    const diff = day === 0 ? 6 : day - 1; // Monday = 0 offset
    d.setUTCDate(d.getUTCDate() - diff);
    return d.toISOString().slice(0, 10);
  }
}
