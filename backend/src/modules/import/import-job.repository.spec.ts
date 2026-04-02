import { ImportJobRepository, CreateImportJobInput } from './import-job.repository';
import { ImportJobStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

function makeInput(overrides?: Partial<CreateImportJobInput>): CreateImportJobInput {
  return {
    orgId: 'org-1',
    userId: 'user-1',
    type: 'time-log',
    totalRows: 10,
    ...overrides,
  };
}

function makeImportJob(overrides?: Record<string, unknown>) {
  return {
    id: 'job-1',
    orgId: 'org-1',
    userId: 'user-1',
    type: 'time-log',
    status: ImportJobStatus.pending,
    totalRows: 10,
    imported: 0,
    errorCount: 0,
    bullJobId: null,
    createdAt: new Date(),
    completedAt: null,
    ...overrides,
  };
}

describe('ImportJobRepository', () => {
  let repository: ImportJobRepository;
  let prisma: jest.Mocked<PrismaService>;

  beforeEach(() => {
    prisma = {
      importJob: {
        create: jest.fn(),
        update: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
      },
    } as unknown as jest.Mocked<PrismaService>;

    repository = new ImportJobRepository(prisma);
  });

  describe('create', () => {
    it('should create an import job record', async () => {
      const input = makeInput();
      const created = makeImportJob();
      (prisma.importJob.create as jest.Mock).mockResolvedValue(created);

      const result = await repository.create(input);

      expect(prisma.importJob.create).toHaveBeenCalledWith({ data: input });
      expect(result).toEqual(created);
    });

    it('should pass bullJobId when provided', async () => {
      const input = makeInput({ bullJobId: 'bull-123' });
      const created = makeImportJob({ bullJobId: 'bull-123' });
      (prisma.importJob.create as jest.Mock).mockResolvedValue(created);

      const result = await repository.create(input);

      expect(prisma.importJob.create).toHaveBeenCalledWith({ data: input });
      expect(result.bullJobId).toBe('bull-123');
    });
  });

  describe('updateStatus', () => {
    it('should update status and completion fields', async () => {
      const completedAt = new Date();
      (prisma.importJob.update as jest.Mock).mockResolvedValue(undefined);

      await repository.updateStatus('job-1', {
        status: ImportJobStatus.completed,
        imported: 8,
        errorCount: 2,
        completedAt,
      });

      expect(prisma.importJob.update).toHaveBeenCalledWith({
        where: { id: 'job-1' },
        data: {
          status: ImportJobStatus.completed,
          imported: 8,
          errorCount: 2,
          completedAt,
        },
      });
    });

    it('should update only status when partial update', async () => {
      (prisma.importJob.update as jest.Mock).mockResolvedValue(undefined);

      await repository.updateStatus('job-1', { status: ImportJobStatus.processing });

      expect(prisma.importJob.update).toHaveBeenCalledWith({
        where: { id: 'job-1' },
        data: { status: ImportJobStatus.processing },
      });
    });
  });

  describe('findByUser', () => {
    it('should filter by userId for non-admin users', async () => {
      const jobs = [makeImportJob()];
      (prisma.importJob.findMany as jest.Mock).mockResolvedValue(jobs);
      (prisma.importJob.count as jest.Mock).mockResolvedValue(1);

      const result = await repository.findByUser('user-1', 'org-1', false, {
        page: 1,
        limit: 20,
      });

      expect(prisma.importJob.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', orgId: 'org-1' },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 20,
      });
      expect(result).toEqual({ data: jobs, total: 1 });
    });

    it('should filter by orgId only for admin users', async () => {
      (prisma.importJob.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.importJob.count as jest.Mock).mockResolvedValue(0);

      await repository.findByUser('user-1', 'org-1', true, { page: 1, limit: 20 });

      expect(prisma.importJob.findMany).toHaveBeenCalledWith({
        where: { orgId: 'org-1' },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 20,
      });
    });

    it('should apply pagination offset', async () => {
      (prisma.importJob.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.importJob.count as jest.Mock).mockResolvedValue(0);

      await repository.findByUser('user-1', 'org-1', false, { page: 3, limit: 10 });

      expect(prisma.importJob.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 20, take: 10 }),
      );
    });

    it('should filter by type when provided', async () => {
      (prisma.importJob.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.importJob.count as jest.Mock).mockResolvedValue(0);

      await repository.findByUser('user-1', 'org-1', false, {
        page: 1,
        limit: 20,
        type: 'time-log',
      });

      expect(prisma.importJob.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user-1', orgId: 'org-1', type: 'time-log' },
        }),
      );
    });
  });
});
