import { DashboardService } from './dashboard.service';
import { DashboardPersonalRepository } from './dashboard-personal.repository';
import { DashboardTeamRepository } from './dashboard-team.repository';
import { OrgService } from '../org/org.service';
import { OrgSettingsEntity } from '../org/entities/org-settings.entity';

function makeSettings(overrides?: Partial<OrgSettingsEntity>): OrgSettingsEntity {
  return {
    orgName: 'Acme Corp',
    expectedHoursPerWeek: 40,
    dailyWarningThreshold: 12,
    weeklyWarningThreshold: 60,
    dateFormat: 'YYYY-MM-DD',
    timeFormat: '12h',
    csvMaxRows: 500,
    trackSaturday: false,
    trackSunday: false,
    ...overrides,
  };
}

describe('DashboardService', () => {
  let service: DashboardService;
  let personalRepo: jest.Mocked<DashboardPersonalRepository>;
  let teamRepo: jest.Mocked<DashboardTeamRepository>;
  let orgService: jest.Mocked<OrgService>;

  beforeEach(() => {
    personalRepo = {
      findUserHoursByPeriod: jest.fn(),
      findGaps: jest.fn(),
      findRecentLogs: jest.fn(),
      findProjectSummaries: jest.fn(),
    } as unknown as jest.Mocked<DashboardPersonalRepository>;

    teamRepo = {
      findManagedTeamIds: jest.fn(),
      findAllActiveTeamIds: jest.fn(),
      findTeamHoursByPeriod: jest.fn(),
      findUsersNotLoggedThisWeek: jest.fn(),
      findThresholdBreaches: jest.fn(),
      findActiveProjectsByTeam: jest.fn(),
      findOrgOverview: jest.fn(),
    } as unknown as jest.Mocked<DashboardTeamRepository>;

    orgService = {
      getSettings: jest.fn(),
    } as unknown as jest.Mocked<OrgService>;

    service = new DashboardService(personalRepo, teamRepo, orgService);
  });

  describe('getMySummary', () => {
    beforeEach(() => {
      personalRepo.findProjectSummaries.mockResolvedValue([]);
    });

    it('should compute positive WoW% (20h→24h = +20%)', async () => {
      orgService.getSettings.mockResolvedValue(makeSettings());
      personalRepo.findUserHoursByPeriod.mockResolvedValue({
        today: 4,
        thisWeek: 24,
        lastWeek: 20,
        thisMonth: 80,
        lastMonth: 80,
      });
      personalRepo.findGaps.mockResolvedValue([]);
      personalRepo.findRecentLogs.mockResolvedValue([]);

      const result = await service.getMySummary('user-1', 'org-1');

      expect(result.myHours.weekOverWeekPct).toBe(20);
      expect(result.myHours.monthOverMonthPct).toBe(0);
    });

    it('should return null WoW% when lastWeek is 0', async () => {
      orgService.getSettings.mockResolvedValue(makeSettings());
      personalRepo.findUserHoursByPeriod.mockResolvedValue({
        today: 4,
        thisWeek: 10,
        lastWeek: 0,
        thisMonth: 40,
        lastMonth: 30,
      });
      personalRepo.findGaps.mockResolvedValue([]);
      personalRepo.findRecentLogs.mockResolvedValue([]);

      const result = await service.getMySummary('user-1', 'org-1');

      expect(result.myHours.weekOverWeekPct).toBeNull();
    });

    it('should compute negative MoM% (80→60 = -25%)', async () => {
      orgService.getSettings.mockResolvedValue(makeSettings());
      personalRepo.findUserHoursByPeriod.mockResolvedValue({
        today: 0,
        thisWeek: 20,
        lastWeek: 20,
        thisMonth: 60,
        lastMonth: 80,
      });
      personalRepo.findGaps.mockResolvedValue([]);
      personalRepo.findRecentLogs.mockResolvedValue([]);

      const result = await service.getMySummary('user-1', 'org-1');

      expect(result.myHours.monthOverMonthPct).toBe(-25);
    });

    it('should include Saturday (6) in workdays when trackSaturday is true', async () => {
      orgService.getSettings.mockResolvedValue(makeSettings({ trackSaturday: true }));
      personalRepo.findUserHoursByPeriod.mockResolvedValue({
        today: 0, thisWeek: 0, lastWeek: 0, thisMonth: 0, lastMonth: 0,
      });
      personalRepo.findGaps.mockResolvedValue([]);
      personalRepo.findRecentLogs.mockResolvedValue([]);

      await service.getMySummary('user-1', 'org-1');

      const gapsCall = personalRepo.findGaps.mock.calls[0];
      expect(gapsCall[3]).toEqual([1, 2, 3, 4, 5, 6]);
    });

    it('should use workdays [1,2,3,4,5] when both track flags are false', async () => {
      orgService.getSettings.mockResolvedValue(makeSettings());
      personalRepo.findUserHoursByPeriod.mockResolvedValue({
        today: 0, thisWeek: 0, lastWeek: 0, thisMonth: 0, lastMonth: 0,
      });
      personalRepo.findGaps.mockResolvedValue([]);
      personalRepo.findRecentLogs.mockResolvedValue([]);

      await service.getMySummary('user-1', 'org-1');

      const gapsCall = personalRepo.findGaps.mock.calls[0];
      expect(gapsCall[3]).toEqual([1, 2, 3, 4, 5]);
    });

    it('should pass gap threshold to findGaps', async () => {
      orgService.getSettings.mockResolvedValue(makeSettings());
      personalRepo.findUserHoursByPeriod.mockResolvedValue({
        today: 0, thisWeek: 0, lastWeek: 0, thisMonth: 0, lastMonth: 0,
      });
      personalRepo.findGaps.mockResolvedValue([]);
      personalRepo.findRecentLogs.mockResolvedValue([]);

      await service.getMySummary('user-1', 'org-1');

      const gapsCall = personalRepo.findGaps.mock.calls[0];
      expect(gapsCall[4]).toBe(1); // GAP_THRESHOLD_HOURS
    });

    it('should include project summaries with hours and entry counts', async () => {
      orgService.getSettings.mockResolvedValue(makeSettings());
      personalRepo.findUserHoursByPeriod.mockResolvedValue({
        today: 0, thisWeek: 16, lastWeek: 0, thisMonth: 16, lastMonth: 0,
      });
      personalRepo.findGaps.mockResolvedValue([]);
      personalRepo.findRecentLogs.mockResolvedValue([]);
      personalRepo.findProjectSummaries.mockResolvedValue([
        { projectId: 'p1', projectName: 'Alpha', hoursThisWeek: 10, entriesThisWeek: 5 },
        { projectId: 'p2', projectName: 'Beta', hoursThisWeek: 6, entriesThisWeek: 3 },
      ]);

      const result = await service.getMySummary('user-1', 'org-1');

      expect(result.projectSummaries).toHaveLength(2);
      expect(result.projectSummaries[0]).toEqual({
        projectId: 'p1', projectName: 'Alpha', hoursThisWeek: 10, entriesThisWeek: 5,
      });
    });
  });

  describe('getTeamBreakdown', () => {
    it('should get all active teams for admin', async () => {
      orgService.getSettings.mockResolvedValue(makeSettings());
      teamRepo.findAllActiveTeamIds.mockResolvedValue(['t1', 't2']);
      teamRepo.findTeamHoursByPeriod.mockResolvedValue([]);
      teamRepo.findUsersNotLoggedThisWeek.mockResolvedValue([]);
      teamRepo.findThresholdBreaches.mockResolvedValue([]);
      teamRepo.findActiveProjectsByTeam.mockResolvedValue([]);

      await service.getTeamBreakdown('user-1', 'org-1', true);

      expect(teamRepo.findAllActiveTeamIds).toHaveBeenCalledWith('org-1');
      expect(teamRepo.findManagedTeamIds).not.toHaveBeenCalled();
    });

    it('should get only managed teams for manager', async () => {
      orgService.getSettings.mockResolvedValue(makeSettings());
      teamRepo.findManagedTeamIds.mockResolvedValue(['t1']);
      teamRepo.findTeamHoursByPeriod.mockResolvedValue([]);
      teamRepo.findUsersNotLoggedThisWeek.mockResolvedValue([]);
      teamRepo.findThresholdBreaches.mockResolvedValue([]);
      teamRepo.findActiveProjectsByTeam.mockResolvedValue([]);

      await service.getTeamBreakdown('user-1', 'org-1', false);

      expect(teamRepo.findManagedTeamIds).toHaveBeenCalledWith('user-1');
      expect(teamRepo.findAllActiveTeamIds).not.toHaveBeenCalled();
    });

    it('should return empty array for plain member', async () => {
      teamRepo.findManagedTeamIds.mockResolvedValue([]);

      const result = await service.getTeamBreakdown('user-1', 'org-1', false);

      expect(result.teams).toEqual([]);
    });

    it('should compute WoW% and MoM% per team', async () => {
      orgService.getSettings.mockResolvedValue(makeSettings());
      teamRepo.findAllActiveTeamIds.mockResolvedValue(['t1']);
      teamRepo.findTeamHoursByPeriod.mockResolvedValue([
        {
          teamId: 't1',
          teamName: 'Alpha',
          memberCount: 5,
          hoursThisWeek: 100,
          hoursLastWeek: 80,
          hoursThisMonth: 400,
          hoursLastMonth: 500,
        },
      ]);
      teamRepo.findUsersNotLoggedThisWeek.mockResolvedValue([]);
      teamRepo.findThresholdBreaches.mockResolvedValue([]);
      teamRepo.findActiveProjectsByTeam.mockResolvedValue([]);

      const result = await service.getTeamBreakdown('admin-1', 'org-1', true);

      expect(result.teams[0].weekOverWeekPct).toBe(25);
      expect(result.teams[0].monthOverMonthPct).toBe(-20);
    });

    it('should include active projects per team', async () => {
      orgService.getSettings.mockResolvedValue(makeSettings());
      teamRepo.findAllActiveTeamIds.mockResolvedValue(['t1']);
      teamRepo.findTeamHoursByPeriod.mockResolvedValue([
        {
          teamId: 't1',
          teamName: 'Alpha',
          memberCount: 3,
          hoursThisWeek: 20,
          hoursLastWeek: 20,
          hoursThisMonth: 80,
          hoursLastMonth: 80,
        },
      ]);
      teamRepo.findUsersNotLoggedThisWeek.mockResolvedValue([]);
      teamRepo.findThresholdBreaches.mockResolvedValue([]);
      teamRepo.findActiveProjectsByTeam.mockResolvedValue([
        { teamId: 't1', projectId: 'p1', projectName: 'Project A', totalCount: 3 },
        { teamId: 't1', projectId: 'p2', projectName: 'Project B', totalCount: 3 },
      ]);

      const result = await service.getTeamBreakdown('admin-1', 'org-1', true);

      expect(result.teams[0].activeProjects).toEqual([
        { projectId: 'p1', projectName: 'Project A' },
        { projectId: 'p2', projectName: 'Project B' },
      ]);
      expect(result.teams[0].activeProjectCount).toBe(3);
    });
  });

  describe('getOrgOverview', () => {
    it('should return correct counts', async () => {
      teamRepo.findOrgOverview.mockResolvedValue({
        users: { active: 10, deactivated: 2 },
        teams: { active: 3, archived: 1 },
        projects: { active: 5, archived: 2 },
      });

      const result = await service.getOrgOverview('org-1');

      expect(result.users).toEqual({ active: 10, deactivated: 2 });
      expect(result.teams).toEqual({ active: 3, archived: 1 });
      expect(result.projects).toEqual({ active: 5, archived: 2 });
    });
  });
});
