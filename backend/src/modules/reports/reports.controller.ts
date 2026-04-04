import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse } from '@nestjs/swagger';
import { Auth } from '../../common/decorators/auth.decorators';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserEntity } from '../users/entities/user.entity';
import { ReportsService } from './reports.service';
import {
  TimeSeriesQueryDto,
  WeekdayDistributionQueryDto,
  LoggingDelayQueryDto,
  SummaryQueryDto,
} from './dto/reports-query.dto';
import {
  TimeSeriesResponseDto,
  WeekdayDistributionResponseDto,
  LoggingDelayResponseDto,
  SummaryResponseDto,
} from './dto/reports-response.dto';

@ApiTags('Reports')
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('time-series')
  @Auth()
  @ApiOperation({ summary: 'Time-series aggregation grouped by user/project/team' })
  @ApiOkResponse({ type: TimeSeriesResponseDto })
  async getTimeSeries(
    @CurrentUser() user: UserEntity,
    @Query() query: TimeSeriesQueryDto,
  ): Promise<TimeSeriesResponseDto> {
    return this.reportsService.getTimeSeries(user.orgId, user.id, user.isAdmin, query);
  }

  @Get('weekday-distribution')
  @Auth()
  @ApiOperation({ summary: 'Hours distribution by weekday (Mon-Sun)' })
  @ApiOkResponse({ type: WeekdayDistributionResponseDto })
  async getWeekdayDistribution(
    @CurrentUser() user: UserEntity,
    @Query() query: WeekdayDistributionQueryDto,
  ): Promise<WeekdayDistributionResponseDto> {
    return this.reportsService.getWeekdayDistribution(user.orgId, user.id, user.isAdmin, query);
  }

  @Get('logging-delay')
  @Auth()
  @ApiOperation({ summary: 'Distribution of delay between work date and log creation' })
  @ApiOkResponse({ type: LoggingDelayResponseDto })
  async getLoggingDelay(
    @CurrentUser() user: UserEntity,
    @Query() query: LoggingDelayQueryDto,
  ): Promise<LoggingDelayResponseDto> {
    return this.reportsService.getLoggingDelay(user.orgId, user.id, user.isAdmin, query);
  }

  @Get('summary')
  @Auth()
  @ApiOperation({ summary: 'Aggregate KPI summary for the selected filters' })
  @ApiOkResponse({ type: SummaryResponseDto })
  async getSummary(
    @CurrentUser() user: UserEntity,
    @Query() query: SummaryQueryDto,
  ): Promise<SummaryResponseDto> {
    return this.reportsService.getSummary(user.orgId, user.id, user.isAdmin, query);
  }
}
