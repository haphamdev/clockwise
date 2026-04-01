import { Controller, Get, Post, Patch, Delete, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse, ApiCreatedResponse } from '@nestjs/swagger';
import { Auth, AdminOnly } from '../../common/decorators/auth.decorators';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserEntity } from '../users/entities/user.entity';
import { TeamsService } from './teams.service';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { AddTeamMemberDto } from './dto/add-team-member.dto';
import { UpdateTeamMemberDto } from './dto/update-team-member.dto';
import { ListTeamsQueryDto } from './dto/list-teams-query.dto';
import {
  TeamResponseDto,
  TeamDetailResponseDto,
  TeamListResponseDto,
  TeamMemberResponseDto,
} from './dto/team-response.dto';
import { TeamListItem } from './entities/team.entity';

@ApiTags('Teams')
@Controller('teams')
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Get()
  @Auth()
  @ApiOperation({ summary: 'List teams (admin sees all, others see own)' })
  @ApiOkResponse({ type: TeamListResponseDto })
  async list(
    @CurrentUser() user: UserEntity,
    @Query() query: ListTeamsQueryDto,
  ): Promise<TeamListResponseDto> {
    const { data, total } = await this.teamsService.findAll(
      user.orgId,
      user.id,
      user.isAdmin,
      {
        includeArchived: query.includeArchived ?? false,
        page: query.page ?? 1,
        limit: query.limit ?? 20,
      },
    );

    return {
      data: data.map((t) => this.toTeamResponse(t)),
      total,
      page: query.page ?? 1,
      limit: query.limit ?? 20,
    };
  }

  @Post()
  @AdminOnly()
  @ApiOperation({ summary: 'Create a team' })
  @ApiCreatedResponse({ type: TeamResponseDto })
  async create(
    @CurrentUser() user: UserEntity,
    @Body() dto: CreateTeamDto,
  ): Promise<TeamResponseDto> {
    const team = await this.teamsService.create(user.orgId, dto, user.id);
    return this.toTeamResponse({ ...team, memberCount: 0 });
  }

  @Get(':id')
  @Auth()
  @ApiOperation({ summary: 'Get team details with members' })
  @ApiOkResponse({ type: TeamDetailResponseDto })
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: UserEntity,
  ): Promise<TeamDetailResponseDto> {
    const team = await this.teamsService.findById(id, user.id, user.isAdmin);
    return {
      id: team.id,
      name: team.name,
      description: team.description,
      isArchived: team.isArchived,
      members: team.members.map((m) => this.toMemberResponse(m)),
      createdAt: team.createdAt,
      updatedAt: team.updatedAt,
    };
  }

  @Patch(':id')
  @AdminOnly()
  @ApiOperation({ summary: 'Update a team' })
  @ApiOkResponse({ type: TeamResponseDto })
  async update(
    @Param('id') id: string,
    @CurrentUser() user: UserEntity,
    @Body() dto: UpdateTeamDto,
  ): Promise<TeamResponseDto> {
    const team = await this.teamsService.update(id, user.orgId, dto, user.id);
    return this.toTeamResponse({ ...team, memberCount: 0 });
  }

  @Patch(':id/archive')
  @AdminOnly()
  @ApiOperation({ summary: 'Archive a team' })
  @ApiOkResponse({ type: TeamResponseDto })
  async archive(
    @Param('id') id: string,
    @CurrentUser() user: UserEntity,
  ): Promise<TeamResponseDto> {
    const team = await this.teamsService.archive(id, user.orgId, user.id);
    return this.toTeamResponse({ ...team, memberCount: 0 });
  }

  @Patch(':id/unarchive')
  @AdminOnly()
  @ApiOperation({ summary: 'Unarchive a team' })
  @ApiOkResponse({ type: TeamResponseDto })
  async unarchive(
    @Param('id') id: string,
    @CurrentUser() user: UserEntity,
  ): Promise<TeamResponseDto> {
    const team = await this.teamsService.unarchive(id, user.orgId, user.id);
    return this.toTeamResponse({ ...team, memberCount: 0 });
  }

  @Post(':id/members')
  @AdminOnly()
  @ApiOperation({ summary: 'Add a member to a team' })
  @ApiCreatedResponse({ type: TeamMemberResponseDto })
  async addMember(
    @Param('id') id: string,
    @CurrentUser() user: UserEntity,
    @Body() dto: AddTeamMemberDto,
  ): Promise<TeamMemberResponseDto> {
    const member = await this.teamsService.addMember(id, user.orgId, dto.userId, dto.role, user.id);
    return this.toMemberResponse(member);
  }

  @Patch(':id/members/:userId')
  @AdminOnly()
  @ApiOperation({ summary: 'Change a team member role' })
  @ApiOkResponse({ type: TeamMemberResponseDto })
  async updateMemberRole(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @CurrentUser() user: UserEntity,
    @Body() dto: UpdateTeamMemberDto,
  ): Promise<TeamMemberResponseDto> {
    const member = await this.teamsService.updateMemberRole(id, user.orgId, userId, dto.role, user.id);
    return this.toMemberResponse(member);
  }

  @Delete(':id/members/:userId')
  @AdminOnly()
  @ApiOperation({ summary: 'Remove a member from a team' })
  async removeMember(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @CurrentUser() user: UserEntity,
  ): Promise<{ message: string }> {
    await this.teamsService.removeMember(id, user.orgId, userId, user.id);
    return { message: 'Member removed' };
  }

  private toTeamResponse(team: TeamListItem): TeamResponseDto {
    return {
      id: team.id,
      name: team.name,
      description: team.description,
      isArchived: team.isArchived,
      memberCount: team.memberCount,
      createdAt: team.createdAt,
      updatedAt: team.updatedAt,
    };
  }

  private toMemberResponse(m: TeamMemberResponseDto): TeamMemberResponseDto {
    return {
      id: m.id,
      userId: m.userId,
      userName: m.userName,
      userEmail: m.userEmail,
      userStatus: m.userStatus,
      role: m.role,
      createdAt: m.createdAt,
    };
  }
}
