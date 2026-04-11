import { Controller, Get } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { AdminOnly, Auth } from "../../common/decorators/auth.decorators";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { UserEntity } from "../users/entities/user.entity";
import { DashboardService } from "./dashboard.service";
import { MySummaryResponseDto } from "./dto/my-summary-response.dto";
import { OrgOverviewResponseDto } from "./dto/org-overview-response.dto";
import { TeamBreakdownResponseDto } from "./dto/team-breakdown-response.dto";

@ApiTags("Dashboard")
@Controller("dashboard")
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get("my-summary")
  @Auth()
  @ApiOperation({
    summary: "Personal dashboard summary: hours, gaps, recent logs",
  })
  @ApiOkResponse({ type: MySummaryResponseDto })
  async getMySummary(
    @CurrentUser() user: UserEntity,
  ): Promise<MySummaryResponseDto> {
    return this.dashboardService.getMySummary(user.id, user.orgId);
  }

  @Get("team-breakdown")
  @Auth()
  @ApiOperation({
    summary: "Team breakdown for managers/admins. Empty for plain members.",
  })
  @ApiOkResponse({ type: TeamBreakdownResponseDto })
  async getTeamBreakdown(
    @CurrentUser() user: UserEntity,
  ): Promise<TeamBreakdownResponseDto> {
    return this.dashboardService.getTeamBreakdown(
      user.id,
      user.orgId,
      user.isAdmin,
    );
  }

  @Get("org-overview")
  @AdminOnly()
  @ApiOperation({ summary: "Organization overview: user/team/project counts" })
  @ApiOkResponse({ type: OrgOverviewResponseDto })
  async getOrgOverview(
    @CurrentUser() user: UserEntity,
  ): Promise<OrgOverviewResponseDto> {
    return this.dashboardService.getOrgOverview(user.orgId);
  }
}
