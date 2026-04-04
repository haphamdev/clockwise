import { Injectable } from '@nestjs/common';
import { ProjectsRepository } from './projects.repository';
import { AuditLogService } from '../audit-log/audit-log.service';
import { TeamsService } from '../teams/teams.service';
import {
  ProjectEntity,
  ProjectListItem,
  ProjectWithTeams,
  ProjectTeamEntity,
} from './entities/project.entity';
import { ProjectSettingsEntity } from './entities/project-settings.entity';
import {
  ProjectNotFoundException,
  ProjectArchivedException,
  ProjectNotArchivedException,
  ProjectTeamAlreadyAssignedException,
  ProjectTeamNotAssignedException,
  ProjectInsufficientRoleException,
} from '../../common/exceptions/project.exceptions';

@Injectable()
export class ProjectsService {
  constructor(
    private readonly projectsRepository: ProjectsRepository,
    private readonly teamsService: TeamsService,
    private readonly auditLogService: AuditLogService,
  ) {}

  async findAll(
    orgId: string,
    userId: string,
    isAdmin: boolean,
    options: { includeArchived: boolean; page: number; limit: number; teamId?: string },
  ): Promise<{ data: ProjectListItem[]; total: number }> {
    if (isAdmin) {
      return this.projectsRepository.findAll(orgId, options);
    }
    return this.projectsRepository.findAllForUser(orgId, userId, {
      page: options.page,
      limit: options.limit,
      teamId: options.teamId,
    });
  }

  async findProjectsForUser(
    orgId: string,
    userId: string,
    options: { includeArchived: boolean; page: number; limit: number },
  ): Promise<{ data: ProjectListItem[]; total: number }> {
    return this.projectsRepository.findAllForUserId(orgId, userId, options);
  }

  async findById(
    projectId: string,
    orgId: string,
    userId: string,
    isAdmin: boolean,
  ): Promise<ProjectWithTeams> {
    const project = await this.projectsRepository.findById(projectId);
    if (!project || project.orgId !== orgId) {
      throw new ProjectNotFoundException();
    }

    if (!isAdmin) {
      const isLinked = await this.projectsRepository.isUserLinkedToProject(projectId, userId);
      if (!isLinked) {
        throw new ProjectNotFoundException();
      }
    }

    return project;
  }

  async create(
    orgId: string,
    data: { name: string; description?: string; teamIds: string[] },
    userId: string,
    isAdmin: boolean,
  ): Promise<ProjectWithTeams> {
    const uniqueTeamIds = [...new Set(data.teamIds)];

    // Validate all teams exist and belong to the org
    for (const teamId of uniqueTeamIds) {
      await this.teamsService.validateTeamExists(teamId, orgId);
    }

    // Non-admin must be manager of ALL requested teams
    if (!isAdmin) {
      for (const teamId of uniqueTeamIds) {
        const isManager = await this.projectsRepository.isManagerOfTeam(teamId, userId);
        if (!isManager) {
          throw new ProjectInsufficientRoleException();
        }
      }
    }

    const project = await this.projectsRepository.create(
      { orgId, name: data.name, description: data.description },
      uniqueTeamIds,
    );

    await this.auditLogService.log({
      orgId,
      entityType: 'project',
      entityId: project.id,
      action: 'created',
      performedBy: userId,
      metadata: {
        after: {
          name: project.name,
          description: project.description,
          teams: project.teams.map((t) => ({ teamId: t.teamId, teamName: t.teamName })),
        },
      },
    });

    return project;
  }

  async update(
    projectId: string,
    orgId: string,
    data: { name?: string; description?: string },
    userId: string,
    isAdmin: boolean,
  ): Promise<ProjectListItem> {
    const project = await this.getProjectOrThrow(projectId, orgId);
    this.ensureNotArchived(project);

    if (!isAdmin) {
      const isManager = await this.projectsRepository.isManagerOfLinkedTeam(projectId, userId);
      if (!isManager) {
        throw new ProjectInsufficientRoleException();
      }
    }

    const updated = await this.projectsRepository.update(projectId, data);
    const { teamCount, teamIds } = await this.projectsRepository.getTeamSummary(projectId);

    const before: Record<string, unknown> = {};
    const after: Record<string, unknown> = {};
    if (data.name !== undefined && data.name !== project.name) {
      before.name = project.name;
      after.name = data.name;
    }
    if (data.description !== undefined && data.description !== project.description) {
      before.description = project.description;
      after.description = data.description;
    }
    if (Object.keys(after).length > 0) {
      await this.auditLogService.log({
        orgId,
        entityType: 'project',
        entityId: projectId,
        action: 'updated',
        performedBy: userId,
        metadata: { before, after },
      });
    }

    return { ...updated, teamCount, teamIds };
  }

