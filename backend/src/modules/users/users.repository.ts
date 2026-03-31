import { Injectable } from '@nestjs/common';
import { Prisma, User } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  UserEntity,
  UserWithRefreshToken,
  UserWithTeams,
  TeamMembershipInfo,
} from './entities/user.entity';

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string): Promise<UserEntity | null> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    return user ? this.toEntity(user) : null;
  }

  async findById(id: string): Promise<UserWithTeams | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        teamMemberships: {
          include: { team: true },
        },
      },
    });

    return user ? this.toEntityWithTeams(user) : null;
  }

  async createPendingUser(orgId: string, email: string): Promise<UserEntity> {
    const user = await this.prisma.user.create({
      data: { orgId, email, name: email, status: 'pending' },
    });
    return this.toEntity(user);
  }

  async updateRefreshToken(userId: string, hashedToken: string | null): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: hashedToken },
    });
  }

  async activateUser(
    userId: string,
    data: { name: string; avatarUrl?: string },
  ): Promise<UserEntity> {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        status: 'active',
        name: data.name,
        avatarUrl: data.avatarUrl,
        lastLoginAt: new Date(),
      },
    });

    return this.toEntity(user);
  }

  async updateLastLogin(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { lastLoginAt: new Date() },
    });
  }

  async findAll(
    orgId: string,
    options: {
      page: number;
      limit: number;
      search?: string;
      status?: string;
      teamId?: string;
    },
  ): Promise<{ data: UserWithTeams[]; total: number }> {
    const where: Prisma.UserWhereInput = {
      orgId,
      ...(options.status && { status: options.status as 'pending' | 'active' | 'deactivated' }),
      ...(options.teamId && { teamMemberships: { some: { teamId: options.teamId } } }),
      ...(options.search && {
        OR: [
          { name: { contains: options.search, mode: 'insensitive' as const } },
          { email: { contains: options.search, mode: 'insensitive' as const } },
        ],
      }),
    };

    const include = { teamMemberships: { include: { team: true } } };

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        include,
        orderBy: { name: 'asc' },
        skip: (options.page - 1) * options.limit,
        take: options.limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: users.map((u) => this.toEntityWithTeams(u)),
      total,
    };
  }

  async countActiveAdmins(orgId: string): Promise<number> {
    return this.prisma.user.count({
      where: { orgId, isAdmin: true, status: 'active' },
    });
  }

  async updateIsAdmin(userId: string, isAdmin: boolean): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { isAdmin },
    });
  }

  async deactivateUser(userId: string): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { status: 'deactivated', refreshToken: null },
      }),
      this.prisma.projectMember.deleteMany({ where: { userId } }),
    ]);
  }

  async reactivateUser(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { status: 'active' },
    });
  }

  /**
   * Validates that all provided teamIds exist, belong to the org, and are not archived.
   * Returns the count of valid teams. Throws nothing — caller compares counts.
   */
  async countValidTeams(orgId: string, teamIds: string[]): Promise<number> {
    return this.prisma.team.count({
      where: { id: { in: teamIds }, orgId, isArchived: false },
    });
  }

  /**
   * Returns teams where the given user is the ONLY manager.
   * Used to check the last-manager invariant before removing a user from teams.
   */
  async findTeamsWhereOnlyManager(userId: string): Promise<string[]> {
    const memberships = await this.prisma.teamMember.findMany({
      where: { userId, role: 'manager' },
      select: { teamId: true },
    });

    const soloManagerTeamIds: string[] = [];
    for (const m of memberships) {
      const managerCount = await this.prisma.teamMember.count({
        where: { teamId: m.teamId, role: 'manager' },
      });
      if (managerCount <= 1) {
        soloManagerTeamIds.push(m.teamId);
      }
    }

    return soloManagerTeamIds;
  }

  async replaceTeamAssignments(
    userId: string,
    assignments: Array<{ teamId: string; role: 'manager' | 'member' }>,
  ): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.teamMember.deleteMany({ where: { userId } }),
      ...assignments.map((a) =>
        this.prisma.teamMember.create({
          data: { userId, teamId: a.teamId, role: a.role },
        }),
      ),
    ]);
  }

  async findTeamNames(teamIds: string[]): Promise<Map<string, string>> {
    const teams = await this.prisma.team.findMany({
      where: { id: { in: teamIds } },
      select: { id: true, name: true },
    });
    return new Map(teams.map((t) => [t.id, t.name]));
  }

  async findByIdWithRefreshToken(id: string): Promise<UserWithRefreshToken | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });
    return user ? { ...this.toEntity(user), refreshToken: user.refreshToken } : null;
  }

  private toEntity(user: User): UserEntity {
    return {
      id: user.id,
      orgId: user.orgId,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      isAdmin: user.isAdmin,
      status: user.status,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  private toEntityWithTeams(
    user: User & {
      teamMemberships: Array<{
        role: string;
        team: { id: string; name: string; isArchived: boolean };
      }>;
    },
  ): UserWithTeams {
    return {
      ...this.toEntity(user),
      teamMemberships: user.teamMemberships.map(
        (tm): TeamMembershipInfo => ({
          teamId: tm.team.id,
          teamName: tm.team.name,
          role: tm.role as 'manager' | 'member',
          isArchived: tm.team.isArchived,
        }),
      ),
    };
  }
}
