import { Module } from "@nestjs/common";
import { OrgModule } from "../org/org.module";
import { ProjectsModule } from "../projects/projects.module";
import { TasksModule } from "../tasks/tasks.module";
import { TimeLogsController } from "./time-logs.controller";
import { TimeLogsRepository } from "./time-logs.repository";
import { TimeLogsService } from "./time-logs.service";

@Module({
  imports: [TasksModule, ProjectsModule, OrgModule],
  controllers: [TimeLogsController],
  providers: [TimeLogsRepository, TimeLogsService],
  exports: [TimeLogsService],
})
export class TimeLogsModule {}