  async archive(
    projectId: string,
    orgId: string,
    performedBy: string,
  ): Promise<ProjectListItem> {
    const project = await this.getProjectOrThrow(projectId, orgId);
    this.ensureNotArchived(project);
    const updated = await this.projectsRepository.archive(projectId);
    const { teamCount, teamIds } = await this.projectsRepository.getTeamSummary(projectId);
    await this.auditLogService.log({
      orgId,
      entityType: 'project',
      entityId: projectId,
      action: 'archived',
      performedBy,
      metadata: { before: { status: 'active' }, after: { status: 'archived' } },
    });
    return { ...updated, teamCount, teamIds };
  }

  async unarchive(
    projectId: string,
    orgId: string,
    performedBy: string,
  ): Promise<ProjectListItem> {
    const project = await this.getProjectOrThrow(projectId, orgId);
    this.ensureArchived(project);
    const updated = await this.projectsRepository.unarchive(projectId);
    const { teamCount, teamIds } = await this.projectsRepository.getTeamSummary(projectId);
    await this.auditLogService.log({
      orgId,
      entityType: 'project',
      entityId: projectId,
      action: 'unarchived',
      performedBy,
      metadata: { before: { status: 'archived' }, after: { status: 'active' } },
    });
    return { ...updated, teamCount, teamIds };
  }

  async assignTeam(
    projectId: string,
    orgId: string,
    teamId: string,
    userId: string,
    isAdmin: boolean,
  ): Promise<ProjectTeamEntity> {
    const project = await this.getProjectOrThrow(projectId, orgId);
    this.ensureNotArchived(project);

    // Validate team exists and belongs to org
    await this.teamsService.validateTeamExists(teamId, orgId);

    if (!isAdmin) {
      // Must be manager of the team being assigned
      const isManagerOfNewTeam = await this.projectsRepository.isManagerOfTeam(teamId, userId);
      if (!isManagerOfNewTeam) {
        throw new ProjectInsufficientRoleException();
      }
      // Must also be manager of at least one already-linked team
      const isManagerOfLinked = await this.projectsRepository.isManagerOfLinkedTeam(
        projectId,
        userId,
      );
      if (!isManagerOfLinked) {
        throw new ProjectInsufficientRoleException();
      }
    }

    // Check not already assigned
    const existing = await this.projectsRepository.findProjectTeam(projectId, teamId);
    if (existing) {
      throw new ProjectTeamAlreadyAssignedException();
    }

    const projectTeam = await this.projectsRepository.assignTeam(projectId, teamId);

    const meta = {
      after: {
        teamId: projectTeam.teamId,
        teamName: projectTeam.teamName,
        projectId,
        projectName: project.name,
      },
    };
    await this.auditLogService.logMany([
      { orgId, entityType: 'project', entityId: projectId, action: 'team_assigned', performedBy: userId, metadata: meta },
      { orgId, entityType: 'team', entityId: teamId, action: 'team_assigned', performedBy: userId, metadata: meta },
    ]);

    return projectTeam;
  }

  async removeTeam(
    projectId: string,
    orgId: string,
    teamId: string,
    userId: string,
    isAdmin: boolean,
  ): Promise<void> {
    const project = await this.getProjectOrThrow(projectId, orgId);
    this.ensureNotArchived(project);

    if (!isAdmin) {
      // Must be manager of the team being removed
      const isManager = await this.projectsRepository.isManagerOfTeam(teamId, userId);
      if (!isManager) {
        throw new ProjectInsufficientRoleException();
      }
    }

    // Check the team is assigned
    const existing = await this.projectsRepository.findProjectTeam(projectId, teamId);
    if (!existing) {
      throw new ProjectTeamNotAssignedException();
    }

    // Atomically check last-team constraint and soft-delete
    await this.projectsRepository.removeTeamSafe(projectId, teamId);

    // Look up team name for audit log
    const teamName = await this.getTeamName(teamId);
    const meta = {
      before: { teamId, teamName, projectId, projectName: project.name },
    };
    await this.auditLogService.logMany([
      { orgId, entityType: 'project', entityId: projectId, action: 'team_removed', performedBy: userId, metadata: meta },
      { orgId, entityType: 'team', entityId: teamId, action: 'team_removed', performedBy: userId, metadata: meta },
    ]);
  }

