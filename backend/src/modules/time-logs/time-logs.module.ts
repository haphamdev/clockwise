import { Module } from '@nestjs/common';
import { TasksModule } from '../tasks/tasks.module';
import { ProjectsModule } from '../projects/projects.module';
import { OrgModule } from '../org/org.module';
import { TimeLogsRepository } from './time-logs.repository';
import { TimeLogsService } from './time-logs.service';
import { TimeLogsController } from './time-logs.controller';

@Module({
  imports: [TasksModule, ProjectsModule, OrgModule],
  controllers: [TimeLogsController],
  providers: [TimeLogsRepository, TimeLogsService],
  exports: [TimeLogsService],
})
export class TimeLogsModule {}
