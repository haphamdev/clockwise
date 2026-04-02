import { randomUUID } from 'crypto';
import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import {
  ImportProcessor,
  ImportPreviewResult,
  ImportRow,
} from './interfaces/import-processor.interface';
import { ImportJobData, ImportJobResult } from './interfaces/import-job.interface';
import {
  ImportUnsupportedTypeException,
  ImportJobNotFoundException,
  ImportNoValidRowsException,
  ImportPreviewExpiredException,
} from '../../common/exceptions/import.exceptions';
import {
  IMPORT_QUEUE,
  PREVIEW_CACHE_PREFIX,
  PREVIEW_CACHE_TTL_SECONDS,
} from './import.constants';

interface CachedPreview {
  type: string;
  validRows: ImportRow[];
  userId: string;
  orgId: string;
}

export interface ImportPreviewResponse extends ImportPreviewResult {
  previewToken?: string;
}

export interface ImportExecuteResponse {
  jobId: string;
  totalRows: number;
}

@Injectable()
export class ImportService {
  private processors = new Map<string, ImportProcessor>();

  constructor(@InjectQueue(IMPORT_QUEUE) private readonly importQueue: Queue) {}

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
    userId: string,
    orgId: string,
  ): Promise<ImportPreviewResponse> {
    const processor = this.getProcessor(type);
    const result = await processor.parseAndValidate(csvContent, userId, orgId);

    let previewToken: string | undefined;
    if (result.validRows.length > 0) {
      previewToken = await this.cachePreviewResult({
        type,
        validRows: result.validRows,
        userId,
        orgId,
      });
    }

    return { ...result, previewToken };
  }

  async execute(
    type: string,
    previewToken: string,
    userId: string,
    orgId: string,
  ): Promise<ImportExecuteResponse> {
    const cached = await this.retrievePreviewResult(previewToken);
    if (!cached || cached.userId !== userId || cached.orgId !== orgId || cached.type !== type) {
      throw new ImportPreviewExpiredException();
    }

    this.getProcessor(type);

    if (cached.validRows.length === 0) {
      throw new ImportNoValidRowsException();
    }

    const jobData: ImportJobData = {
      type,
      validRows: cached.validRows,
      userId,
      orgId,
    };
    const job = await this.importQueue.add('import', jobData, {
      attempts: 1,
      removeOnComplete: { age: 3600 },
      removeOnFail: { age: 7200 },
    });

    if (!job.id) {
      throw new Error('Failed to create import job');
    }
    return { jobId: job.id, totalRows: cached.validRows.length };
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
        totalRows: jobData.validRows.length,
        imported: 0,
        errors: [
          { row: 0, field: '', message: 'Import failed. Please try again or contact support.' },
        ],
      };
    }

    return {
      jobId,
      status: state === 'active' ? 'processing' : 'pending',
      totalRows: jobData.validRows.length,
      imported: 0,
      errors: [],
    };
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
