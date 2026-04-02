import { Module, OnModuleInit } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { IMPORT_QUEUE } from './import.constants';
import { ImportService } from './import.service';
import { ImportController } from './import.controller';
import { ImportJobProcessor } from './import-job.processor';
import { ImportJobRepository } from './import-job.repository';
import { TimeLogImportProcessor } from './processors/time-log-import.processor';
import { ProjectsModule } from '../projects/projects.module';
import { UsersModule } from '../users/users.module';
import { TimeLogsModule } from '../time-logs/time-logs.module';

@Module({
  imports: [
    BullModule.registerQueue({ name: IMPORT_QUEUE }),
    ProjectsModule,
    UsersModule,
    TimeLogsModule,
  ],
  controllers: [ImportController],
  providers: [ImportService, ImportJobProcessor, ImportJobRepository, TimeLogImportProcessor],
  exports: [ImportService],
})
export class ImportModule implements OnModuleInit {
  constructor(
    private readonly importService: ImportService,
    private readonly timeLogImportProcessor: TimeLogImportProcessor,
  ) {}

  onModuleInit(): void {
    this.importService.registerProcessor(this.timeLogImportProcessor);
  }
}
