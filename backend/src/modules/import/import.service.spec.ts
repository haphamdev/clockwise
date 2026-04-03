import { ImportService } from './import.service';
import { ImportJobRepository } from './import-job.repository';
import { ImportJobStatus } from '@prisma/client';
import { ImportProcessor, ImportCallerContext } from './interfaces/import-processor.interface';

function makeQueue(overrides?: Record<string, unknown>) {
  return {
    add: jest.fn().mockResolvedValue({ id: 'bull-job-1' }),
    getJob: jest.fn(),
    client: Promise.resolve({
      set: jest.fn(),
      getdel: jest.fn(),
    }),
    ...overrides,
  };
}

function makeRepository(overrides?: Record<string, unknown>) {
  return {
    create: jest.fn().mockResolvedValue({
      id: 'import-job-1',
      orgId: 'org-1',
      userId: 'user-1',
      type: 'time-log',
      status: ImportJobStatus.pending,
      totalRows: 3,
      imported: 0,
      errorCount: 0,
      bullJobId: null,
      createdAt: new Date(),
      completedAt: null,
    }),
    updateStatus: jest.fn().mockResolvedValue(undefined),
    findByUser: jest.fn().mockResolvedValue({ data: [], total: 0 }),
    ...overrides,
  };
}

function makeCtx(overrides?: Partial<ImportCallerContext>): ImportCallerContext {
  return { userId: 'user-1', orgId: 'org-1', isAdmin: false, ...overrides };
}

function makeCachedPreview(overrides?: Record<string, unknown>) {
  return JSON.stringify({
    type: 'time-log',
    executableRows: [
      { rowNumber: 1, data: { date: '2026-01-01' } },
      { rowNumber: 2, data: { date: '2026-01-02' } },
      { rowNumber: 3, data: { date: '2026-01-03' } },
    ],
    userId: 'user-1',
    orgId: 'org-1',
    isAdmin: false,
    ...overrides,
  });
}

