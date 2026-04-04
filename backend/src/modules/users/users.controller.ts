import { Controller, Get, Patch, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse } from '@nestjs/swagger';
import { AdminOnly, Auth } from '../../common/decorators/auth.decorators';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserEntity, UserWithTeams } from './entities/user.entity';
import { UsersService } from './users.service';
import { ProjectsService } from '../projects/projects.service';
import { ListUsersQueryDto } from './dto/list-users-query.dto';
import { ListUserProjectsQueryDto } from './dto/list-user-projects-query.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto, UserListResponseDto } from './dto/user-response.dto';
import { ProjectListResponseDto } from '../projects/dto/project-response.dto';
import { ProjectListItem } from '../projects/entities/project.entity';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly projectsService: ProjectsService,
  ) {}

  @Get()
  @AdminOnly()
  @ApiOperation({ summary: 'List users (admin only)' })
  @ApiOkResponse({ type: UserListResponseDto })
  async list(
    @CurrentUser() user: UserEntity,
    @Query() query: ListUsersQueryDto,
  ): Promise<UserListResponseDto> {
    const { data, total } = await this.usersService.findAll(user.orgId, {
      page: query.page ?? 1,
      limit: query.limit ?? 20,
      search: query.search,
      status: query.status,
      teamId: query.teamId,
    });

    return {
      data: data.map((u) => this.toResponse(u)),
      total,
      page: query.page ?? 1,
      limit: query.limit ?? 20,
    };
  }

  // Must be declared before @Get(':id') to avoid 'me' matching as a route param
  @Get('me')
  @Auth()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiOkResponse({ type: UserResponseDto })
  async getMyProfile(@CurrentUser() user: UserEntity): Promise<UserResponseDto> {
    const profile = await this.usersService.getUserDetail(user.id, user.orgId);
    return this.toResponse(profile);
  }

  @Get(':id')
  @AdminOnly()
  @ApiOperation({ summary: 'Get user detail (admin only)' })
  @ApiOkResponse({ type: UserResponseDto })
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: UserEntity,
  ): Promise<UserResponseDto> {
    const target = await this.usersService.getUserDetail(id, user.orgId);
    return this.toResponse(target);
  }

  @Get(':id/projects')
  @AdminOnly()
  @ApiOperation({ summary: 'List projects for a user (admin only)' })
  @ApiOkResponse({ type: ProjectListResponseDto })
  async listUserProjects(
    @Param('id') id: string,
    @CurrentUser() user: UserEntity,
    @Query() query: ListUserProjectsQueryDto,
  ): Promise<ProjectListResponseDto> {
    await this.usersService.getUserDetail(id, user.orgId);

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const { data, total } = await this.projectsService.findProjectsForUser(
      user.orgId,
      id,
      {
        includeArchived: query.includeArchived ?? false,
        page,
        limit,
      },
    );

    return {
      data: data.map((p) => this.toProjectResponse(p)),
      total,
      page,
      limit,
    };
  }

  @Patch(':id')
  @AdminOnly()
  @ApiOperation({ summary: 'Update user (admin status, team assignments)' })
  @ApiOkResponse({ type: UserResponseDto })
  async update(
    @Param('id') id: string,
    @CurrentUser() user: UserEntity,
    @Body() dto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    const updated = await this.usersService.updateUser(user.id, id, user.orgId, dto);
    return this.toResponse(updated);
  }

  @Patch(':id/deactivate')
  @AdminOnly()
  @ApiOperation({ summary: 'Deactivate a user' })
  async deactivate(
    @Param('id') id: string,
    @CurrentUser() user: UserEntity,
  ): Promise<{ message: string }> {
    await this.usersService.deactivateUser(user.id, id, user.orgId);
    return { message: 'User deactivated' };
  }

  @Patch(':id/reactivate')
  @AdminOnly()
  @ApiOperation({ summary: 'Reactivate a user' })
  async reactivate(
    @Param('id') id: string,
    @CurrentUser() user: UserEntity,
  ): Promise<{ message: string }> {
    await this.usersService.reactivateUser(id, user.orgId, user.id);
    return { message: 'User reactivated' };
  }

  private toProjectResponse(project: ProjectListItem): ProjectListResponseDto['data'][number] {
    return {
      id: project.id,
      name: project.name,
      description: project.description,
      status: project.status,
      teamCount: project.teamCount,
      teamIds: project.teamIds,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    };
  }

  private toResponse(user: UserWithTeams): UserResponseDto {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      isAdmin: user.isAdmin,
      status: user.status,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      teamMemberships: user.teamMemberships.map((tm) => ({
        teamId: tm.teamId,
        teamName: tm.teamName,
        role: tm.role,
        isArchived: tm.isArchived,
      })),
    };
  }
}
