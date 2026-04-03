import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { TeamsRepository } from './teams.repository';
import { AuditLogService } from '../audit-log/audit-log.service';
import { TeamEntity, TeamListItem, TeamWithMembers, TeamMemberEntity } from './entities/team.entity';
import {
  TeamNotFoundException,
  TeamArchivedException,
  TeamNotArchivedException,
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
    private readonly auditLogService: AuditLogService,
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

  async create(
    orgId: string,
    data: { name: string; description?: string },
    performedBy: string,
  ): Promise<TeamEntity> {
    const team = await this.teamsRepository.create({ orgId, ...data });
    await this.auditLogService.log({
      orgId,
      entityType: 'team',
      entityId: team.id,
      action: 'created',
      performedBy,
      metadata: { after: { name: team.name, description: team.description } },
    });
    return team;
  }

  async update(
    teamId: string,
    orgId: string,
    data: { name?: string; description?: string },
    performedBy: string,
  ): Promise<TeamEntity> {
    const team = await this.getTeamOrThrow(teamId, orgId);
    this.ensureNotArchived(team);
    const updated = await this.teamsRepository.update(teamId, data);

    const before: Record<string, unknown> = {};
    const after: Record<string, unknown> = {};
    if (data.name !== undefined && data.name !== team.name) {
      before.name = team.name;
      after.name = data.name;
    }
    if (data.description !== undefined && data.description !== team.description) {
      before.description = team.description;
      after.description = data.description;
    }
    if (Object.keys(after).length > 0) {
      await this.auditLogService.log({
        orgId,
        entityType: 'team',
        entityId: teamId,
        action: 'updated',
        performedBy,
        metadata: { before, after },
      });
    }

    return updated;
  }

  async archive(teamId: string, orgId: string, performedBy: string): Promise<TeamEntity> {
    const team = await this.getTeamOrThrow(teamId, orgId);
    this.ensureNotArchived(team);
    const updated = await this.teamsRepository.archive(teamId);
    await this.auditLogService.log({
      orgId,
      entityType: 'team',
      entityId: teamId,
      action: 'archived',
      performedBy,
      metadata: { before: { isArchived: false }, after: { isArchived: true } },
    });
    return updated;
  }

  async unarchive(teamId: string, orgId: string, performedBy: string): Promise<TeamEntity> {
    const team = await this.getTeamOrThrow(teamId, orgId);
    this.ensureArchived(team);
    const updated = await this.teamsRepository.unarchive(teamId);
    await this.auditLogService.log({
      orgId,
      entityType: 'team',
      entityId: teamId,
      action: 'unarchived',
      performedBy,
      metadata: { before: { isArchived: true }, after: { isArchived: false } },
    });
    return updated;
  }

  async addMember(
    teamId: string,
    orgId: string,
    userId: string,
    role: 'manager' | 'member',
    performedBy: string,
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

    const member = await this.teamsRepository.addMember(teamId, userId, role);
    const meta = { after: { userId, userName: user.name, role, teamId, teamName: team.name } };
    await this.auditLogService.logMany([
      { orgId, entityType: 'team', entityId: teamId, action: 'member_added', performedBy, metadata: meta },
      { orgId, entityType: 'user', entityId: userId, action: 'member_added', performedBy, metadata: meta },
    ]);
    return member;
  }

  async updateMemberRole(
    teamId: string,
    orgId: string,
    userId: string,
    role: 'manager' | 'member',
    performedBy: string,
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

    const updated = await this.teamsRepository.updateMemberRole(teamId, userId, role);
    const meta = {
      before: { userId, userName: member.userName, role: member.role, teamId, teamName: team.name },
      after: { userId, userName: member.userName, role, teamId, teamName: team.name },
    };
    await this.auditLogService.logMany([
      { orgId, entityType: 'team', entityId: teamId, action: 'role_changed', performedBy, metadata: meta },
      { orgId, entityType: 'user', entityId: userId, action: 'role_changed', performedBy, metadata: meta },
    ]);
    return updated;
  }

  async removeMember(
    teamId: string,
    orgId: string,
    userId: string,
    performedBy: string,
  ): Promise<void> {
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
    const meta = { before: { userId, userName: member.userName, role: member.role, teamId, teamName: team.name } };
    await this.auditLogService.logMany([
      { orgId, entityType: 'team', entityId: teamId, action: 'member_removed', performedBy, metadata: meta },
      { orgId, entityType: 'user', entityId: userId, action: 'member_removed', performedBy, metadata: meta },
    ]);
  }

  async findByNameInOrg(name: string, orgId: string): Promise<TeamEntity | null> {
    return this.teamsRepository.findByNameInOrg(name, orgId);
  }

  async createForImport(
    orgId: string,
    data: { name: string; description?: string; members: Array<{ userId: string; role: 'manager' | 'member' }> },
    performedBy: string,
  ): Promise<TeamEntity> {
    const team = await this.teamsRepository.createWithMembers(
      { orgId, name: data.name, description: data.description },
      data.members,
    );
    await this.auditLogService.log({
      orgId,
      entityType: 'team',
      entityId: team.id,
      action: 'created',
      performedBy,
      metadata: {
        after: { name: team.name, description: team.description },
        members: data.members,
        source: 'import',
      },
    });
    return team;
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

  private ensureArchived(team: TeamEntity): void {
    if (!team.isArchived) {
      throw new TeamNotArchivedException();
    }
  }

  private async ensureNotLastManager(teamId: string): Promise<void> {
    const managerCount = await this.teamsRepository.countManagers(teamId);
    if (managerCount <= 1) {
      throw new TeamLastManagerException();
    }
  }
}
