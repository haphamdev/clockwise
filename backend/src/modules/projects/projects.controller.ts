import { Controller, Get, Post, Patch, Delete, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse, ApiCreatedResponse } from '@nestjs/swagger';
import { Auth, AdminOnly } from '../../common/decorators/auth.decorators';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserEntity } from '../users/entities/user.entity';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ListProjectsQueryDto } from './dto/list-projects-query.dto';
import { AssignTeamDto } from './dto/assign-team.dto';
import {
  ProjectResponseDto,
  ProjectDetailResponseDto,
  ProjectListResponseDto,
  ProjectTeamResponseDto,
} from './dto/project-response.dto';
import { ProjectSettingsResponseDto } from './dto/project-settings-response.dto';
import { UpdateProjectSettingsDto } from './dto/update-project-settings.dto';
import { ProjectListItem, ProjectWithTeams, ProjectTeamEntity } from './entities/project.entity';

@ApiTags('Projects')
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  @Auth()
  @ApiOperation({ summary: 'List projects (admin sees all, others see own)' })
  @ApiOkResponse({ type: ProjectListResponseDto })
  async list(
    @CurrentUser() user: UserEntity,
    @Query() query: ListProjectsQueryDto,
  ): Promise<ProjectListResponseDto> {
    const { data, total } = await this.projectsService.findAll(
      user.orgId,
      user.id,
      user.isAdmin,
      {
        includeArchived: query.includeArchived ?? false,
        page: query.page ?? 1,
        limit: query.limit ?? 20,
        teamId: query.teamId,
      },
    );

    return {
      data: data.map((p) => this.toProjectResponse(p)),
      total,
      page: query.page ?? 1,
      limit: query.limit ?? 20,
    };
  }

  @Post()
  @Auth()
  @ApiOperation({ summary: 'Create a project' })
  @ApiCreatedResponse({ type: ProjectDetailResponseDto })
  async create(
    @CurrentUser() user: UserEntity,
    @Body() dto: CreateProjectDto,
  ): Promise<ProjectDetailResponseDto> {
    const project = await this.projectsService.create(
      user.orgId,
      dto,
      user.id,
      user.isAdmin,
    );
    return this.toDetailResponse(project);
  }

  @Get(':id')
  @Auth()
  @ApiOperation({ summary: 'Get project details with teams' })
  @ApiOkResponse({ type: ProjectDetailResponseDto })
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: UserEntity,
  ): Promise<ProjectDetailResponseDto> {
    const project = await this.projectsService.findById(id, user.orgId, user.id, user.isAdmin);
    return this.toDetailResponse(project);
  }

  @Patch(':id')
  @Auth()
  @ApiOperation({ summary: 'Update a project' })
  @ApiOkResponse({ type: ProjectResponseDto })
  async update(
    @Param('id') id: string,
    @CurrentUser() user: UserEntity,
    @Body() dto: UpdateProjectDto,
  ): Promise<ProjectResponseDto> {
    const project = await this.projectsService.update(
      id,
      user.orgId,
      dto,
      user.id,
      user.isAdmin,
    );
    return this.toProjectResponse(project);
  }

  @Patch(':id/archive')
  @AdminOnly()
  @ApiOperation({ summary: 'Archive a project' })
  @ApiOkResponse({ type: ProjectResponseDto })
  async archive(
    @Param('id') id: string,
    @CurrentUser() user: UserEntity,
  ): Promise<ProjectResponseDto> {
    const project = await this.projectsService.archive(id, user.orgId, user.id);
    return this.toProjectResponse(project);
  }

  @Patch(':id/unarchive')
  @AdminOnly()
  @ApiOperation({ summary: 'Unarchive a project' })
  @ApiOkResponse({ type: ProjectResponseDto })
  async unarchive(
    @Param('id') id: string,
    @CurrentUser() user: UserEntity,
  ): Promise<ProjectResponseDto> {
    const project = await this.projectsService.unarchive(id, user.orgId, user.id);
    return this.toProjectResponse(project);
  }

  @Get(':id/settings')
  @Auth()
  @ApiOperation({ summary: 'Get project settings' })
  @ApiOkResponse({ type: ProjectSettingsResponseDto })
  async getSettings(
    @Param('id') id: string,
    @CurrentUser() user: UserEntity,
  ): Promise<ProjectSettingsResponseDto> {
    return this.projectsService.getSettings(id, user.orgId, user.id, user.isAdmin);
  }

  @Patch(':id/settings')
  @Auth()
  @ApiOperation({ summary: 'Update project settings' })
  @ApiOkResponse({ type: ProjectSettingsResponseDto })
  async updateSettings(
    @Param('id') id: string,
    @CurrentUser() user: UserEntity,
    @Body() dto: UpdateProjectSettingsDto,
  ): Promise<ProjectSettingsResponseDto> {
    return this.projectsService.updateSettings(
      id,
      user.orgId,
      dto,
      user.id,
      user.isAdmin,
    );
  }

  @Post(':id/teams')
  @Auth()
  @ApiOperation({ summary: 'Assign a team to a project' })
  @ApiCreatedResponse({ type: ProjectTeamResponseDto })
  async assignTeam(
    @Param('id') id: string,
    @CurrentUser() user: UserEntity,
    @Body() dto: AssignTeamDto,
  ): Promise<ProjectTeamResponseDto> {
    const projectTeam = await this.projectsService.assignTeam(
      id,
      user.orgId,
      dto.teamId,
      user.id,
      user.isAdmin,
    );
    return this.toTeamResponse(projectTeam);
  }

  @Delete(':id/teams/:teamId')
  @Auth()
  @ApiOperation({ summary: 'Remove a team from a project' })
  async removeTeam(
    @Param('id') id: string,
    @Param('teamId') teamId: string,
    @CurrentUser() user: UserEntity,
  ): Promise<{ message: string }> {
    await this.projectsService.removeTeam(id, user.orgId, teamId, user.id, user.isAdmin);
    return { message: 'Team removed from project' };
  }

  private toProjectResponse(project: ProjectListItem): ProjectResponseDto {
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

  private toDetailResponse(project: ProjectWithTeams): ProjectDetailResponseDto {
    return {
      id: project.id,
      name: project.name,
      description: project.description,
      status: project.status,
      teams: project.teams.map((t) => this.toTeamResponse(t)),
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    };
  }

  private toTeamResponse(t: ProjectTeamEntity): ProjectTeamResponseDto {
    return {
      id: t.id,
      teamId: t.teamId,
      teamName: t.teamName,
      memberCount: t.memberCount,
      isArchived: t.isArchived,
      createdAt: t.createdAt,
    };
  }
}
