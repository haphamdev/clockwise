import { Injectable } from '@nestjs/common';
import { Prisma, Project, ProjectTeam, Team } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  ProjectAlreadyExistsException,
  ProjectLastTeamException,
} from '../../common/exceptions/project.exceptions';
import {
  ProjectEntity,
  ProjectListItem,
  ProjectWithTeams,
  ProjectTeamEntity,
} from './entities/project.entity';
import {
  ProjectSettingsEntity,
  DEFAULT_PROJECT_SETTINGS,
} from './entities/project-settings.entity';

type ProjectTeamWithTeam = ProjectTeam & {
  team: Team & { _count: { members: number } };
};

type ProjectWithTeamRelations = Project & {
  projectTeams: ProjectTeamWithTeam[];
};

const projectTeamInclude = {
  projectTeams: {
    where: { isDeleted: false },
    include: {
      team: {
        include: { _count: { select: { members: true } } },
      },
    },
    orderBy: { createdAt: 'asc' as const },
  },
};

@Injectable()
export class ProjectsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    orgId: string,
    options: { includeArchived: boolean; page: number; limit: number; teamId?: string },
  ): Promise<{ data: ProjectListItem[]; total: number }> {
    const where: Prisma.ProjectWhereInput = {
      orgId,
      ...(!options.includeArchived && { status: 'active' }),
      ...(options.teamId && {
        projectTeams: { some: { teamId: options.teamId, isDeleted: false } },
      }),
    };

    const [projects, total] = await Promise.all([
      this.prisma.project.findMany({
        where,
        include: {
          _count: { select: { projectTeams: { where: { isDeleted: false } } } },
        },
        orderBy: { name: 'asc' },
        skip: (options.page - 1) * options.limit,
        take: options.limit,
      }),
      this.prisma.project.count({ where }),
    ]);

    return {
      data: projects.map((p) => this.toListItem(p)),
      total,
    };
  }

  async findAllForUser(
    orgId: string,
    userId: string,
    options: { page: number; limit: number; teamId?: string },
  ): Promise<{ data: ProjectListItem[]; total: number }> {
    const where: Prisma.ProjectWhereInput = {
      orgId,
      status: 'active',
      projectTeams: {
        some: {
          isDeleted: false,
          team: {
            isArchived: false,
            members: { some: { userId } },
            ...(options.teamId && { id: options.teamId }),
          },
        },
      },
    };

    const [projects, total] = await Promise.all([
      this.prisma.project.findMany({
        where,
        include: {
          _count: { select: { projectTeams: { where: { isDeleted: false } } } },
        },
        orderBy: { name: 'asc' },
        skip: (options.page - 1) * options.limit,
        take: options.limit,
      }),
      this.prisma.project.count({ where }),
    ]);

    return {
      data: projects.map((p) => this.toListItem(p)),
      total,
    };
  }

  /** Admin-level query: finds projects linked to a user via team membership.
   *  Unlike findAllForUser() (non-admin self-service), this respects
   *  includeArchived and does not filter out archived teams. */
  async findAllForUserId(
    orgId: string,
    userId: string,
    options: { includeArchived: boolean; page: number; limit: number },
  ): Promise<{ data: ProjectListItem[]; total: number }> {
    const where: Prisma.ProjectWhereInput = {
      orgId,
      ...(!options.includeArchived && { status: 'active' }),
      projectTeams: {
        some: {
          isDeleted: false,
          team: { members: { some: { userId } } },
        },
      },
    };

    const [projects, total] = await Promise.all([
      this.prisma.project.findMany({
        where,
        include: {
          _count: { select: { projectTeams: { where: { isDeleted: false } } } },
        },
        orderBy: { name: 'asc' },
        skip: (options.page - 1) * options.limit,
        take: options.limit,
      }),
      this.prisma.project.count({ where }),
    ]);

    return {
      data: projects.map((p) => this.toListItem(p)),
      total,
    };
  }

  async findById(id: string): Promise<ProjectWithTeams | null> {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: projectTeamInclude,
    });

    return project ? this.toEntityWithTeams(project) : null;
  }

  async findEntityById(id: string): Promise<ProjectEntity | null> {
    const project = await this.prisma.project.findUnique({ where: { id } });
    return project ? this.toEntity(project) : null;
  }

  async create(
    data: { orgId: string; name: string; description?: string },
    teamIds: string[],
  ): Promise<ProjectWithTeams> {
    try {
      const project = await this.prisma.project.create({
        data: {
          ...data,
          projectTeams: {
            create: teamIds.map((teamId) => ({ teamId })),
          },
        },
        include: projectTeamInclude,
      });
      return this.toEntityWithTeams(project);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ProjectAlreadyExistsException();
      }
      throw error;
    }
  }

  async update(
    id: string,
    data: { name?: string; description?: string },
  ): Promise<ProjectEntity> {
    try {
      const project = await this.prisma.project.update({ where: { id }, data });
      return this.toEntity(project);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ProjectAlreadyExistsException();
      }
      throw error;
    }
  }

  async archive(id: string): Promise<ProjectEntity> {
    const project = await this.prisma.project.update({
      where: { id },
      data: { status: 'archived' },
    });
    return this.toEntity(project);
  }

  async unarchive(id: string): Promise<ProjectEntity> {
    try {
      const project = await this.prisma.project.update({
        where: { id },
        data: { status: 'active' },
      });
      return this.toEntity(project);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ProjectAlreadyExistsException();
      }
      throw error;
    }
  }

  async assignTeam(projectId: string, teamId: string): Promise<ProjectTeamEntity> {
    // Check for a soft-deleted record to reactivate
    const existing = await this.prisma.projectTeam.findUnique({
      where: { projectId_teamId: { projectId, teamId } },
      select: { id: true, isDeleted: true },
    });

    let pt: ProjectTeamWithTeam;
    if (existing?.isDeleted) {
      pt = await this.prisma.projectTeam.update({
        where: { id: existing.id },
        data: { isDeleted: false },
        include: {
          team: { include: { _count: { select: { members: true } } } },
        },
      });
    } else {
      pt = await this.prisma.projectTeam.create({
        data: { projectId, teamId },
        include: {
          team: { include: { _count: { select: { members: true } } } },
        },
      });
    }
    return this.toProjectTeamEntity(pt);
  }

  async removeTeam(projectId: string, teamId: string): Promise<void> {
    await this.prisma.projectTeam.updateMany({
      where: { projectId, teamId, isDeleted: false },
      data: { isDeleted: true },
    });
  }

  async removeTeamSafe(projectId: string, teamId: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const count = await tx.projectTeam.count({
        where: { projectId, isDeleted: false },
      });
      if (count <= 1) {
        throw new ProjectLastTeamException();
      }
      await tx.projectTeam.updateMany({
        where: { projectId, teamId, isDeleted: false },
        data: { isDeleted: true },
      });
    });
  }

  async findProjectTeam(projectId: string, teamId: string): Promise<{ id: string } | null> {
    return this.prisma.projectTeam.findFirst({
      where: { projectId, teamId, isDeleted: false },
      select: { id: true },
    });
  }

  async countTeams(projectId: string): Promise<number> {
    return this.prisma.projectTeam.count({ where: { projectId, isDeleted: false } });
  }

  async isUserLinkedToProject(projectId: string, userId: string): Promise<boolean> {
    const count = await this.prisma.projectTeam.count({
      where: {
        projectId,
        isDeleted: false,
        team: { members: { some: { userId } } },
      },
    });
    return count > 0;
  }

  async isManagerOfLinkedTeam(projectId: string, userId: string): Promise<boolean> {
    const count = await this.prisma.projectTeam.count({
      where: {
        projectId,
        isDeleted: false,
        team: { members: { some: { userId, role: 'manager' } } },
      },
    });
    return count > 0;
  }

  async findTeamName(teamId: string): Promise<string | null> {
    const team = await this.prisma.team.findUnique({
      where: { id: teamId },
      select: { name: true },
    });
    return team?.name ?? null;
  }

  async isManagerOfTeam(teamId: string, userId: string): Promise<boolean> {
    const count = await this.prisma.teamMember.count({
      where: { teamId, userId, role: 'manager' },
    });
    return count > 0;
  }

  async findSettings(projectId: string): Promise<ProjectSettingsEntity | null> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { settings: true },
    });
    if (!project) return null;
    return this.toSettingsEntity(project.settings);
  }

  async updateSettings(
    projectId: string,
    data: { dailyHourLimit?: number | null; weeklyHourLimit?: number | null },
  ): Promise<ProjectSettingsEntity> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { settings: true },
    });
    const current = (project?.settings ?? {}) as Record<string, unknown>;
    const merged = { ...current };
    if (data.dailyHourLimit !== undefined) {
      merged.dailyHourLimit = data.dailyHourLimit;
    }
    if (data.weeklyHourLimit !== undefined) {
      merged.weeklyHourLimit = data.weeklyHourLimit;
    }

    const updated = await this.prisma.project.update({
      where: { id: projectId },
      data: { settings: merged as Prisma.InputJsonValue },
      select: { settings: true },
    });
    return this.toSettingsEntity(updated.settings);
  }

  private toSettingsEntity(settings: unknown): ProjectSettingsEntity {
    const s = (settings ?? {}) as Record<string, unknown>;
    return {
      dailyHourLimit:
        typeof s.dailyHourLimit === 'number' ? s.dailyHourLimit : DEFAULT_PROJECT_SETTINGS.dailyHourLimit,
      weeklyHourLimit:
        typeof s.weeklyHourLimit === 'number' ? s.weeklyHourLimit : DEFAULT_PROJECT_SETTINGS.weeklyHourLimit,
    };
  }

  private toListItem(
    project: Project & { _count: { projectTeams: number } },
  ): ProjectListItem {
    return {
      ...this.toEntity(project),
      teamCount: project._count.projectTeams,
    };
  }

  private toEntity(project: Project): ProjectEntity {
    return {
      id: project.id,
      orgId: project.orgId,
      name: project.name,
      description: project.description,
      status: project.status as 'active' | 'archived',
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    };
  }

  private toEntityWithTeams(project: ProjectWithTeamRelations): ProjectWithTeams {
    return {
      ...this.toEntity(project),
      teams: project.projectTeams.map((pt) => this.toProjectTeamEntity(pt)),
    };
  }

  private toProjectTeamEntity(
    pt: ProjectTeamWithTeam,
  ): ProjectTeamEntity {
    return {
      id: pt.id,
      teamId: pt.team.id,
      teamName: pt.team.name,
      memberCount: pt.team._count.members,
      isArchived: pt.team.isArchived,
      createdAt: pt.createdAt,
    };
  }
}
