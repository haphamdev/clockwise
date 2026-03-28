import { Injectable, HttpStatus } from '@nestjs/common';
import { AppException } from '../../common/exceptions/app.exception';
import { ErrorCode } from '../../common/exceptions/error-codes';
import { UsersService } from '../users/users.service';
import { TeamsRepository } from './teams.repository';
import { TeamEntity, TeamListItem, TeamWithMembers, TeamMemberEntity } from './entities/team.entity';

@Injectable()
export class TeamsService {
  constructor(
    private readonly teamsRepository: TeamsRepository,
    private readonly usersService: UsersService,
  ) {}

  async findAll(
    orgId: string,
    userId: string,
    isAdmin: boolean,
    options: { includeArchived: boolean; page: number; limit: number },
  ): Promise<{ data: TeamListItem[]; total: number }> {
    if (isAdmin) {
      return this.teamsRepository.findAll(orgId, options);
    }
    return this.teamsRepository.findAllForUser(orgId, userId, {
      page: options.page,
      limit: options.limit,
    });
  }

  async findById(
    teamId: string,
    userId: string,
    isAdmin: boolean,
  ): Promise<TeamWithMembers> {
    const team = await this.teamsRepository.findById(teamId);
    if (!team) {
      throw new AppException(ErrorCode.TEAM.NOT_FOUND, 'Team not found', HttpStatus.NOT_FOUND);
    }

    if (!isAdmin) {
      const isMember = team.members.some((m) => m.userId === userId);
      if (!isMember) {
        throw new AppException(
          ErrorCode.TEAM.NOT_A_MEMBER,
          'You are not a member of this team',
          HttpStatus.FORBIDDEN,
        );
      }
    }

    return team;
  }

  async create(orgId: string, data: { name: string; description?: string }): Promise<TeamEntity> {
    const existing = await this.teamsRepository.findByName(orgId, data.name);
    if (existing) {
      throw new AppException(
        ErrorCode.TEAM.ALREADY_EXISTS,
        `A team named "${data.name}" already exists`,
        HttpStatus.CONFLICT,
      );
    }

    return this.teamsRepository.create({ orgId, ...data });
  }

  async update(
    teamId: string,
    orgId: string,
    data: { name?: string; description?: string },
  ): Promise<TeamEntity> {
    const team = await this.getTeamOrThrow(teamId, orgId);
    this.ensureNotArchived(team);

    if (data.name && data.name !== team.name) {
      const existing = await this.teamsRepository.findByName(orgId, data.name);
      if (existing) {
        throw new AppException(
          ErrorCode.TEAM.ALREADY_EXISTS,
          `A team named "${data.name}" already exists`,
          HttpStatus.CONFLICT,
        );
      }
    }

    return this.teamsRepository.update(teamId, data);
  }

  async archive(teamId: string, orgId: string): Promise<TeamEntity> {
    const team = await this.getTeamOrThrow(teamId, orgId);
    this.ensureNotArchived(team);
    return this.teamsRepository.archive(teamId);
  }

  async addMember(
    teamId: string,
    orgId: string,
    userId: string,
    role: 'manager' | 'member',
  ): Promise<TeamMemberEntity> {
    const team = await this.getTeamOrThrow(teamId, orgId);
    this.ensureNotArchived(team);

    const user = await this.usersService.findById(userId);
    if (!user || user.orgId !== orgId || user.status !== 'active') {
      throw new AppException(
        ErrorCode.TEAM.USER_NOT_FOUND,
        'User not found or not active in this organization',
        HttpStatus.BAD_REQUEST,
      );
    }

    const existing = await this.teamsRepository.findMember(teamId, userId);
    if (existing) {
      throw new AppException(
        ErrorCode.TEAM.MEMBER_ALREADY_EXISTS,
        'User is already a member of this team',
        HttpStatus.CONFLICT,
      );
    }

    return this.teamsRepository.addMember(teamId, userId, role);
  }

  async updateMemberRole(
    teamId: string,
    orgId: string,
    userId: string,
    role: 'manager' | 'member',
  ): Promise<TeamMemberEntity> {
    const team = await this.getTeamOrThrow(teamId, orgId);
    this.ensureNotArchived(team);

    const member = await this.teamsRepository.findMember(teamId, userId);
    if (!member) {
      throw new AppException(
        ErrorCode.TEAM.MEMBER_NOT_FOUND,
        'User is not a member of this team',
        HttpStatus.NOT_FOUND,
      );
    }

    if (member.role === 'manager' && role === 'member') {
      await this.ensureNotLastManager(teamId);
    }

    return this.teamsRepository.updateMemberRole(teamId, userId, role);
  }

  async removeMember(teamId: string, orgId: string, userId: string): Promise<void> {
    const team = await this.getTeamOrThrow(teamId, orgId);
    this.ensureNotArchived(team);

    const member = await this.teamsRepository.findMember(teamId, userId);
    if (!member) {
      throw new AppException(
        ErrorCode.TEAM.MEMBER_NOT_FOUND,
        'User is not a member of this team',
        HttpStatus.NOT_FOUND,
      );
    }

    if (member.role === 'manager') {
      await this.ensureNotLastManager(teamId);
    }

    await this.teamsRepository.removeMember(teamId, userId);
  }

  private async getTeamOrThrow(teamId: string, orgId: string): Promise<TeamEntity> {
    const team = await this.teamsRepository.findEntityById(teamId);
    if (!team || team.orgId !== orgId) {
      throw new AppException(ErrorCode.TEAM.NOT_FOUND, 'Team not found', HttpStatus.NOT_FOUND);
    }
    return team;
  }

  private ensureNotArchived(team: TeamEntity): void {
    if (team.isArchived) {
      throw new AppException(
        ErrorCode.TEAM.ARCHIVED,
        'Cannot modify an archived team',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  private async ensureNotLastManager(teamId: string): Promise<void> {
    const managerCount = await this.teamsRepository.countManagers(teamId);
    if (managerCount <= 1) {
      throw new AppException(
        ErrorCode.TEAM.LAST_MANAGER,
        'Team must have at least one manager',
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
