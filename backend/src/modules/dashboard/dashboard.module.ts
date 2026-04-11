import { Module } from "@nestjs/common";
import { OrgModule } from "../org/org.module";
import { DashboardController } from "./dashboard.controller";
import { DashboardService } from "./dashboard.service";
import { DashboardPersonalRepository } from "./dashboard-personal.repository";
import { DashboardTeamRepository } from "./dashboard-team.repository";

@Module({
  imports: [OrgModule],
  controllers: [DashboardController],
  providers: [
    DashboardPersonalRepository,
    DashboardTeamRepository,
    DashboardService,
  ],
})
export class DashboardModule {}
