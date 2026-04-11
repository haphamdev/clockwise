import { Injectable } from "@nestjs/common";
import {
  UserAlreadyDeactivatedException,
  UserCannotModifySelfException,
  UserInvalidTeamAssignmentException,
  UserLastAdminException,
  UserNotDeactivatedException,
  UserNotFoundException,
  UserWouldOrphanTeamException,
} from "../../common/exceptions/user.exceptions";
import { CreateAuditLogInput } from "../audit-log/audit-log.repository";
import { AuditLogService } from "../audit-log/audit-log.service";
import { ProjectListItem } from "../projects/entities/project.entity";
import { ProjectsRepository } from "../projects/projects.repository";
import {
  UserEntity,
  UserWithRefreshToken,
  UserWithTeams,
} from "./entities/user.entity";
import { UsersRepository } from "./users.repository";

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly auditLogService: AuditLogService,
    private readonly projectsRepository: ProjectsRepository,
  ) {}

  async findByEmail(email: string): Promise<UserEntity | null> {
    return this.usersRepository.findByEmail(email);
  }

  async findById(id: string): Promise<UserWithTeams | null> {
    return this.usersRepository.findById(id);
  }

  async findProjectsForUser(
    orgId: string,
    userId: string,
    options: { includeArchived: boolean; page: number; limit: number },
  ): Promise<{ data: ProjectListItem[]; total: number }> {
    return this.projectsRepository.findAllForUserId(orgId, userId, options);
  }

  async createPendingUser(
    orgId: string,
    email: string,
    performedBy: string,
    source?: string,
  ): Promise<UserEntity> {
    const user = await this.usersRepository.createPendingUser(orgId, email);
    await this.auditLogService.log({
      orgId,
      entityType: "user",
      entityId: user.id,
      action: "created",
      performedBy,
      metadata: {
        after: { email, status: "pending" },
        ...(source && { source }),
      },
    });
    return user;
  }

  async findByIdWithRefreshToken(
    id: string,
  ): Promise<UserWithRefreshToken | null> {
    return this.usersRepository.findByIdWithRefreshToken(id);
  }

  async updateRefreshToken(
    userId: string,
    hashedToken: string | null,
  ): Promise<void> {
    return this.usersRepository.updateRefreshToken(userId, hashedToken);
  }

  async activateUser(
    userId: string,
    data: { name: string; avatarUrl?: string },
    performedBy: string,
  ): Promise<UserEntity> {
    const user = await this.usersRepository.activateUser(userId, data);
    await this.auditLogService.log({
      orgId: user.orgId,
      entityType: "user",
      entityId: userId,
      action: "activated",
      performedBy,
      metadata: {
        before: { status: "pending" },
        after: { status: "active", name: data.name },
      },
    });
    return user;
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
      projectId?: string;
    },
  ): Promise<{ data: UserWithTeams[]; total: number }> {
    return this.usersRepository.findAll(orgId, options);
  }

  async canViewUserDetails(
    callerId: string,
    callerIsAdmin: boolean,
    targetId: string,
  ): Promise<boolean> {
    if (callerIsAdmin) return true;
    if (callerId === targetId) return true;
    const count = await this.usersRepository.countManagerRelationship(
      callerId,
      targetId,
    );
    return count > 0;
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
      teamAssignments?: Array<{ teamId: string; role: "manager" | "member" }>;
    },
  ): Promise<UserWithTeams> {
    const user = await this.getUserDetail(userId, orgId);

    if (data.isAdmin !== undefined && data.isAdmin !== user.isAdmin) {
      if (!data.isAdmin && user.isAdmin) {
        if (adminId === userId) {
          throw new UserCannotModifySelfException();
        }
        const adminCount = await this.usersRepository.countActiveAdmins(orgId);
        if (adminCount <= 1) {
          throw new UserLastAdminException();
        }
      }
      await this.usersRepository.updateIsAdmin(userId, data.isAdmin);
      await this.auditLogService.log({
        orgId,
        entityType: "user",
        entityId: userId,
        action: data.isAdmin ? "admin_granted" : "admin_revoked",
        performedBy: adminId,
        metadata: {
          before: { isAdmin: user.isAdmin },
          after: { isAdmin: data.isAdmin },
        },
      });
    }

    if (data.teamAssignments !== undefined) {
      await this.validateTeamAssignments(orgId, data.teamAssignments);
      await this.ensureNoOrphanedTeams(userId, data.teamAssignments);

      const oldTeamIds = new Set(user.teamMemberships.map((m) => m.teamId));
      const newTeamIds = data.teamAssignments
        .map((a) => a.teamId)
        .filter((id) => !oldTeamIds.has(id));
      const newTeamNames = newTeamIds.length
        ? await this.usersRepository.findTeamNames(newTeamIds)
        : new Map<string, string>();

      const auditInputs = this.computeTeamAssignmentAuditLogs(
        orgId,
        userId,
        user.name,
        adminId,
        user.teamMemberships,
        data.teamAssignments,
        newTeamNames,
      );

      await this.usersRepository.replaceTeamAssignments(
        userId,
        data.teamAssignments,
      );
      await this.auditLogService.logMany(auditInputs);
    }

    return this.getUserDetail(userId, orgId);
  }

  async deactivateUser(
    adminId: string,
    userId: string,
    orgId: string,
  ): Promise<void> {
    if (adminId === userId) {
      throw new UserCannotModifySelfException();
    }

    const user = await this.getUserDetail(userId, orgId);

    if (user.status !== "active") {
      throw new UserAlreadyDeactivatedException();
    }

    if (user.isAdmin) {
      const adminCount = await this.usersRepository.countActiveAdmins(orgId);
      if (adminCount <= 1) {
        throw new UserLastAdminException();
      }
    }

    await this.usersRepository.deactivateUser(userId);
    await this.auditLogService.log({
      orgId,
      entityType: "user",
      entityId: userId,
      action: "deactivated",
      performedBy: adminId,
      metadata: {
        before: { status: "active" },
        after: { status: "deactivated" },
      },
    });
  }

  async reactivateUser(
    userId: string,
    orgId: string,
    performedBy: string,
  ): Promise<void> {
    const user = await this.getUserDetail(userId, orgId);

    if (user.status !== "deactivated") {
      throw new UserNotDeactivatedException();
    }

    await this.usersRepository.reactivateUser(userId);
    await this.auditLogService.log({
      orgId,
      entityType: "user",
      entityId: userId,
      action: "reactivated",
      performedBy,
      metadata: {
        before: { status: "deactivated" },
        after: { status: "active" },
      },
    });
  }

  /**
   * Validates that all teamIds exist, belong to the org, and are not archived.
   */
  private async validateTeamAssignments(
    orgId: string,
    assignments: Array<{ teamId: string; role: "manager" | "member" }>,
  ): Promise<void> {
    if (assignments.length === 0) return;

    const teamIds = [...new Set(assignments.map((a) => a.teamId))];
    const validCount = await this.usersRepository.countValidTeams(
      orgId,
      teamIds,
    );
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
    newAssignments: Array<{ teamId: string; role: "manager" | "member" }>,
  ): Promise<void> {
    const soloManagerTeamIds =
      await this.usersRepository.findTeamsWhereOnlyManager(userId);
    if (soloManagerTeamIds.length === 0) return;

    const newManagerTeamIds = new Set(
      newAssignments.filter((a) => a.role === "manager").map((a) => a.teamId),
    );

    for (const teamId of soloManagerTeamIds) {
      if (!newManagerTeamIds.has(teamId)) {
        throw new UserWouldOrphanTeamException();
      }
    }
  }

  private computeTeamAssignmentAuditLogs(
    orgId: string,
    userId: string,
    userName: string,
    performedBy: string,
    oldMemberships: Array<{
      teamId: string;
      teamName: string;
      role: "manager" | "member";
    }>,
    newAssignments: Array<{ teamId: string; role: "manager" | "member" }>,
    newTeamNames: Map<string, string>,
  ): CreateAuditLogInput[] {
    const inputs: CreateAuditLogInput[] = [];
    const oldMap = new Map(oldMemberships.map((m) => [m.teamId, m]));
    const newMap = new Map(newAssignments.map((a) => [a.teamId, a]));

    for (const [teamId, old] of oldMap) {
      if (!newMap.has(teamId)) {
        const meta = {
          before: {
            userId,
            userName,
            role: old.role,
            teamId,
            teamName: old.teamName,
          },
        };
        inputs.push(
          {
            orgId,
            entityType: "team",
            entityId: teamId,
            action: "member_removed",
            performedBy,
            metadata: meta,
          },
          {
            orgId,
            entityType: "user",
            entityId: userId,
            action: "member_removed",
            performedBy,
            metadata: meta,
          },
        );
      }
    }

    for (const [teamId, assign] of newMap) {
      const old = oldMap.get(teamId);
      if (!old) {
        const teamName = newTeamNames.get(teamId) ?? teamId;
        const meta = {
          after: { userId, userName, role: assign.role, teamId, teamName },
        };
        inputs.push(
          {
            orgId,
            entityType: "team",
            entityId: teamId,
            action: "member_added",
            performedBy,
            metadata: meta,
          },
          {
            orgId,
            entityType: "user",
            entityId: userId,
            action: "member_added",
            performedBy,
            metadata: meta,
          },
        );
      } else if (old.role !== assign.role) {
        const meta = {
          before: {
            userId,
            userName,
            role: old.role,
            teamId,
            teamName: old.teamName,
          },
          after: {
            userId,
            userName,
            role: assign.role,
            teamId,
            teamName: old.teamName,
          },
        };
        inputs.push(
          {
            orgId,
            entityType: "team",
            entityId: teamId,
            action: "role_changed",
            performedBy,
            metadata: meta,
          },
          {
            orgId,
            entityType: "user",
            entityId: userId,
            action: "role_changed",
            performedBy,
            metadata: meta,
          },
        );
      }
    }

    return inputs;
  }
}
