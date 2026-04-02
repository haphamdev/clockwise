import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse } from '@nestjs/swagger';
import { Auth } from '../../common/decorators/auth.decorators';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserEntity } from '../users/entities/user.entity';
import { TasksService } from './tasks.service';
import { ListTasksQueryDto } from './dto/list-tasks-query.dto';
import { TaskResponseDto, TaskListResponseDto } from './dto/task-response.dto';

@ApiTags('Tasks')
@Controller('projects/:projectId/tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  @Auth()
  @ApiOperation({ summary: 'Search tasks within a project' })
  @ApiOkResponse({ type: TaskListResponseDto })
  async list(
    @Param('projectId') projectId: string,
    @CurrentUser() user: UserEntity,
    @Query() query: ListTasksQueryDto,
  ): Promise<TaskListResponseDto> {
    const { data, total } = await this.tasksService.search(
      projectId,
      user.orgId,
      user.id,
      user.isAdmin,
      { q: query.q, page: query.page ?? 1, limit: query.limit ?? 10 },
    );

    return {
      data: data.map((t) => this.toResponse(t)),
      total,
      page: query.page ?? 1,
      limit: query.limit ?? 10,
    };
  }

  private toResponse(task: {
    id: string;
    projectId: string;
    label: string;
    description: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): TaskResponseDto {
    return {
      id: task.id,
      projectId: task.projectId,
      label: task.label,
      description: task.description,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
    };
  }
}
