import { Logger } from '@nestjs/common';
import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { ImportJobStatus } from '@prisma/client';
import { ImportService } from './import.service';
import { ImportJobData, ImportJobResult } from './interfaces/import-job.interface';
import { IMPORT_QUEUE } from './import.constants';

@Processor(IMPORT_QUEUE, { concurrency: 1 })
export class ImportJobProcessor extends WorkerHost {
  private readonly logger = new Logger(ImportJobProcessor.name);

  constructor(private readonly importService: ImportService) {
    super();
  }

  async process(job: Job<ImportJobData>): Promise<ImportJobResult> {
    const { type, executableRows, userId, orgId, isAdmin, importJobId } = job.data;

    const processor = this.importService.getProcessor(type);
    const result = await processor.execute(executableRows, { userId, orgId, isAdmin });

    const completedAt = new Date();
    if (importJobId) {
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
    }

    return {
      status: 'completed',
      totalRows: result.totalRows,
      imported: result.imported,
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
    if (importJobId) {
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
}
