import { randomUUID } from 'crypto';
import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { ImportJobStatus } from '@prisma/client';
import {
  ImportProcessor,
  ImportRow,
  ImportValidationError,
  ImportCallerContext,
} from './interfaces/import-processor.interface';
import { ImportJobData, ImportJobResult } from './interfaces/import-job.interface';
import {
  ImportUnsupportedTypeException,
  ImportJobNotFoundException,
  ImportNoValidRowsException,
  ImportPreviewExpiredException,
  ImportAdminOnlyException,
} from '../../common/exceptions/import.exceptions';
import {
  IMPORT_QUEUE,
  PREVIEW_CACHE_PREFIX,
  PREVIEW_CACHE_TTL_SECONDS,
} from './import.constants';
import { ImportJobRepository, UpdateImportJobInput } from './import-job.repository';
import { ImportJobEntity } from './entities/import-job.entity';

interface CachedPreview {
  type: string;
  executableRows: ImportRow[];
  userId: string;
  orgId: string;
  isAdmin: boolean;
}

export interface ImportPreviewResponse {
  validRows: ImportRow[];
  errors: ImportValidationError[];
  totalRows: number;
  previewToken?: string;
  expiresInSeconds?: number;
}

export interface ImportExecuteResponse {
  jobId: string;
  totalRows: number;
}

@Injectable()
export class ImportService {
  private processors = new Map<string, ImportProcessor>();

  constructor(
    @InjectQueue(IMPORT_QUEUE) private readonly importQueue: Queue,
    private readonly importJobRepository: ImportJobRepository,
  ) {}

  registerProcessor(processor: ImportProcessor): void {
    this.processors.set(processor.type, processor);
  }

  getProcessor(type: string): ImportProcessor {
    const processor = this.processors.get(type);
    if (!processor) {
      throw new ImportUnsupportedTypeException(type);
    }
    return processor;
  }

  getSupportedTypes(): string[] {
    return Array.from(this.processors.keys());
  }

  async preview(
    type: string,
    csvContent: string,
    ctx: ImportCallerContext,
  ): Promise<ImportPreviewResponse> {
    const processor = this.getProcessor(type);
    if (processor.adminOnly && !ctx.isAdmin) {
      throw new ImportAdminOnlyException(type);
    }
    const result = await processor.parseAndValidate(csvContent, ctx);

    let previewToken: string | undefined;
    let expiresInSeconds: number | undefined;
    if (result.executableRows.length > 0) {
      previewToken = await this.cachePreviewResult({
        type,
        executableRows: result.executableRows,
        userId: ctx.userId,
        orgId: ctx.orgId,
        isAdmin: ctx.isAdmin,
      });
      expiresInSeconds = PREVIEW_CACHE_TTL_SECONDS;
    }

    // Return clean rows (without internal fields) to the client
    const { executableRows: _, ...response } = result;
    return { ...response, previewToken, expiresInSeconds };
  }

  /**
   * Row data flows entirely through Redis (preview cache → BullMQ job payload)
   * and never touches Postgres. The DB record stores only metadata (status, counts).
   *
   * Trade-off: simpler schema and auto-cleanup, but row data is lost if Redis
   * restarts before the worker processes the job. Acceptable for a single-tenant
   * app with infrequent imports. If durability becomes important, store rows as
   * JSONB on the ImportJob table and pass only the job ID through the queue.
   */
  async execute(
    type: string,
    previewToken: string,
    ctx: ImportCallerContext,
  ): Promise<ImportExecuteResponse> {
    const cached = await this.retrievePreviewResult(previewToken);
    if (!cached || cached.userId !== ctx.userId || cached.orgId !== ctx.orgId || cached.type !== type) {
      throw new ImportPreviewExpiredException();
    }

    const processor = this.getProcessor(type);
    if (processor.adminOnly && !ctx.isAdmin) {
      throw new ImportAdminOnlyException(type);
    }

    if (cached.executableRows.length === 0) {
      throw new ImportNoValidRowsException();
    }

    const importJob = await this.importJobRepository.create({
      orgId: ctx.orgId,
      userId: ctx.userId,
      type,
      totalRows: cached.executableRows.length,
    });

    const jobData: ImportJobData = {
      type,
      executableRows: cached.executableRows,
      userId: ctx.userId,
      orgId: ctx.orgId,
      isAdmin: cached.isAdmin,
      importJobId: importJob.id,
    };

    let job: { id?: string };
    try {
      job = await this.importQueue.add('import', jobData, {
        attempts: 1,
        removeOnComplete: { age: 3600 },
        removeOnFail: { age: 7200 },
      });
    } catch (error) {
      await this.importJobRepository.updateStatus(importJob.id, {
        status: ImportJobStatus.failed,
        completedAt: new Date(),
      });
      throw error;
    }

    if (!job.id) {
      await this.importJobRepository.updateStatus(importJob.id, {
        status: ImportJobStatus.failed,
        completedAt: new Date(),
      });
      throw new Error('Failed to create import job');
    }

    await this.importJobRepository.updateStatus(importJob.id, {
      bullJobId: job.id,
    });

    return { jobId: job.id, totalRows: cached.executableRows.length };
  }

  async getJobStatus(
    jobId: string,
    userId: string,
    isAdmin: boolean,
  ): Promise<ImportJobResult & { jobId: string }> {
    const job = await this.importQueue.getJob(jobId);
    if (!job) {
      throw new ImportJobNotFoundException();
    }

    const jobData = job.data as ImportJobData;
    if (!isAdmin && jobData.userId !== userId) {
      throw new ImportJobNotFoundException();
    }

    const state = await job.getState();
    const result = job.returnvalue as ImportJobResult | undefined;

    if (state === 'completed' && result) {
      return { jobId, ...result };
    }

    if (state === 'failed') {
      return {
        jobId,
        status: 'failed',
        totalRows: jobData.executableRows.length,
        imported: 0,
        errorCount: 0,
        errors: [
          { row: 0, field: '', message: 'Import failed. Please try again or contact support.' },
        ],
      };
    }

    const raw = job.progress;
    const progress = typeof raw === 'object' && raw !== null
      ? (raw as { imported?: number; errorCount?: number })
      : undefined;
    return {
      jobId,
      status: state === 'active' ? 'processing' : 'pending',
      totalRows: jobData.executableRows.length,
      imported: progress?.imported ?? 0,
      errorCount: progress?.errorCount ?? 0,
      errors: [],
    };
  }

  async listJobs(
    userId: string,
    orgId: string,
    isAdmin: boolean,
    query: { page: number; limit: number; type?: string },
  ): Promise<{ data: ImportJobEntity[]; total: number; page: number; limit: number }> {
    const result = await this.importJobRepository.findByUser(userId, orgId, isAdmin, query);
    return { ...result, page: query.page, limit: query.limit };
  }

  async updateJobRecord(id: string, update: UpdateImportJobInput): Promise<void> {
    await this.importJobRepository.updateStatus(id, update);
  }

  private async cachePreviewResult(data: CachedPreview): Promise<string> {
    const token = randomUUID();
    const key = `${PREVIEW_CACHE_PREFIX}${token}`;
    const client = await this.importQueue.client;
    await client.set(key, JSON.stringify(data), 'EX', PREVIEW_CACHE_TTL_SECONDS);
    return token;
  }

  private async retrievePreviewResult(token: string): Promise<CachedPreview | null> {
    const key = `${PREVIEW_CACHE_PREFIX}${token}`;
    const client = await this.importQueue.client;
    const data = await client.getdel(key);
    if (!data) return null;
    return JSON.parse(data);
  }
}
