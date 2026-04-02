import { TimeLogsController } from './time-logs.controller';
import { TimeLogsService } from './time-logs.service';
import { UserEntity } from '../users/entities/user.entity';
import { TimeLogListItem } from './entities/time-log.entity';

function makeUser(overrides?: Partial<UserEntity>): UserEntity {
  return {
    id: 'user-1',
    orgId: 'org-1',
    email: 'user@example.com',
    name: 'Test User',
    avatarUrl: null,
    isAdmin: false,
    status: 'active',
    lastLoginAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function makeTimeLogListItem(overrides?: Partial<TimeLogListItem>): TimeLogListItem {
  return {
    id: 'tl-1',
    userId: 'user-1',
    projectId: 'project-1',
    date: new Date('2026-04-02'),
    hours: 8,
    notes: null,
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
    user: { id: 'user-1', name: 'Test User' },
    project: { id: 'project-1', name: 'Test Project' },
    tasks: [{ id: 'task-1', label: 'JIRA-123', description: null }],
    ...overrides,
  };
}

describe('TimeLogsController', () => {
  let controller: TimeLogsController;
  let service: jest.Mocked<TimeLogsService>;

  beforeEach(() => {
    service = {
      create: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      archive: jest.fn(),
      unarchive: jest.fn(),
    } as unknown as jest.Mocked<TimeLogsService>;

    controller = new TimeLogsController(service);
  });

  describe('create', () => {
    it('should pass userId, orgId, isAdmin and dto to service', async () => {
      const user = makeUser();
      const dto = {
        projectId: 'project-1',
        taskLabels: ['JIRA-123'],
        date: '2026-04-02',
        hours: 8,
      };
      service.create.mockResolvedValue({
        timeLog: makeTimeLogListItem(),
        warnings: [],
      });

      const result = await controller.create(user, dto);

      expect(service.create).toHaveBeenCalledWith('user-1', 'org-1', false, dto);
      expect(result.id).toBe('tl-1');
      expect(result.warnings).toEqual([]);
    });

    it('should include warnings in response', async () => {
      const user = makeUser();
      const dto = {
        projectId: 'project-1',
        taskLabels: ['JIRA-123'],
        date: '2026-04-02',
        hours: 14,
      };
      service.create.mockResolvedValue({
        timeLog: makeTimeLogListItem({ hours: 14 }),
        warnings: [
          {
            type: 'daily_limit' as const,
            message: 'Daily hours exceed 12h threshold',
            currentHours: 14,
            threshold: 12,
          },
        ],
      });

      const result = await controller.create(user, dto);

      expect(result.warnings).toHaveLength(1);
      expect(result.warnings![0].type).toBe('daily_limit');
    });
  });

  describe('list', () => {
    it('should pass filters and user context to service', async () => {
      const user = makeUser();
      service.findAll.mockResolvedValue({ data: [], total: 0, totalHours: 0 });

      const result = await controller.list(user, { page: 1, limit: 20 });

      expect(service.findAll).toHaveBeenCalledWith('org-1', 'user-1', false, {
        page: 1,
        limit: 20,
      });
      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
      expect(result.totalHours).toBe(0);
    });

    it('should map list items to response DTOs', async () => {
      const user = makeUser();
      service.findAll.mockResolvedValue({
        data: [makeTimeLogListItem()],
        total: 1,
        totalHours: 8,
      });

      const result = await controller.list(user, { page: 1, limit: 20 });

      expect(result.data).toHaveLength(1);
      const dto = result.data[0];
      expect(dto.id).toBe('tl-1');
      expect(dto.user).toEqual({ id: 'user-1', name: 'Test User' });
      expect(dto.project).toEqual({ id: 'project-1', name: 'Test Project' });
      expect(dto.tasks).toHaveLength(1);
      // Should not leak internal fields
      expect(dto).not.toHaveProperty('userId');
      expect(dto).not.toHaveProperty('projectId');
    });
  });

  describe('findOne', () => {
    it('should return time log detail', async () => {
      const user = makeUser();
      service.findById.mockResolvedValue(makeTimeLogListItem());

      const result = await controller.findOne('tl-1', user);

      expect(service.findById).toHaveBeenCalledWith('tl-1', 'org-1', 'user-1', false);
      expect(result.id).toBe('tl-1');
    });
  });

  describe('update', () => {
    it('should pass update dto with reason to service', async () => {
      const user = makeUser();
      const dto = { hours: 6, reason: 'Fixing hours' };
      service.update.mockResolvedValue({
        timeLog: makeTimeLogListItem({ hours: 6 }),
        warnings: [],
      });

      const result = await controller.update('tl-1', user, dto);

      expect(service.update).toHaveBeenCalledWith('tl-1', 'org-1', 'user-1', false, dto);
      expect(result.hours).toBe(6);
    });
  });

  describe('archive', () => {
    it('should archive time log with reason', async () => {
      const user = makeUser();
      service.archive.mockResolvedValue(undefined);

      await controller.archive('tl-1', user, { reason: 'Wrong entry' });

      expect(service.archive).toHaveBeenCalledWith(
        'tl-1',
        'org-1',
        'user-1',
        false,
        { reason: 'Wrong entry' },
      );
    });
  });

  describe('unarchive', () => {
    it('should unarchive time log with reason', async () => {
      const user = makeUser();
      service.unarchive.mockResolvedValue(undefined);

      await controller.unarchive('tl-1', user, { reason: 'Restored' });

      expect(service.unarchive).toHaveBeenCalledWith(
        'tl-1',
        'org-1',
        'user-1',
        false,
        { reason: 'Restored' },
      );
    });
  });
});
