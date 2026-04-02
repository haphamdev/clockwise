import { Controller, Get, Post, Patch, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse, ApiCreatedResponse } from '@nestjs/swagger';
import { Auth } from '../../common/decorators/auth.decorators';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserEntity } from '../users/entities/user.entity';
import { TimeLogsService } from './time-logs.service';
import { CreateTimeLogDto } from './dto/create-time-log.dto';
import { UpdateTimeLogDto } from './dto/update-time-log.dto';
import { ArchiveTimeLogDto, UnarchiveTimeLogDto } from './dto/archive-time-log.dto';
import { ListTimeLogsQueryDto } from './dto/list-time-logs-query.dto';
import {
  TimeLogResponseDto,
  TimeLogCreateResponseDto,
  TimeLogUpdateResponseDto,
  TimeLogListResponseDto,
} from './dto/time-log-response.dto';
import { TimeLogListItem } from './entities/time-log.entity';

@ApiTags('Time Logs')
@Controller('time-logs')
export class TimeLogsController {
  constructor(private readonly timeLogsService: TimeLogsService) {}

  @Post()
  @Auth()
  @ApiOperation({ summary: 'Create a time log' })
  @ApiCreatedResponse({ type: TimeLogCreateResponseDto })
  async create(
    @CurrentUser() user: UserEntity,
    @Body() dto: CreateTimeLogDto,
  ): Promise<TimeLogCreateResponseDto> {
    const { timeLog, warnings } = await this.timeLogsService.create(
      user.id,
      user.orgId,
      user.isAdmin,
      dto,
    );
    return { ...this.toResponse(timeLog), warnings };
  }

  @Get()
  @Auth()
  @ApiOperation({ summary: 'List time logs (paginated, filtered, role-scoped)' })
  @ApiOkResponse({ type: TimeLogListResponseDto })
  async list(
    @CurrentUser() user: UserEntity,
    @Query() query: ListTimeLogsQueryDto,
  ): Promise<TimeLogListResponseDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const { data, total, totalHours } = await this.timeLogsService.findAll(
      user.orgId,
      user.id,
      user.isAdmin,
      {
        page,
        limit,
        dateFrom: query.dateFrom,
        dateTo: query.dateTo,
        projectId: query.projectId,
        userId: query.userId,
        teamId: query.teamId,
      },
    );

    return {
      data: data.map((tl) => this.toResponse(tl)),
      total,
      page,
      limit,
      totalHours,
    };
  }

  @Get(':id')
  @Auth()
  @ApiOperation({ summary: 'Get time log detail' })
  @ApiOkResponse({ type: TimeLogResponseDto })
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: UserEntity,
  ): Promise<TimeLogResponseDto> {
    const timeLog = await this.timeLogsService.findById(
      id,
      user.orgId,
      user.id,
      user.isAdmin,
    );
    return this.toResponse(timeLog);
  }

  @Patch(':id')
  @Auth()
  @ApiOperation({ summary: 'Update a time log (reason required)' })
  @ApiOkResponse({ type: TimeLogUpdateResponseDto })
  async update(
    @Param('id') id: string,
    @CurrentUser() user: UserEntity,
    @Body() dto: UpdateTimeLogDto,
  ): Promise<TimeLogUpdateResponseDto> {
    const { timeLog, warnings } = await this.timeLogsService.update(
      id,
      user.orgId,
      user.id,
      user.isAdmin,
      dto,
    );
    return { ...this.toResponse(timeLog), warnings };
  }

  @Patch(':id/archive')
  @Auth()
  @ApiOperation({ summary: 'Archive a time log (reason required)' })
  async archive(
    @Param('id') id: string,
    @CurrentUser() user: UserEntity,
    @Body() dto: ArchiveTimeLogDto,
  ): Promise<{ message: string }> {
    await this.timeLogsService.archive(id, user.orgId, user.id, user.isAdmin, dto);
    return { message: 'Time log archived' };
  }

  @Patch(':id/unarchive')
  @Auth()
  @ApiOperation({ summary: 'Unarchive a time log (reason required)' })
  async unarchive(
    @Param('id') id: string,
    @CurrentUser() user: UserEntity,
    @Body() dto: UnarchiveTimeLogDto,
  ): Promise<{ message: string }> {
    await this.timeLogsService.unarchive(id, user.orgId, user.id, user.isAdmin, dto);
    return { message: 'Time log unarchived' };
  }

  private toResponse(timeLog: TimeLogListItem): TimeLogResponseDto {
    return {
      id: timeLog.id,
      user: timeLog.user,
      project: timeLog.project,
      tasks: timeLog.tasks,
      date: timeLog.date,
      hours: timeLog.hours,
      notes: timeLog.notes,
      status: timeLog.status,
      createdAt: timeLog.createdAt,
      updatedAt: timeLog.updatedAt,
    };
  }
}
