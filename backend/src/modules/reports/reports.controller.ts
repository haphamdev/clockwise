import { Controller, Get, Query } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Auth } from "../../common/decorators/auth.decorators";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { UserEntity } from "../users/entities/user.entity";
import {
  AnomaliesQueryDto,
  LoggingDelayHeatmapQueryDto,
  LoggingDelayQueryDto,
  SummaryQueryDto,
  TimeSeriesQueryDto,
  WeekdayDistributionQueryDto,
} from "./dto/reports-query.dto";
import {
  AnomaliesResponseDto,
  LoggingDelayHeatmapResponseDto,
  LoggingDelayResponseDto,
  SummaryResponseDto,
  TimeSeriesResponseDto,
  WeekdayDistributionResponseDto,
} from "./dto/reports-response.dto";
import { ReportsService } from "./reports.service";

@ApiTags("Reports")
@Controller("reports")
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get("time-series")
  @Auth()
  @ApiOperation({
    summary: "Time-series aggregation grouped by user/project/team",
    description:
      "Returns hours aggregated into time buckets (day/week/month/quarter) and grouped by a chosen dimension. " +
      "Supports an optional secondary groupBy (stackBy) for stacked breakdowns. " +
      "Use this to render trend charts showing how hours are distributed over time.",
  })
  @ApiOkResponse({ type: TimeSeriesResponseDto })
  async getTimeSeries(
    @CurrentUser() user: UserEntity,
    @Query() query: TimeSeriesQueryDto,
  ): Promise<TimeSeriesResponseDto> {
    return this.reportsService.getTimeSeries(
      user.orgId,
      user.id,
      user.isAdmin,
      query,
    );
  }

  @Get("weekday-distribution")
  @Auth()
  @ApiOperation({
    summary: "Hours distribution by weekday (Mon-Sun)",
    description:
      "Returns total hours per weekday (0=Mon through 6=Sun) for each group. " +
      "Use this to identify which days of the week teams or projects are most active.",
  })
  @ApiOkResponse({ type: WeekdayDistributionResponseDto })
  async getWeekdayDistribution(
    @CurrentUser() user: UserEntity,
    @Query() query: WeekdayDistributionQueryDto,
  ): Promise<WeekdayDistributionResponseDto> {
    return this.reportsService.getWeekdayDistribution(
      user.orgId,
      user.id,
      user.isAdmin,
      query,
    );
  }

  @Get("logging-delay")
  @Auth()
  @ApiOperation({
    summary: "Distribution of delay between work date and log creation",
    description:
      "Returns an aggregate bar-chart distribution of how quickly time entries are logged " +
      "(same day, 1-2 days, 3-5 days, 6+ days). Use this for an org-wide or team-wide overview of logging timeliness.",
  })
  @ApiOkResponse({ type: LoggingDelayResponseDto })
  async getLoggingDelay(
    @CurrentUser() user: UserEntity,
    @Query() query: LoggingDelayQueryDto,
  ): Promise<LoggingDelayResponseDto> {
    return this.reportsService.getLoggingDelay(
      user.orgId,
      user.id,
      user.isAdmin,
      query,
    );
  }

  @Get("summary")
  @Auth()
  @ApiOperation({
    summary: "Aggregate KPI summary for the selected filters",
    description:
      "Returns high-level KPIs: total hours, average hours per day, unique projects/users/teams, and entry count. " +
      "Use this to populate summary cards at the top of report dashboards.",
  })
  @ApiOkResponse({ type: SummaryResponseDto })
  async getSummary(
    @CurrentUser() user: UserEntity,
    @Query() query: SummaryQueryDto,
  ): Promise<SummaryResponseDto> {
    return this.reportsService.getSummary(
      user.orgId,
      user.id,
      user.isAdmin,
      query,
    );
  }

  @Get("anomalies")
  @Auth()
  @ApiOperation({
    summary: "Detect daily overtime anomalies",
    description:
      "Returns days where a team member logged an unusually high number of hours. " +
      "Each entry is classified as warning (>=10h) or critical (>=12h). " +
      "Use this to surface potential overwork patterns in team reports.",
  })
  @ApiOkResponse({ type: AnomaliesResponseDto })
  async getAnomalies(
    @CurrentUser() user: UserEntity,
    @Query() query: AnomaliesQueryDto,
  ): Promise<AnomaliesResponseDto> {
    return this.reportsService.getAnomalies(
      user.orgId,
      user.id,
      user.isAdmin,
      query,
    );
  }

  @Get("logging-delay-heatmap")
  @Auth()
  @ApiOperation({
    summary: "P75 logging delay heatmap by user and weekday",
    description:
      "Returns a User x Weekday grid where each cell contains the 75th percentile delay " +
      "(days between work date and log creation). Cells with fewer than 5 entries are excluded. " +
      "Use this to identify which team members tend to delay logging on specific days of the week.",
  })
  @ApiOkResponse({ type: LoggingDelayHeatmapResponseDto })
  async getLoggingDelayHeatmap(
    @CurrentUser() user: UserEntity,
    @Query() query: LoggingDelayHeatmapQueryDto,
  ): Promise<LoggingDelayHeatmapResponseDto> {
    return this.reportsService.getLoggingDelayHeatmap(
      user.orgId,
      user.id,
      user.isAdmin,
      query,
    );
  }
}
