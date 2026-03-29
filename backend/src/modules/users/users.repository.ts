import { Injectable } from '@nestjs/common';
import { User } from '@prisma/client';
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
        team: { id: string; name: string };
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
        }),
      ),
    };
  }
}
