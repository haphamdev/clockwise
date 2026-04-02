import { Logger } from '@nestjs/common';
import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
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
    const { type, executableRows, userId, orgId, isAdmin } = job.data;

    const processor = this.importService.getProcessor(type);
    const result = await processor.execute(executableRows, { userId, orgId, isAdmin });

    return {
      status: 'completed',
      totalRows: result.totalRows,
      imported: result.imported,
      errors: result.errors,
      completedAt: new Date().toISOString(),
    };
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job<ImportJobData>, error: Error): void {
    this.logger.error(
      `Import job ${job.id} (type=${job.data.type}) failed: ${error.message}`,
      error.stack,
    );
  }
}
