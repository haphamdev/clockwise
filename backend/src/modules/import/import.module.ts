import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { IMPORT_QUEUE } from './import.constants';
import { ImportService } from './import.service';
import { ImportController } from './import.controller';
import { ImportJobProcessor } from './import-job.processor';

@Module({
  imports: [
    BullModule.registerQueue({ name: IMPORT_QUEUE }),
  ],
  controllers: [ImportController],
  providers: [ImportService, ImportJobProcessor],
  exports: [ImportService],
})
export class ImportModule {}
