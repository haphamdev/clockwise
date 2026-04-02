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
    const teamCount = await this.projectsRepository.countTeams(projectId);

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

    return { ...updated, teamCount };
  }

  async archive(
    projectId: string,
    orgId: string,
    performedBy: string,
  ): Promise<ProjectListItem> {
    const project = await this.getProjectOrThrow(projectId, orgId);
    this.ensureNotArchived(project);
    const updated = await this.projectsRepository.archive(projectId);
    const teamCount = await this.projectsRepository.countTeams(projectId);
    await this.auditLogService.log({
      orgId,
      entityType: 'project',
      entityId: projectId,
      action: 'archived',
      performedBy,
      metadata: { before: { status: 'active' }, after: { status: 'archived' } },
    });
    return { ...updated, teamCount };
  }

  async unarchive(
    projectId: string,
    orgId: string,
    performedBy: string,
  ): Promise<ProjectListItem> {
    const project = await this.getProjectOrThrow(projectId, orgId);
    this.ensureArchived(project);
    const updated = await this.projectsRepository.unarchive(projectId);
    const teamCount = await this.projectsRepository.countTeams(projectId);
    await this.auditLogService.log({
      orgId,
      entityType: 'project',
      entityId: projectId,
      action: 'unarchived',
      performedBy,
      metadata: { before: { status: 'archived' }, after: { status: 'active' } },
    });
    return { ...updated, teamCount };
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

  async validateProjectAccess(
    projectId: string,
    orgId: string,
    userId: string,
    isAdmin: boolean,
  ): Promise<void> {
    const project = await this.projectsRepository.findEntityById(projectId);
    if (!project || project.orgId !== orgId) {
      throw new ProjectNotFoundException();
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
