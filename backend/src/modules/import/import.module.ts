import { BullModule } from "@nestjs/bullmq";
import { Module, OnModuleInit } from "@nestjs/common";
import { InvitationsModule } from "../invitations/invitations.module";
import { ProjectsModule } from "../projects/projects.module";
import { TeamsModule } from "../teams/teams.module";
import { TimeLogsModule } from "../time-logs/time-logs.module";
import { UsersModule } from "../users/users.module";
import { IMPORT_QUEUE } from "./import.constants";
import { ImportController } from "./import.controller";
import { ImportService } from "./import.service";
import { ImportJobProcessor } from "./import-job.processor";
import { ImportJobRepository } from "./import-job.repository";
import { InvitationImportProcessor } from "./processors/invitation-import.processor";
import { ProjectImportProcessor } from "./processors/project-import.processor";
import { TeamImportProcessor } from "./processors/team-import.processor";
import { TimeLogImportProcessor } from "./processors/time-log-import.processor";

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
  providers: [
    ImportService,
    ImportJobProcessor,
    ImportJobRepository,
    TimeLogImportProcessor,
    TeamImportProcessor,
    ProjectImportProcessor,
    InvitationImportProcessor,
  ],
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
