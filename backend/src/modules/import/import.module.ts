import { Module, OnModuleInit } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { IMPORT_QUEUE } from './import.constants';
import { ImportService } from './import.service';
import { ImportController } from './import.controller';
import { ImportJobProcessor } from './import-job.processor';
import { ImportJobRepository } from './import-job.repository';
import { TimeLogImportProcessor } from './processors/time-log-import.processor';
import { TeamImportProcessor } from './processors/team-import.processor';
import { ProjectImportProcessor } from './processors/project-import.processor';
import { InvitationImportProcessor } from './processors/invitation-import.processor';
import { ProjectsModule } from '../projects/projects.module';
import { InvitationsModule } from '../invitations/invitations.module';
import { UsersModule } from '../users/users.module';
import { TeamsModule } from '../teams/teams.module';
import { TimeLogsModule } from '../time-logs/time-logs.module';

@Module({
  imports: [
    BullModule.registerQueue({ name: IMPORT_QUEUE }),
    ProjectsModule,
    UsersModule,
    TeamsModule,
    TimeLogsModule,
    InvitationsModule,
  ],
  controllers: [ImportController],
  providers: [ImportService, ImportJobProcessor, ImportJobRepository, TimeLogImportProcessor, TeamImportProcessor, ProjectImportProcessor, InvitationImportProcessor],
  exports: [ImportService],
})
export class ImportModule implements OnModuleInit {
  constructor(
    private readonly importService: ImportService,
    private readonly timeLogImportProcessor: TimeLogImportProcessor,
    private readonly teamImportProcessor: TeamImportProcessor,
    private readonly projectImportProcessor: ProjectImportProcessor,
    private readonly invitationImportProcessor: InvitationImportProcessor,
  ) {}

  onModuleInit(): void {
    this.importService.registerProcessor(this.timeLogImportProcessor);
    this.importService.registerProcessor(this.teamImportProcessor);
    this.importService.registerProcessor(this.projectImportProcessor);
    this.importService.registerProcessor(this.invitationImportProcessor);
  }
}
