import { ErrorCode } from '../../common/exceptions/error-codes';
import { TimeLogsService } from './time-logs.service';
import { TimeLogsRepository } from './time-logs.repository';
import { TasksService } from '../tasks/tasks.service';
import { ProjectsService } from '../projects/projects.service';
import { OrgService } from '../org/org.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { TimeLogEntity, TimeLogListItem } from './entities/time-log.entity';
import { TaskEntity } from '../tasks/entities/task.entity';

const TODAY = '2026-04-02';
const TODAY_DATE = new Date(TODAY);

function makeTimeLog(overrides?: Partial<TimeLogEntity>): TimeLogEntity {
  return {
    id: 'tl-1',
    userId: 'user-1',
    projectId: 'project-1',
    date: TODAY_DATE,
    hours: 8,
    notes: null,
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function makeTimeLogListItem(overrides?: Partial<TimeLogListItem>): TimeLogListItem {
  return {
    ...makeTimeLog(),
    user: { id: 'user-1', name: 'Test User', email: 'test@example.com', status: 'active' },
    project: { id: 'project-1', name: 'Test Project', description: null, status: 'active' },
    tasks: [{ id: 'task-1', label: 'JIRA-123', description: null }],
    ...overrides,
  };
}

function makeTask(overrides?: Partial<TaskEntity>): TaskEntity {
  return {
    id: 'task-1',
    projectId: 'project-1',
    label: 'JIRA-123',
    labelNormalized: 'jira-123',
    description: null,
    createdBy: 'user-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

const defaultOrgSettings = {
  orgName: 'Test Org',
  expectedHoursPerWeek: 40,
  dailyWarningThreshold: 12,
  weeklyWarningThreshold: 60,
  dateFormat: 'YYYY-MM-DD' as const,
  timeFormat: '24h' as const,
  csvMaxRows: 500,
};

describe('TimeLogsService', () => {
  let service: TimeLogsService;
  let repo: jest.Mocked<TimeLogsRepository>;
  let tasksService: jest.Mocked<TasksService>;
  let projectsService: jest.Mocked<ProjectsService>;
  let orgService: jest.Mocked<OrgService>;
  let auditLogService: jest.Mocked<AuditLogService>;

  beforeEach(() => {
    repo = {
      create: jest.fn(),
      findById: jest.fn(),
      findListItemById: jest.fn(),
      update: jest.fn(),
      archive: jest.fn(),
      unarchive: jest.fn(),
      findAll: jest.fn(),
      sumHoursForDate: jest.fn(),
      sumHoursForWeek: jest.fn(),
      replaceTimeLogTasks: jest.fn(),
      findManagedUserIds: jest.fn(),
      findLoggableUsers: jest.fn(),
      existsByUserDateProjectTask: jest.fn(),
      isUserInOrg: jest.fn(),
    } as unknown as jest.Mocked<TimeLogsRepository>;

    tasksService = {
      findOrCreate: jest.fn(),
    } as unknown as jest.Mocked<TasksService>;

    projectsService = {
      validateProjectAccess: jest.fn(),
      getSettingsInternal: jest.fn().mockResolvedValue({
        dailyHourLimit: null,
        weeklyHourLimit: null,
      }),
    } as unknown as jest.Mocked<ProjectsService>;

    orgService = {
      getSettings: jest.fn(),
    } as unknown as jest.Mocked<OrgService>;

    auditLogService = {
      log: jest.fn(),
    } as unknown as jest.Mocked<AuditLogService>;

    service = new TimeLogsService(
      repo,
      tasksService,
      projectsService,
      orgService,
      auditLogService,
    );
  });

  describe('create', () => {
    const createDto = {
      projectId: 'project-1',
      taskLabels: ['JIRA-123'],
      date: TODAY,
      hours: 8,
      notes: 'Did some work',
    };

    beforeEach(() => {
      projectsService.validateProjectAccess.mockResolvedValue(undefined);
      tasksService.findOrCreate.mockResolvedValue(makeTask());
      repo.create.mockResolvedValue(makeTimeLog({ notes: 'Did some work' }));
      repo.findListItemById.mockResolvedValue(
        makeTimeLogListItem({ notes: 'Did some work' }),
      );
      orgService.getSettings.mockResolvedValue(defaultOrgSettings);
      repo.sumHoursForDate.mockResolvedValue(8);
      repo.sumHoursForWeek.mockResolvedValue(40);
    });

    it('should validate project access with requireActive', async () => {
      await service.create('user-1', 'org-1', false, createDto);

      expect(projectsService.validateProjectAccess).toHaveBeenCalledWith(
        'project-1',
        'org-1',
        'user-1',
        false,
        { requireActive: true },
      );
    });

    it('should findOrCreate tasks from labels', async () => {
      await service.create('user-1', 'org-1', false, {
        ...createDto,
        taskLabels: ['JIRA-123', 'JIRA-456'],
      });

      expect(tasksService.findOrCreate).toHaveBeenCalledTimes(2);
      expect(tasksService.findOrCreate).toHaveBeenCalledWith('project-1', 'JIRA-123', 'user-1');
      expect(tasksService.findOrCreate).toHaveBeenCalledWith('project-1', 'JIRA-456', 'user-1');
    });

    it('should reject future dates', async () => {
      await expect(
        service.create('user-1', 'org-1', false, {
          ...createDto,
          date: '2099-01-01',
        }),
      ).rejects.toThrow(
        expect.objectContaining({ code: ErrorCode.TIME_LOG.FUTURE_DATE }),
      );
    });

    it('should pass orgId to findListItemById', async () => {
      await service.create('user-1', 'org-1', false, createDto);

      expect(repo.findListItemById).toHaveBeenCalledWith(
        expect.any(String),
        'org-1',
      );
    });

    it('should create time log and return with warnings', async () => {
      repo.sumHoursForDate.mockResolvedValue(14);

      const result = await service.create('user-1', 'org-1', false, createDto);

      expect(result.timeLog).toBeDefined();
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0].type).toBe('daily_limit');
      expect(result.warnings[0].currentHours).toBe(14);
      expect(result.warnings[0].threshold).toBe(12);
    });

    it('should return no warnings when under thresholds', async () => {
      const result = await service.create('user-1', 'org-1', false, createDto);

      expect(result.warnings).toHaveLength(0);
    });

    it('should create audit log entry', async () => {
      await service.create('user-1', 'org-1', false, createDto);

      expect(auditLogService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          orgId: 'org-1',
          entityType: 'time_log',
          action: 'created',
          performedBy: 'user-1',
        }),
      );
    });

    it('should set performedBy and onBehalfOf in audit when logging on behalf', async () => {
      await service.create('user-2', 'org-1', false, createDto, 'manager-1');

      expect(auditLogService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          performedBy: 'manager-1',
          metadata: expect.objectContaining({
            onBehalfOf: 'user-2',
          }),
        }),
      );
    });

    it('should not include onBehalfOf when performedBy matches userId', async () => {
      await service.create('user-1', 'org-1', false, createDto, 'user-1');

      const call = auditLogService.log.mock.calls[0][0];
      expect(call.performedBy).toBe('user-1');
      expect(call.metadata).not.toHaveProperty('onBehalfOf');
    });

    it('should not include onBehalfOf when performedBy is omitted', async () => {
      await service.create('user-1', 'org-1', false, createDto);

      const call = auditLogService.log.mock.calls[0][0];
      expect(call.performedBy).toBe('user-1');
      expect(call.metadata).not.toHaveProperty('onBehalfOf');
    });
  });

  describe('findById', () => {
    it('should return time log detail for owner', async () => {
      const listItem = makeTimeLogListItem();
      repo.findListItemById.mockResolvedValue(listItem);

      const result = await service.findById('tl-1', 'org-1', 'user-1', false);

      expect(result).toEqual(listItem);
      expect(repo.findListItemById).toHaveBeenCalledWith('tl-1', 'org-1');
    });

    it('should allow admin to view any time log', async () => {
      const listItem = makeTimeLogListItem({ userId: 'other-user' });
      repo.findListItemById.mockResolvedValue(listItem);

      const result = await service.findById('tl-1', 'org-1', 'admin-user', true);

      expect(result).toEqual(listItem);
    });

    it('should allow manager to view team member time log', async () => {
      const listItem = makeTimeLogListItem({ userId: 'team-member' });
      repo.findListItemById.mockResolvedValue(listItem);
      repo.findManagedUserIds.mockResolvedValue(['team-member']);

      const result = await service.findById('tl-1', 'org-1', 'manager-user', false);

      expect(result).toEqual(listItem);
    });

    it('should throw NOT_FOUND when time log does not exist', async () => {
      repo.findListItemById.mockResolvedValue(null);

      await expect(
        service.findById('bad-id', 'org-1', 'user-1', false),
      ).rejects.toThrow(
        expect.objectContaining({ code: ErrorCode.TIME_LOG.NOT_FOUND }),
      );
    });

    it('should throw NOT_FOUND for time log in different org (filtered at DB level)', async () => {
      repo.findListItemById.mockResolvedValue(null);

      await expect(
        service.findById('tl-1', 'other-org', 'admin-user', true),
      ).rejects.toThrow(
        expect.objectContaining({ code: ErrorCode.TIME_LOG.NOT_FOUND }),
      );
    });

    it('should throw INSUFFICIENT_PERMISSION for non-owner non-manager', async () => {
      const listItem = makeTimeLogListItem({ userId: 'other-user' });
      repo.findListItemById.mockResolvedValue(listItem);
      repo.findManagedUserIds.mockResolvedValue([]);

      await expect(
        service.findById('tl-1', 'org-1', 'random-user', false),
      ).rejects.toThrow(
        expect.objectContaining({ code: ErrorCode.TIME_LOG.INSUFFICIENT_PERMISSION }),
      );
    });
  });

  describe('update', () => {
    const updateDto = {
      hours: 6,
      reason: 'Correcting logged hours',
    };

    beforeEach(() => {
      const existing = makeTimeLogListItem();
      const updated = makeTimeLogListItem({ hours: 6 });
      repo.findListItemById
        .mockResolvedValueOnce(existing)
        .mockResolvedValueOnce(updated);
      repo.update.mockResolvedValue(makeTimeLog({ hours: 6 }));
      orgService.getSettings.mockResolvedValue(defaultOrgSettings);
      repo.sumHoursForDate.mockResolvedValue(6);
      repo.sumHoursForWeek.mockResolvedValue(38);
    });

    it('should update time log fields', async () => {
      const result = await service.update('tl-1', 'org-1', 'user-1', false, updateDto);

      expect(result.timeLog).toBeDefined();
      expect(repo.update).toHaveBeenCalledWith(
        'tl-1',
        expect.objectContaining({ hours: 6 }),
      );
    });

    it('should record hours change in audit metadata', async () => {
      await service.update('tl-1', 'org-1', 'user-1', false, updateDto);

      expect(auditLogService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'updated',
          reason: 'Correcting logged hours',
          metadata: expect.objectContaining({
            before: expect.objectContaining({ hours: 8 }),
            after: expect.objectContaining({ hours: 6 }),
          }),
        }),
      );
    });

    it('should pass orgId to findListItemById', async () => {
      await service.update('tl-1', 'org-1', 'user-1', false, updateDto);

      expect(repo.findListItemById).toHaveBeenCalledWith('tl-1', 'org-1');
    });

    it('should throw ARCHIVED when updating archived time log', async () => {
      repo.findListItemById.mockReset();
      repo.findListItemById.mockResolvedValue(
        makeTimeLogListItem({ status: 'archived' }),
      );

      await expect(
        service.update('tl-1', 'org-1', 'user-1', false, updateDto),
      ).rejects.toThrow(
        expect.objectContaining({ code: ErrorCode.TIME_LOG.ARCHIVED }),
      );
    });

    it('should throw INSUFFICIENT_PERMISSION for non-owner non-manager', async () => {
      repo.findListItemById.mockReset();
      repo.findListItemById.mockResolvedValue(
        makeTimeLogListItem({ userId: 'other-user' }),
      );
      repo.findManagedUserIds.mockResolvedValue([]);

      await expect(
        service.update('tl-1', 'org-1', 'random-user', false, updateDto),
      ).rejects.toThrow(
        expect.objectContaining({ code: ErrorCode.TIME_LOG.INSUFFICIENT_PERMISSION }),
      );
    });

    it('should reject future date on update', async () => {
      await expect(
        service.update('tl-1', 'org-1', 'user-1', false, {
          date: '2099-01-01',
          reason: 'test',
        }),
      ).rejects.toThrow(
        expect.objectContaining({ code: ErrorCode.TIME_LOG.FUTURE_DATE }),
      );
    });

    it('should replace tasks using existing projectId', async () => {
      tasksService.findOrCreate.mockResolvedValue(
        makeTask({ id: 'task-2', label: 'JIRA-456' }),
      );

      await service.update('tl-1', 'org-1', 'user-1', false, {
        taskLabels: ['JIRA-456'],
        reason: 'Wrong task',
      });

      expect(tasksService.findOrCreate).toHaveBeenCalledWith(
        'project-1',
        'JIRA-456',
        'user-1',
      );
      expect(repo.replaceTimeLogTasks).toHaveBeenCalledWith('tl-1', ['task-2']);
    });
  });

  describe('archive', () => {
    beforeEach(() => {
      repo.findListItemById.mockResolvedValue(makeTimeLogListItem());
      repo.archive.mockResolvedValue(makeTimeLog({ status: 'archived' }));
    });

    it('should archive an active time log', async () => {
      await service.archive('tl-1', 'org-1', 'user-1', false, {
        reason: 'Wrong entry',
      });

      expect(repo.archive).toHaveBeenCalledWith('tl-1');
    });

    it('should require reason in audit log', async () => {
      await service.archive('tl-1', 'org-1', 'user-1', false, {
        reason: 'Wrong entry',
      });

      expect(auditLogService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'archived',
          reason: 'Wrong entry',
        }),
      );
    });

    it('should pass orgId to findListItemById', async () => {
      await service.archive('tl-1', 'org-1', 'user-1', false, {
        reason: 'Wrong entry',
      });

      expect(repo.findListItemById).toHaveBeenCalledWith('tl-1', 'org-1');
    });

    it('should throw ARCHIVED when already archived', async () => {
      repo.findListItemById.mockResolvedValue(
        makeTimeLogListItem({ status: 'archived' }),
      );

      await expect(
        service.archive('tl-1', 'org-1', 'user-1', false, { reason: 'test' }),
      ).rejects.toThrow(
        expect.objectContaining({ code: ErrorCode.TIME_LOG.ARCHIVED }),
      );
    });
  });

  describe('unarchive', () => {
    beforeEach(() => {
      repo.findListItemById.mockResolvedValue(
        makeTimeLogListItem({ status: 'archived' }),
      );
      repo.unarchive.mockResolvedValue(makeTimeLog({ status: 'active' }));
    });

    it('should unarchive an archived time log', async () => {
      await service.unarchive('tl-1', 'org-1', 'user-1', false, {
        reason: 'Restored',
      });

      expect(repo.unarchive).toHaveBeenCalledWith('tl-1');
    });

    it('should throw NOT_ARCHIVED when already active', async () => {
      repo.findListItemById.mockResolvedValue(
        makeTimeLogListItem({ status: 'active' }),
      );

      await expect(
        service.unarchive('tl-1', 'org-1', 'user-1', false, { reason: 'test' }),
      ).rejects.toThrow(
        expect.objectContaining({ code: ErrorCode.TIME_LOG.NOT_ARCHIVED }),
      );
    });
  });

  describe('findAll', () => {
    it('should scope member to their own logs', async () => {
      repo.findManagedUserIds.mockResolvedValue([]);
      repo.findAll.mockResolvedValue({ data: [], total: 0, totalHours: 0 });

      await service.findAll('org-1', 'user-1', false, { page: 1, limit: 20 });

      expect(repo.findAll).toHaveBeenCalledWith(
        'org-1',
        expect.objectContaining({ scopedUserIds: ['user-1'] }),
      );
    });

    it('should scope manager to managed team members', async () => {
      repo.findManagedUserIds.mockResolvedValue(['user-a', 'user-b']);
      repo.findAll.mockResolvedValue({ data: [], total: 0, totalHours: 0 });

      await service.findAll('org-1', 'manager-1', false, { page: 1, limit: 20 });

      expect(repo.findManagedUserIds).toHaveBeenCalledWith('manager-1');
      expect(repo.findAll).toHaveBeenCalledWith(
        'org-1',
        expect.objectContaining({
          scopedUserIds: expect.arrayContaining(['user-a', 'user-b', 'manager-1']),
        }),
      );
    });

    it('should not scope admin', async () => {
      repo.findAll.mockResolvedValue({ data: [], total: 0, totalHours: 0 });

      await service.findAll('org-1', 'admin-1', true, { page: 1, limit: 20 });

      expect(repo.findAll).toHaveBeenCalledWith(
        'org-1',
        expect.objectContaining({ scopedUserIds: undefined }),
      );
    });

    it('should intersect userIds filter with scope for manager', async () => {
      repo.findManagedUserIds.mockResolvedValue(['user-a', 'user-b']);
      repo.findAll.mockResolvedValue({ data: [], total: 0, totalHours: 0 });

      await service.findAll('org-1', 'manager-1', false, {
        page: 1,
        limit: 20,
        userIds: ['user-a'],
      });

      expect(repo.findAll).toHaveBeenCalledWith(
        'org-1',
        expect.objectContaining({
          scopedUserIds: ['user-a'],
          userIds: undefined,
        }),
      );
    });

    it('should return empty scope when userIds filter is outside permitted scope', async () => {
      repo.findManagedUserIds.mockResolvedValue(['user-a', 'user-b']);
      repo.findAll.mockResolvedValue({ data: [], total: 0, totalHours: 0 });

      await service.findAll('org-1', 'manager-1', false, {
        page: 1,
        limit: 20,
        userIds: ['user-outside-scope'],
      });

      expect(repo.findAll).toHaveBeenCalledWith(
        'org-1',
        expect.objectContaining({ scopedUserIds: [] }),
      );
    });

    it('should pass userIds filter directly for admin', async () => {
      repo.findAll.mockResolvedValue({ data: [], total: 0, totalHours: 0 });

      await service.findAll('org-1', 'admin-1', true, {
        page: 1,
        limit: 20,
        userIds: ['any-user'],
      });

      expect(repo.findAll).toHaveBeenCalledWith(
        'org-1',
        expect.objectContaining({
          userIds: ['any-user'],
          scopedUserIds: undefined,
        }),
      );
    });

    it('should apply default date range of last 4 weeks', async () => {
      repo.findManagedUserIds.mockResolvedValue([]);
      repo.findAll.mockResolvedValue({ data: [], total: 0, totalHours: 0 });

      await service.findAll('org-1', 'user-1', false, { page: 1, limit: 20 });

      const callArgs = repo.findAll.mock.calls[0][1];
      expect(callArgs.dateFrom).toBeDefined();
      expect(callArgs.dateTo).toBeDefined();
    });

    it('should respect explicit date filters', async () => {
      repo.findManagedUserIds.mockResolvedValue([]);
      repo.findAll.mockResolvedValue({ data: [], total: 0, totalHours: 0 });

      await service.findAll('org-1', 'user-1', false, {
        page: 1,
        limit: 20,
        dateFrom: '2026-01-01',
        dateTo: '2026-03-31',
      });

      expect(repo.findAll).toHaveBeenCalledWith(
        'org-1',
        expect.objectContaining({
          dateFrom: '2026-01-01',
          dateTo: '2026-03-31',
        }),
      );
    });
  });

  describe('computeWarnings', () => {
    beforeEach(() => {
      orgService.getSettings.mockResolvedValue(defaultOrgSettings);
    });

    it('should return daily warning when over threshold', async () => {
      repo.sumHoursForDate.mockResolvedValue(14);
      repo.sumHoursForWeek.mockResolvedValue(40);

      const warnings = await service.computeWarnings('user-1', TODAY_DATE, 'org-1');

      expect(warnings).toHaveLength(1);
      expect(warnings[0].type).toBe('daily_limit');
    });

    it('should return weekly warning when over threshold', async () => {
      repo.sumHoursForDate.mockResolvedValue(8);
      repo.sumHoursForWeek.mockResolvedValue(65);

      const warnings = await service.computeWarnings('user-1', TODAY_DATE, 'org-1');

      expect(warnings).toHaveLength(1);
      expect(warnings[0].type).toBe('weekly_limit');
    });

    it('should return both warnings when both thresholds exceeded', async () => {
      repo.sumHoursForDate.mockResolvedValue(14);
      repo.sumHoursForWeek.mockResolvedValue(65);

      const warnings = await service.computeWarnings('user-1', TODAY_DATE, 'org-1');

      expect(warnings).toHaveLength(2);
    });

    it('should return empty array when under thresholds', async () => {
      repo.sumHoursForDate.mockResolvedValue(6);
      repo.sumHoursForWeek.mockResolvedValue(30);

      const warnings = await service.computeWarnings('user-1', TODAY_DATE, 'org-1');

      expect(warnings).toHaveLength(0);
    });

    it('should use project-level dailyHourLimit when set', async () => {
      projectsService.getSettingsInternal.mockResolvedValue({
        dailyHourLimit: 6,
        weeklyHourLimit: null,
      });
      repo.sumHoursForDate.mockResolvedValue(8);
      repo.sumHoursForWeek.mockResolvedValue(30);

      const warnings = await service.computeWarnings('user-1', TODAY_DATE, 'org-1', 'project-1');

      expect(warnings).toHaveLength(1);
      expect(warnings[0].type).toBe('daily_limit');
      expect(warnings[0].threshold).toBe(6);
    });

    it('should use project-level weeklyHourLimit when set', async () => {
      projectsService.getSettingsInternal.mockResolvedValue({
        dailyHourLimit: null,
        weeklyHourLimit: 40,
      });
      repo.sumHoursForDate.mockResolvedValue(8);
      repo.sumHoursForWeek.mockResolvedValue(45);

      const warnings = await service.computeWarnings('user-1', TODAY_DATE, 'org-1', 'project-1');

      expect(warnings).toHaveLength(1);
      expect(warnings[0].type).toBe('weekly_limit');
      expect(warnings[0].threshold).toBe(40);
    });

    it('should fall back to org threshold when project limit is null', async () => {
      projectsService.getSettingsInternal.mockResolvedValue({
        dailyHourLimit: null,
        weeklyHourLimit: null,
      });
      repo.sumHoursForDate.mockResolvedValue(14);
      repo.sumHoursForWeek.mockResolvedValue(30);

      const warnings = await service.computeWarnings('user-1', TODAY_DATE, 'org-1', 'project-1');

      expect(warnings).toHaveLength(1);
      expect(warnings[0].threshold).toBe(12); // org default
    });

    it('should skip project settings when no projectId provided', async () => {
      repo.sumHoursForDate.mockResolvedValue(14);
      repo.sumHoursForWeek.mockResolvedValue(30);

      const warnings = await service.computeWarnings('user-1', TODAY_DATE, 'org-1');

      expect(projectsService.getSettingsInternal).not.toHaveBeenCalled();
      expect(warnings).toHaveLength(1);
      expect(warnings[0].threshold).toBe(12); // org default
    });
  });

  describe('createForImport', () => {
    const importDto = {
      projectId: 'project-1',
      taskLabel: 'IMPORT-TASK',
      date: '2026-03-15',
      hours: 4,
      notes: 'Imported entry',
    };

    beforeEach(() => {
      tasksService.findOrCreate.mockResolvedValue(makeTask({ label: 'IMPORT-TASK' }));
      repo.create.mockResolvedValue(makeTimeLog({ hours: 4 }));
    });

    it('should create time log and audit log with import source', async () => {
      await service.createForImport('user-1', 'org-1', 'user-1', importDto);

      expect(tasksService.findOrCreate).toHaveBeenCalledWith('project-1', 'IMPORT-TASK', 'user-1');
      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-1',
          projectId: 'project-1',
          hours: 4,
          taskIds: ['task-1'],
        }),
      );
      expect(auditLogService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'created',
          metadata: expect.objectContaining({ source: 'import' }),
        }),
      );
    });

    it('should include onBehalfOf in audit metadata when importing for another user', async () => {
      await service.createForImport('user-2', 'org-1', 'user-1', importDto);

      expect(auditLogService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            source: 'import',
            onBehalfOf: 'user-2',
          }),
        }),
      );
    });

    it('should not include onBehalfOf when importing for self', async () => {
      await service.createForImport('user-1', 'org-1', 'user-1', importDto);

      const call = auditLogService.log.mock.calls[0][0];
      expect(call.metadata).not.toHaveProperty('onBehalfOf');
    });

    it('should parse date with local midnight (T00:00:00)', async () => {
      await service.createForImport('user-1', 'org-1', 'user-1', importDto);

      const createCall = repo.create.mock.calls[0][0];
      expect(createCall.date).toEqual(new Date('2026-03-15T00:00:00'));
    });
  });

  describe('canLogOnBehalf', () => {
    it('should allow admin to log on behalf of same-org user', async () => {
      repo.isUserInOrg.mockResolvedValue(true);
      const result = await service.canLogOnBehalf('admin-1', true, 'user-2', 'org-1');
      expect(result).toBe(true);
      expect(repo.isUserInOrg).toHaveBeenCalledWith('user-2', 'org-1');
      expect(repo.findManagedUserIds).not.toHaveBeenCalled();
    });

    it('should deny admin for cross-org user', async () => {
      repo.isUserInOrg.mockResolvedValue(false);
      const result = await service.canLogOnBehalf('admin-1', true, 'user-other-org', 'org-1');
      expect(result).toBe(false);
    });

    it('should allow user to log for themselves', async () => {
      const result = await service.canLogOnBehalf('user-1', false, 'user-1', 'org-1');
      expect(result).toBe(true);
      expect(repo.isUserInOrg).not.toHaveBeenCalled();
    });

    it('should allow manager to log for managed team member', async () => {
      repo.isUserInOrg.mockResolvedValue(true);
      repo.findManagedUserIds.mockResolvedValue(['user-2', 'user-3']);
      const result = await service.canLogOnBehalf('manager-1', false, 'user-2', 'org-1');
      expect(result).toBe(true);
    });

    it('should deny non-manager for unrelated user', async () => {
      repo.isUserInOrg.mockResolvedValue(true);
      repo.findManagedUserIds.mockResolvedValue(['user-3']);
      const result = await service.canLogOnBehalf('user-1', false, 'user-2', 'org-1');
      expect(result).toBe(false);
    });
  });

  describe('getLoggableUsers', () => {
    const allUsers = [
      { id: 'user-1', name: 'Alice', email: 'alice@example.com' },
      { id: 'user-2', name: 'Bob', email: 'bob@example.com' },
      { id: 'user-3', name: 'Charlie', email: 'charlie@example.com' },
    ];

    it('should return all active users for admin', async () => {
      repo.findLoggableUsers.mockResolvedValue(allUsers);

      const result = await service.getLoggableUsers('admin-1', 'org-1', true);

      expect(result).toEqual(allUsers);
      expect(repo.findLoggableUsers).toHaveBeenCalledWith('org-1');
    });

    it('should return self + managed users for manager', async () => {
      repo.findManagedUserIds.mockResolvedValue(['user-2', 'user-3']);
      repo.findLoggableUsers.mockResolvedValue(allUsers);

      const result = await service.getLoggableUsers('user-1', 'org-1', false);

      expect(result).toEqual(allUsers);
      expect(repo.findLoggableUsers).toHaveBeenCalledWith(
        'org-1',
        expect.arrayContaining(['user-1', 'user-2', 'user-3']),
      );
    });

    it('should return only self for regular member', async () => {
      repo.findManagedUserIds.mockResolvedValue([]);
      repo.findLoggableUsers.mockResolvedValue([allUsers[0]]);

      const result = await service.getLoggableUsers('user-1', 'org-1', false);

      expect(result).toEqual([allUsers[0]]);
      expect(repo.findLoggableUsers).toHaveBeenCalledWith('org-1', ['user-1']);
    });
  });

  describe('existsByUserDateProjectTask', () => {
    it('should delegate to repository with local-midnight date', async () => {
      repo.existsByUserDateProjectTask.mockResolvedValue(true);

      const result = await service.existsByUserDateProjectTask(
        'user-1', '2026-03-15', 'project-1', 'TASK-1',
      );

      expect(result).toBe(true);
      expect(repo.existsByUserDateProjectTask).toHaveBeenCalledWith(
        'user-1',
        new Date('2026-03-15T00:00:00'),
        'project-1',
        'TASK-1',
      );
    });

    it('should return false when no duplicate exists', async () => {
      repo.existsByUserDateProjectTask.mockResolvedValue(false);

      const result = await service.existsByUserDateProjectTask(
        'user-1', '2026-03-15', 'project-1', 'TASK-1',
      );

      expect(result).toBe(false);
    });
  });
});
