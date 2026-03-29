import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { TeamsRepository } from './teams.repository';
import { TeamEntity, TeamListItem, TeamWithMembers, TeamMemberEntity } from './entities/team.entity';
import {
  TeamNotFoundException,
  TeamArchivedException,
  TeamLastManagerException,
  TeamMemberAlreadyExistsException,
  TeamMemberNotFoundException,
  TeamUserNotFoundException,
  TeamNotAMemberException,
} from '../../common/exceptions/team.exceptions';

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
      throw new TeamNotFoundException();
    }

    if (!isAdmin) {
      const isMember = team.members.some((m) => m.userId === userId);
      if (!isMember) {
        throw new TeamNotAMemberException();
      }
    }

    return team;
  }

  async create(orgId: string, data: { name: string; description?: string }): Promise<TeamEntity> {
    return this.teamsRepository.create({ orgId, ...data });
  }

  async update(
    teamId: string,
    orgId: string,
    data: { name?: string; description?: string },
  ): Promise<TeamEntity> {
    const team = await this.getTeamOrThrow(teamId, orgId);
    this.ensureNotArchived(team);
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
      throw new TeamUserNotFoundException();
    }

    const existing = await this.teamsRepository.findMember(teamId, userId);
    if (existing) {
      throw new TeamMemberAlreadyExistsException();
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
      throw new TeamMemberNotFoundException();
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
      throw new TeamMemberNotFoundException();
    }

    if (member.role === 'manager') {
      await this.ensureNotLastManager(teamId);
    }

    await this.teamsRepository.removeMember(teamId, userId);
  }

  /**
   * Lightweight check that a team exists, belongs to the org, and is not archived.
   * Used by InvitationsService to validate team assignments without loading members.
   */
  async validateTeamExists(teamId: string, orgId: string): Promise<void> {
    const team = await this.teamsRepository.findEntityById(teamId);
    if (!team || team.orgId !== orgId) {
      throw new TeamNotFoundException();
    }
    this.ensureNotArchived(team);
  }

  private async getTeamOrThrow(teamId: string, orgId: string): Promise<TeamEntity> {
    const team = await this.teamsRepository.findEntityById(teamId);
    if (!team || team.orgId !== orgId) {
      throw new TeamNotFoundException();
    }
    return team;
  }

  private ensureNotArchived(team: TeamEntity): void {
    if (team.isArchived) {
      throw new TeamArchivedException();
    }
  }

  private async ensureNotLastManager(teamId: string): Promise<void> {
    const managerCount = await this.teamsRepository.countManagers(teamId);
    if (managerCount <= 1) {
      throw new TeamLastManagerException();
    }
  }
}
