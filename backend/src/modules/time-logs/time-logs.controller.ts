import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";
import { Auth } from "../../common/decorators/auth.decorators";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { TimeLogCannotLogOnBehalfException } from "../../common/exceptions/time-log.exceptions";
import { UserEntity } from "../users/entities/user.entity";
import {
  ArchiveTimeLogDto,
  UnarchiveTimeLogDto,
} from "./dto/archive-time-log.dto";
import { CreateTimeLogDto } from "./dto/create-time-log.dto";
import { ListTimeLogsQueryDto } from "./dto/list-time-logs-query.dto";
import { LoggableUserDto } from "./dto/loggable-user.dto";
import {
  TimeLogCreateResponseDto,
  TimeLogListResponseDto,
  TimeLogResponseDto,
  TimeLogUpdateResponseDto,
  WarningDto,
} from "./dto/time-log-response.dto";
import { UpdateTimeLogDto } from "./dto/update-time-log.dto";
import { WarningsQueryDto } from "./dto/warnings-query.dto";
import { TimeLogListItem } from "./entities/time-log.entity";
import { TimeLogsService } from "./time-logs.service";

@ApiTags("Time Logs")
@Controller("time-logs")
export class TimeLogsController {
  constructor(private readonly timeLogsService: TimeLogsService) {}

  @Post()
  @Auth()
  @ApiOperation({ summary: "Create a time log" })
  @ApiCreatedResponse({ type: TimeLogCreateResponseDto })
  async create(
    @CurrentUser() user: UserEntity,
    @Body() dto: CreateTimeLogDto,
  ): Promise<TimeLogCreateResponseDto> {
    const targetUserId = dto.userId ?? user.id;
    const isOnBehalf = targetUserId !== user.id;

    if (isOnBehalf) {
      await this.assertCanLogOnBehalf(user, targetUserId);
    }

    const { timeLog, warnings } = await this.timeLogsService.create(
      targetUserId,
      user.orgId,
      isOnBehalf ? false : user.isAdmin,
      dto,
      isOnBehalf ? user.id : undefined,
    );
    return { ...this.toResponse(timeLog), warnings };
  }

  @Get()
  @Auth()
  @ApiOperation({
    summary: "List time logs (paginated, filtered, role-scoped)",
  })
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
        projectIds: query.projectIds,
        userIds: query.userIds,
        teamIds: query.teamIds,
        includeArchived: query.includeArchived,
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

  @Get("warnings")
  @Auth()
  @ApiOperation({ summary: "Preview warnings for a date (before submitting)" })
  @ApiOkResponse({ type: [WarningDto] })
  async warnings(
    @CurrentUser() user: UserEntity,
    @Query() query: WarningsQueryDto,
  ): Promise<WarningDto[]> {
    const targetUserId = query.userId ?? user.id;

    if (targetUserId !== user.id) {
      await this.assertCanLogOnBehalf(user, targetUserId);
    }

    return this.timeLogsService.computeWarnings(
      targetUserId,
      new Date(query.date),
      user.orgId,
      query.projectId,
      query.hours ?? 0,
    );
  }

  @Get("loggable-users")
  @Auth()
  @ApiOperation({ summary: "List users the caller can log time for" })
  @ApiOkResponse({ type: [LoggableUserDto] })
  async loggableUsers(
    @CurrentUser() user: UserEntity,
  ): Promise<LoggableUserDto[]> {
    return this.timeLogsService.getLoggableUsers(
      user.id,
      user.orgId,
      user.isAdmin,
    );
  }

  @Get(":id")
  @Auth()
  @ApiOperation({ summary: "Get time log detail" })
  @ApiOkResponse({ type: TimeLogResponseDto })
  async findOne(
    @Param("id") id: string,
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

  @Patch(":id")
  @Auth()
  @ApiOperation({ summary: "Update a time log (reason required)" })
  @ApiOkResponse({ type: TimeLogUpdateResponseDto })
  async update(
    @Param("id") id: string,
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

  @Patch(":id/archive")
  @Auth()
  @ApiOperation({ summary: "Archive a time log (reason required)" })
  async archive(
    @Param("id") id: string,
    @CurrentUser() user: UserEntity,
    @Body() dto: ArchiveTimeLogDto,
  ): Promise<{ message: string }> {
    await this.timeLogsService.archive(
      id,
      user.orgId,
      user.id,
      user.isAdmin,
      dto,
    );
    return { message: "Time log archived" };
  }

  @Patch(":id/unarchive")
  @Auth()
  @ApiOperation({ summary: "Unarchive a time log (reason required)" })
  async unarchive(
    @Param("id") id: string,
    @CurrentUser() user: UserEntity,
    @Body() dto: UnarchiveTimeLogDto,
  ): Promise<{ message: string }> {
    await this.timeLogsService.unarchive(
      id,
      user.orgId,
      user.id,
      user.isAdmin,
      dto,
    );
    return { message: "Time log unarchived" };
  }

  private async assertCanLogOnBehalf(
    caller: UserEntity,
    targetUserId: string,
  ): Promise<void> {
    const allowed = await this.timeLogsService.canLogOnBehalf(
      caller.id,
      caller.isAdmin,
      targetUserId,
      caller.orgId,
    );
    if (!allowed) {
      throw new TimeLogCannotLogOnBehalfException();
    }
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
