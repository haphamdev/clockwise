import { ImportController } from './import.controller';
import { ImportService } from './import.service';
import { UserEntity } from '../users/entities/user.entity';
import { ImportJobStatus } from '@prisma/client';

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

describe('ImportController', () => {
  let controller: ImportController;
  let service: jest.Mocked<ImportService>;

  beforeEach(() => {
    service = {
      listJobs: jest.fn(),
      preview: jest.fn(),
      execute: jest.fn(),
      getJobStatus: jest.fn(),
      getProcessor: jest.fn(),
      registerProcessor: jest.fn(),
      getSupportedTypes: jest.fn(),
      updateJobRecord: jest.fn(),
    } as unknown as jest.Mocked<ImportService>;

    controller = new ImportController(service);
  });

  describe('listJobs', () => {
    it('should pass userId, orgId, and isAdmin to service', async () => {
      const now = new Date();
      service.listJobs.mockResolvedValue({
        data: [
          {
            id: 'job-1',
            orgId: 'org-1',
            userId: 'user-1',
            type: 'time-log',
            status: ImportJobStatus.completed,
            totalRows: 10,
            imported: 8,
            errorCount: 2,
            bullJobId: null,
            createdAt: now,
            completedAt: now,
          },
        ],
        total: 1,
        page: 1,
        limit: 20,
      });

      const user = makeUser();
      const result = await controller.listJobs(user, { page: 1, limit: 20 });

      expect(service.listJobs).toHaveBeenCalledWith('user-1', 'org-1', false, {
        page: 1,
        limit: 20,
      });
      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
    });

    it('should map Date fields to ISO strings', async () => {
      const createdAt = new Date('2026-04-01T10:00:00Z');
      const completedAt = new Date('2026-04-01T10:05:00Z');
      service.listJobs.mockResolvedValue({
        data: [
          {
            id: 'job-1',
            orgId: 'org-1',
            userId: 'user-1',
            type: 'time-log',
            status: ImportJobStatus.completed,
            totalRows: 5,
            imported: 5,
            errorCount: 0,
            bullJobId: null,
            createdAt,
            completedAt,
          },
        ],
        total: 1,
        page: 1,
        limit: 20,
      });

      const result = await controller.listJobs(makeUser(), { page: 1, limit: 20 });

      expect(result.data[0].createdAt).toBe(createdAt.toISOString());
      expect(result.data[0].completedAt).toBe(completedAt.toISOString());
    });

    it('should return null for completedAt when job is not completed', async () => {
      service.listJobs.mockResolvedValue({
        data: [
          {
            id: 'job-1',
            orgId: 'org-1',
            userId: 'user-1',
            type: 'time-log',
            status: ImportJobStatus.processing,
            totalRows: 5,
            imported: 0,
            errorCount: 0,
            bullJobId: null,
            createdAt: new Date(),
            completedAt: null,
          },
        ],
        total: 1,
        page: 1,
        limit: 20,
      });

      const result = await controller.listJobs(makeUser(), { page: 1, limit: 20 });

      expect(result.data[0].completedAt).toBeNull();
    });

    it('should pass isAdmin=true for admin users', async () => {
      service.listJobs.mockResolvedValue({ data: [], total: 0, page: 1, limit: 20 });

      await controller.listJobs(makeUser({ isAdmin: true }), { page: 1, limit: 20 });

      expect(service.listJobs).toHaveBeenCalledWith('user-1', 'org-1', true, {
        page: 1,
        limit: 20,
      });
    });

    it('should pass type filter when provided', async () => {
      service.listJobs.mockResolvedValue({ data: [], total: 0, page: 1, limit: 20 });

      await controller.listJobs(makeUser(), { page: 1, limit: 20, type: 'time-log' });

      expect(service.listJobs).toHaveBeenCalledWith('user-1', 'org-1', false, {
        page: 1,
        limit: 20,
        type: 'time-log',
      });
    });
  });
});
