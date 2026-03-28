import { Injectable } from '@nestjs/common';
import { Team, TeamMember } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { TeamEntity, TeamListItem, TeamWithMembers, TeamMemberEntity } from './entities/team.entity';

type TeamMemberWithUser = TeamMember & {
  user: { id: string; name: string; email: string };
};

type TeamWithMemberUsers = Team & {
  members: TeamMemberWithUser[];
};

@Injectable()
export class TeamsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    orgId: string,
    options: { includeArchived: boolean; page: number; limit: number },
  ): Promise<{ data: TeamListItem[]; total: number }> {
    const where = {
      orgId,
      ...(!options.includeArchived && { isArchived: false }),
    };

    const [teams, total] = await Promise.all([
      this.prisma.team.findMany({
        where,
        include: { _count: { select: { members: true } } },
        orderBy: { name: 'asc' },
        skip: (options.page - 1) * options.limit,
        take: options.limit,
      }),
      this.prisma.team.count({ where }),
    ]);

    return {
      data: teams.map((t) => this.toListItem(t)),
      total,
    };
  }

  async findAllForUser(
    orgId: string,
    userId: string,
    options: { page: number; limit: number },
  ): Promise<{ data: TeamListItem[]; total: number }> {
    const where = {
      orgId,
      isArchived: false,
      members: { some: { userId } },
    };

    const [teams, total] = await Promise.all([
      this.prisma.team.findMany({
        where,
        include: { _count: { select: { members: true } } },
        orderBy: { name: 'asc' },
        skip: (options.page - 1) * options.limit,
        take: options.limit,
      }),
      this.prisma.team.count({ where }),
    ]);

    return {
      data: teams.map((t) => this.toListItem(t)),
      total,
    };
  }

  async findById(id: string): Promise<TeamWithMembers | null> {
    const team = await this.prisma.team.findUnique({
      where: { id },
      include: {
        members: {
          include: { user: { select: { id: true, name: true, email: true } } },
          orderBy: [{ role: 'asc' }, { createdAt: 'asc' }],
        },
      },
    });

    return team ? this.toEntityWithMembers(team) : null;
  }

  async findEntityById(id: string): Promise<TeamEntity | null> {
    const team = await this.prisma.team.findUnique({ where: { id } });
    return team ? this.toEntity(team) : null;
  }

  async findByName(orgId: string, name: string): Promise<TeamEntity | null> {
    const team = await this.prisma.team.findUnique({
      where: { orgId_name: { orgId, name } },
    });
    return team ? this.toEntity(team) : null;
  }

  async create(data: { orgId: string; name: string; description?: string }): Promise<TeamEntity> {
    const team = await this.prisma.team.create({ data });
    return this.toEntity(team);
  }

  async update(id: string, data: { name?: string; description?: string }): Promise<TeamEntity> {
    const team = await this.prisma.team.update({ where: { id }, data });
    return this.toEntity(team);
  }

  async archive(id: string): Promise<TeamEntity> {
    const team = await this.prisma.team.update({
      where: { id },
      data: { isArchived: true },
    });
    return this.toEntity(team);
  }

  async addMember(
    teamId: string,
    userId: string,
    role: 'manager' | 'member',
  ): Promise<TeamMemberEntity> {
    const tm = await this.prisma.teamMember.create({
      data: { teamId, userId, role },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
    return this.toMemberEntity(tm);
  }

  async findMember(teamId: string, userId: string): Promise<TeamMemberEntity | null> {
    const tm = await this.prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId, userId } },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
    return tm ? this.toMemberEntity(tm) : null;
  }

  async updateMemberRole(
    teamId: string,
    userId: string,
    role: 'manager' | 'member',
  ): Promise<TeamMemberEntity> {
    const tm = await this.prisma.teamMember.update({
      where: { teamId_userId: { teamId, userId } },
      data: { role },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
    return this.toMemberEntity(tm);
  }

  async removeMember(teamId: string, userId: string): Promise<void> {
    await this.prisma.teamMember.delete({
      where: { teamId_userId: { teamId, userId } },
    });
  }

  async countManagers(teamId: string): Promise<number> {
    return this.prisma.teamMember.count({
      where: { teamId, role: 'manager' },
    });
  }

  private toListItem(team: Team & { _count: { members: number } }): TeamListItem {
    return {
      ...this.toEntity(team),
      memberCount: team._count.members,
    };
  }

  private toEntity(team: Team): TeamEntity {
    return {
      id: team.id,
      orgId: team.orgId,
      name: team.name,
      description: team.description,
      isArchived: team.isArchived,
      createdAt: team.createdAt,
      updatedAt: team.updatedAt,
    };
  }

  private toEntityWithMembers(team: TeamWithMemberUsers): TeamWithMembers {
    return {
      ...this.toEntity(team),
      members: team.members.map((m) => this.toMemberEntity(m)),
    };
  }

  private toMemberEntity(tm: TeamMemberWithUser): TeamMemberEntity {
    return {
      id: tm.id,
      userId: tm.user.id,
      userName: tm.user.name,
      userEmail: tm.user.email,
      role: tm.role as 'manager' | 'member',
      createdAt: tm.createdAt,
    };
  }
}
