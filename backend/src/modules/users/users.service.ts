import { Injectable } from '@nestjs/common';
import {
  UserNotFoundException,
  UserAlreadyDeactivatedException,
  UserLastAdminException,
  UserCannotModifySelfException,
  UserInvalidTeamAssignmentException,
  UserWouldOrphanTeamException,
  UserNotDeactivatedException,
} from '../../common/exceptions/user.exceptions';
import { UsersRepository } from './users.repository';
import { UserEntity, UserWithRefreshToken, UserWithTeams } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async findByEmail(email: string): Promise<UserEntity | null> {
    return this.usersRepository.findByEmail(email);
  }

  async findById(id: string): Promise<UserWithTeams | null> {
    return this.usersRepository.findById(id);
  }

  async createPendingUser(orgId: string, email: string): Promise<UserEntity> {
    return this.usersRepository.createPendingUser(orgId, email);
  }

  async findByIdWithRefreshToken(id: string): Promise<UserWithRefreshToken | null> {
    return this.usersRepository.findByIdWithRefreshToken(id);
  }

  async updateRefreshToken(userId: string, hashedToken: string | null): Promise<void> {
    return this.usersRepository.updateRefreshToken(userId, hashedToken);
  }

  async activateUser(
    userId: string,
    data: { name: string; avatarUrl?: string },
  ): Promise<UserEntity> {
    return this.usersRepository.activateUser(userId, data);
  }

  async updateLastLogin(userId: string): Promise<void> {
    return this.usersRepository.updateLastLogin(userId);
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
    return this.usersRepository.findAll(orgId, options);
  }

  async getUserDetail(userId: string, orgId: string): Promise<UserWithTeams> {
    const user = await this.usersRepository.findById(userId);
    if (!user || user.orgId !== orgId) {
      throw new UserNotFoundException();
    }
    return user;
  }

  async updateUser(
    adminId: string,
    userId: string,
    orgId: string,
    data: {
      isAdmin?: boolean;
      teamAssignments?: Array<{ teamId: string; role: 'manager' | 'member' }>;
    },
  ): Promise<UserWithTeams> {
    const user = await this.getUserDetail(userId, orgId);

    if (data.isAdmin !== undefined && data.isAdmin !== user.isAdmin) {
      if (!data.isAdmin && user.isAdmin) {
        // Demoting from admin — block self-demotion and last-admin
        if (adminId === userId) {
          throw new UserCannotModifySelfException();
        }
        const adminCount = await this.usersRepository.countActiveAdmins(orgId);
        if (adminCount <= 1) {
          throw new UserLastAdminException();
        }
      }
      await this.usersRepository.updateIsAdmin(userId, data.isAdmin);
    }

    if (data.teamAssignments !== undefined) {
      await this.validateTeamAssignments(orgId, data.teamAssignments);
      await this.ensureNoOrphanedTeams(userId, data.teamAssignments);
      await this.usersRepository.replaceTeamAssignments(userId, data.teamAssignments);
    }

    return this.getUserDetail(userId, orgId);
  }

  async deactivateUser(adminId: string, userId: string, orgId: string): Promise<void> {
    if (adminId === userId) {
      throw new UserCannotModifySelfException();
    }

    const user = await this.getUserDetail(userId, orgId);

    if (user.status !== 'active') {
      throw new UserAlreadyDeactivatedException();
    }

    if (user.isAdmin) {
      const adminCount = await this.usersRepository.countActiveAdmins(orgId);
      if (adminCount <= 1) {
        throw new UserLastAdminException();
      }
    }

    await this.usersRepository.deactivateUser(userId);
  }

  async reactivateUser(userId: string, orgId: string): Promise<void> {
    const user = await this.getUserDetail(userId, orgId);

    if (user.status !== 'deactivated') {
      throw new UserNotDeactivatedException();
    }

    await this.usersRepository.reactivateUser(userId);
  }

  /**
   * Validates that all teamIds exist, belong to the org, and are not archived.
   */
  private async validateTeamAssignments(
    orgId: string,
    assignments: Array<{ teamId: string; role: 'manager' | 'member' }>,
  ): Promise<void> {
    if (assignments.length === 0) return;

    const teamIds = [...new Set(assignments.map((a) => a.teamId))];
    const validCount = await this.usersRepository.countValidTeams(orgId, teamIds);
    if (validCount !== teamIds.length) {
      throw new UserInvalidTeamAssignmentException();
    }
  }

  /**
   * Checks that replacing a user's team assignments won't leave any team
   * without a manager. Only blocks if the user is currently the sole manager
   * of a team AND the new assignments don't keep them as manager on that team.
   */
  private async ensureNoOrphanedTeams(
    userId: string,
    newAssignments: Array<{ teamId: string; role: 'manager' | 'member' }>,
  ): Promise<void> {
    const soloManagerTeamIds = await this.usersRepository.findTeamsWhereOnlyManager(userId);
    if (soloManagerTeamIds.length === 0) return;

    const newManagerTeamIds = new Set(
      newAssignments.filter((a) => a.role === 'manager').map((a) => a.teamId),
    );

    for (const teamId of soloManagerTeamIds) {
      if (!newManagerTeamIds.has(teamId)) {
        throw new UserWouldOrphanTeamException();
      }
    }
  }
}