describe('ImportService', () => {
  let service: ImportService;
  let queue: ReturnType<typeof makeQueue>;
  let repo: ReturnType<typeof makeRepository>;
  let processor: jest.Mocked<ImportProcessor>;

  beforeEach(() => {
    queue = makeQueue();
    repo = makeRepository();

    service = new ImportService(queue as never, repo as never);

    processor = {
      type: 'time-log',
      parseAndValidate: jest.fn(),
      execute: jest.fn(),
    };
    service.registerProcessor(processor);
  });

  describe('admin-only guard', () => {
    let adminProcessor: jest.Mocked<ImportProcessor>;

    beforeEach(() => {
      adminProcessor = {
        type: 'team',
        adminOnly: true,
        parseAndValidate: jest.fn(),
        execute: jest.fn(),
      };
      service.registerProcessor(adminProcessor);
    });

    it('should throw 403 on preview when non-admin uses admin-only type', async () => {
      await expect(
        service.preview('team', 'csv content', makeCtx({ isAdmin: false })),
      ).rejects.toThrow('requires admin access');
    });

    it('should allow admin to preview admin-only type', async () => {
      adminProcessor.parseAndValidate.mockResolvedValue({
        validRows: [], executableRows: [], errors: [], totalRows: 0,
      });
      await expect(
        service.preview('team', 'csv content', makeCtx({ isAdmin: true })),
      ).resolves.toBeDefined();
    });

    it('should throw 403 on execute when non-admin uses admin-only type', async () => {
      const redisClient = await queue.client;
      redisClient.getdel.mockResolvedValue(JSON.stringify({
        type: 'team',
        executableRows: [{ rowNumber: 1, data: {} }],
        userId: 'user-1',
        orgId: 'org-1',
        isAdmin: false,
      }));

      await expect(
        service.execute('team', 'token', makeCtx({ isAdmin: false })),
      ).rejects.toThrow('requires admin access');
    });

    it('should not block non-admin-only types', async () => {
      processor.parseAndValidate.mockResolvedValue({
        validRows: [], executableRows: [], errors: [], totalRows: 0,
      });
      await expect(
        service.preview('time-log', 'csv content', makeCtx({ isAdmin: false })),
      ).resolves.toBeDefined();
    });
  });

  describe('execute', () => {
    beforeEach(async () => {
      const redisClient = await queue.client;
      redisClient.getdel.mockResolvedValue(makeCachedPreview());
    });

    it('should create a DB row before queuing to BullMQ', async () => {
      await service.execute('time-log', 'preview-token', makeCtx());

      expect(repo.create).toHaveBeenCalledWith({
        orgId: 'org-1',
        userId: 'user-1',
        type: 'time-log',
        totalRows: 3,
      });

      expect(queue.add).toHaveBeenCalledWith(
        'import',
        expect.objectContaining({ importJobId: 'import-job-1' }),
        expect.any(Object),
      );
    });

    it('should store bullJobId after successful queuing', async () => {
      await service.execute('time-log', 'token', makeCtx());

      expect(repo.updateStatus).toHaveBeenCalledWith('import-job-1', {
        bullJobId: 'bull-job-1',
      });
    });

    it('should mark DB row as failed when queue.add throws', async () => {
      queue.add.mockRejectedValue(new Error('Redis connection lost'));

      await expect(
        service.execute('time-log', 'token', makeCtx()),
      ).rejects.toThrow('Redis connection lost');

      expect(repo.updateStatus).toHaveBeenCalledWith('import-job-1', {
        status: ImportJobStatus.failed,
        completedAt: expect.any(Date),
      });
    });

    it('should mark DB row as failed when queue.add returns no job ID', async () => {
      queue.add.mockResolvedValue({ id: undefined });

      await expect(
        service.execute('time-log', 'token', makeCtx()),
      ).rejects.toThrow('Failed to create import job');

      expect(repo.updateStatus).toHaveBeenCalledWith('import-job-1', {
        status: ImportJobStatus.failed,
        completedAt: expect.any(Date),
      });
    });
  });

  describe('listJobs', () => {
    it('should delegate to repository and append pagination info', async () => {
      const jobs = [
        {
          id: 'j1',
          type: 'time-log',
          status: ImportJobStatus.completed,
          totalRows: 5,
          imported: 5,
          errorCount: 0,
          createdAt: new Date(),
          completedAt: new Date(),
        },
      ];
      repo.findByUser.mockResolvedValue({ data: jobs, total: 1 });

      const result = await service.listJobs('user-1', 'org-1', false, {
        page: 1,
        limit: 20,
      });

      expect(repo.findByUser).toHaveBeenCalledWith('user-1', 'org-1', false, {
        page: 1,
        limit: 20,
      });
      expect(result).toEqual({ data: jobs, total: 1, page: 1, limit: 20 });
    });

    it('should pass type filter when provided', async () => {
      repo.findByUser.mockResolvedValue({ data: [], total: 0 });

      await service.listJobs('user-1', 'org-1', false, {
        page: 1,
        limit: 20,
        type: 'time-log',
      });

      expect(repo.findByUser).toHaveBeenCalledWith('user-1', 'org-1', false, {
        page: 1,
        limit: 20,
        type: 'time-log',
      });
    });

    it('should pass isAdmin=true to repository for admin users', async () => {
      repo.findByUser.mockResolvedValue({ data: [], total: 0 });

      await service.listJobs('user-1', 'org-1', true, { page: 1, limit: 10 });

      expect(repo.findByUser).toHaveBeenCalledWith('user-1', 'org-1', true, {
        page: 1,
        limit: 10,
      });
    });
  });

  describe('updateJobRecord', () => {
    it('should delegate to repository', async () => {
      const completedAt = new Date();
      await service.updateJobRecord('job-1', {
        status: ImportJobStatus.completed,
        imported: 5,
        errorCount: 1,
        completedAt,
      });

      expect(repo.updateStatus).toHaveBeenCalledWith('job-1', {
        status: ImportJobStatus.completed,
        imported: 5,
        errorCount: 1,
        completedAt,
      });
    });
  });
});
