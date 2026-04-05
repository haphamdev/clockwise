import { Logger } from '@nestjs/common';
import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { ImportJobStatus } from '@prisma/client';
import { ImportService } from './import.service';
import { ImportJobData, ImportJobResult } from './interfaces/import-job.interface';
import { ImportProgressCallback } from './interfaces/import-processor.interface';
import { IMPORT_QUEUE } from './import.constants';

const PROGRESS_INTERVAL_MS = 2000;

@Processor(IMPORT_QUEUE, { concurrency: 1 })
export class ImportJobProcessor extends WorkerHost {
  private readonly logger = new Logger(ImportJobProcessor.name);

  constructor(private readonly importService: ImportService) {
    super();
  }

  async process(job: Job<ImportJobData>): Promise<ImportJobResult> {
    const { type, executableRows, userId, orgId, isAdmin, importJobId } = job.data;

    const processor = this.importService.getProcessor(type);

    let lastUpdate = 0;
    const onProgress: ImportProgressCallback = (imported, errorCount) => {
      const now = Date.now();
      if (now - lastUpdate >= PROGRESS_INTERVAL_MS) {
        job.updateProgress({ imported, errorCount }).catch(() => {});
        lastUpdate = now;
      }
    };

    const result = await processor.execute(executableRows, { userId, orgId, isAdmin }, onProgress);
    await job.updateProgress({ imported: result.imported, errorCount: result.errors.length });

    const completedAt = new Date();
    try {
      await this.importService.updateJobRecord(importJobId, {
        status: ImportJobStatus.completed,
        imported: result.imported,
        errorCount: result.errors.length,
        completedAt,
      });
    } catch (error) {
      this.logger.error(
        `Failed to update import job ${importJobId} to completed: ${error.message}`,
      );
    }

    return {
      status: 'completed',
      totalRows: result.totalRows,
      imported: result.imported,
      errorCount: result.errors.length,
      errors: result.errors,
      completedAt: completedAt.toISOString(),
    };
  }

  @OnWorkerEvent('failed')
  async onFailed(job: Job<ImportJobData>, error: Error): Promise<void> {
    this.logger.error(
      `Import job ${job.id} (type=${job.data.type}) failed: ${error.message}`,
      error.stack,
    );

    const { importJobId } = job.data;
    try {
      await this.importService.updateJobRecord(importJobId, {
        status: ImportJobStatus.failed,
        completedAt: new Date(),
      });
    } catch (updateError) {
      this.logger.error(
        `Failed to update import job ${importJobId} to failed: ${updateError.message}`,
      );
    }
  }
}