  async getSettings(
    projectId: string,
    orgId: string,
    userId: string,
    isAdmin: boolean,
  ): Promise<ProjectSettingsEntity> {
    await this.validateProjectAccess(projectId, orgId, userId, isAdmin);
    const settings = await this.projectsRepository.findSettings(projectId);
    if (!settings) {
      throw new ProjectNotFoundException();
    }
    return settings;
  }

  async updateSettings(
    projectId: string,
    orgId: string,
    data: { dailyHourLimit?: number | null; weeklyHourLimit?: number | null },
    userId: string,
    isAdmin: boolean,
  ): Promise<ProjectSettingsEntity> {
    const project = await this.getProjectOrThrow(projectId, orgId);
    this.ensureNotArchived(project);

    if (!isAdmin) {
      const isManager = await this.projectsRepository.isManagerOfLinkedTeam(projectId, userId);
      if (!isManager) {
        throw new ProjectInsufficientRoleException();
      }
    }

    if (data.dailyHourLimit === undefined && data.weeklyHourLimit === undefined) {
      const current = await this.projectsRepository.findSettings(projectId);
      return current!;
    }

    const currentSettings = await this.projectsRepository.findSettings(projectId);
    const updated = await this.projectsRepository.updateSettings(projectId, data);

    await this.auditLogService.log({
      orgId,
      entityType: 'project',
      entityId: projectId,
      action: 'settings_updated',
      performedBy: userId,
      metadata: {
        before: { ...currentSettings },
        after: { ...updated },
      },
    });

    return updated;
  }

  async findActiveByNameInOrg(name: string, orgId: string): Promise<ProjectEntity | null> {
    return this.projectsRepository.findActiveByNameInOrg(name, orgId);
  }

  async findByNameInOrg(name: string, orgId: string): Promise<ProjectEntity | null> {
    return this.projectsRepository.findByNameInOrg(name, orgId);
  }

  /** Create a project from an import row. Team existence is pre-validated by the import processor. */
  async createForImport(
    orgId: string,
    data: {
      name: string;
      description?: string;
      status?: 'active' | 'archived';
      teamIds: string[];
      settings?: { dailyHourLimit?: number | null; weeklyHourLimit?: number | null };
    },
    performedBy: string,
  ): Promise<ProjectWithTeams> {
    const project = await this.projectsRepository.createWithTeamsAndSettings(
      {
        orgId,
        name: data.name,
        description: data.description,
        status: data.status,
        settings: data.settings,
      },
      data.teamIds,
    );

    await this.auditLogService.log({
      orgId,
      entityType: 'project',
      entityId: project.id,
      action: 'created',
      performedBy,
      metadata: {
        after: {
          name: project.name,
          description: project.description,
          status: project.status,
          teams: project.teams.map((t) => ({ teamId: t.teamId, teamName: t.teamName })),
        },
        source: 'import',
      },
    });

    return project;
  }

  async isUserLinkedToProject(projectId: string, userId: string): Promise<boolean> {
    return this.projectsRepository.isUserLinkedToProject(projectId, userId);
  }

  async getSettingsInternal(projectId: string): Promise<ProjectSettingsEntity> {
    const settings = await this.projectsRepository.findSettings(projectId);
    if (!settings) {
      throw new ProjectNotFoundException();
    }
    return settings;
  }

  async validateProjectAccess(
    projectId: string,
    orgId: string,
    userId: string,
    isAdmin: boolean,
    options?: { requireActive?: boolean },
  ): Promise<void> {
    const project = await this.projectsRepository.findEntityById(projectId);
    if (!project || project.orgId !== orgId) {
      throw new ProjectNotFoundException();
    }
    if (options?.requireActive) {
      this.ensureNotArchived(project);
    }
    if (!isAdmin) {
      const isLinked = await this.projectsRepository.isUserLinkedToProject(projectId, userId);
      if (!isLinked) {
        throw new ProjectNotFoundException();
      }
    }
  }

  private async getProjectOrThrow(projectId: string, orgId: string): Promise<ProjectEntity> {
    const project = await this.projectsRepository.findEntityById(projectId);
    if (!project || project.orgId !== orgId) {
      throw new ProjectNotFoundException();
    }
    return project;
  }

  private ensureNotArchived(project: ProjectEntity): void {
    if (project.status === 'archived') {
      throw new ProjectArchivedException();
    }
  }

  private ensureArchived(project: ProjectEntity): void {
    if (project.status !== 'archived') {
      throw new ProjectNotArchivedException();
    }
  }

  private async getTeamName(teamId: string): Promise<string> {
    return (await this.projectsRepository.findTeamName(teamId)) ?? 'Unknown';
  }
}
