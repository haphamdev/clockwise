import { ErrorCode } from "../../common/exceptions/error-codes";
import { AuditLogService } from "../audit-log/audit-log.service";
import { UserWithTeams } from "./entities/user.entity";
import { UsersRepository } from "./users.repository";
import { UsersService } from "./users.service";

function makeUser(overrides?: Partial<UserWithTeams>): UserWithTeams {
  return {
    id: "user-1",
    orgId: "org-1",
    email: "alice@example.com",
    name: "Alice",
    avatarUrl: null,
    isAdmin: false,
    status: "active",
    lastLoginAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    teamMemberships: [
      {
        teamId: "team-1",
        teamName: "Engineering",
        role: "member",
        isArchived: false,
      },
    ],
    ...overrides,
  };
}

describe("UsersService", () => {
  let service: UsersService;
  let repo: jest.Mocked<UsersRepository>;
  let auditLogService: jest.Mocked<AuditLogService>;

  beforeEach(() => {
    repo = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      createPendingUser: jest.fn(),
      findByIdWithRefreshToken: jest.fn(),
      updateRefreshToken: jest.fn(),
      activateUser: jest.fn(),
      updateLastLogin: jest.fn(),
      countActiveAdmins: jest.fn(),
      updateIsAdmin: jest.fn(),
      deactivateUser: jest.fn(),
      reactivateUser: jest.fn(),
      replaceTeamAssignments: jest.fn(),
      countValidTeams: jest.fn(),
      findTeamsWhereOnlyManager: jest.fn(),
      findTeamNames: jest.fn(),
      countManagerRelationship: jest.fn(),
    } as unknown as jest.Mocked<UsersRepository>;

    auditLogService = {
      log: jest.fn(),
      logMany: jest.fn(),
    } as unknown as jest.Mocked<AuditLogService>;

    service = new UsersService(repo, auditLogService);
  });

  describe("findAll", () => {
    it("should return paginated users", async () => {
      const result = { data: [makeUser()], total: 1 };
      repo.findAll.mockResolvedValue(result);

      const res = await service.findAll("org-1", { page: 1, limit: 20 });
      expect(res).toEqual(result);
    });
  });

  describe("getUserDetail", () => {
    it("should return user", async () => {
      repo.findById.mockResolvedValue(makeUser());
      const res = await service.getUserDetail("user-1", "org-1");
      expect(res.id).toBe("user-1");
    });

    it("should throw NOT_FOUND for wrong org", async () => {
      repo.findById.mockResolvedValue(makeUser({ orgId: "other-org" }));
      await expect(service.getUserDetail("user-1", "org-1")).rejects.toThrow(
        expect.objectContaining({ code: ErrorCode.USER.NOT_FOUND }),
      );
    });

    it("should throw NOT_FOUND for nonexistent user", async () => {
      repo.findById.mockResolvedValue(null);
      await expect(service.getUserDetail("bad", "org-1")).rejects.toThrow(
        expect.objectContaining({ code: ErrorCode.USER.NOT_FOUND }),
      );
    });
  });

  describe("updateUser", () => {
    it("should promote to admin", async () => {
      repo.findById
        .mockResolvedValueOnce(makeUser({ isAdmin: false }))
        .mockResolvedValueOnce(makeUser({ isAdmin: true }));
      repo.updateIsAdmin.mockResolvedValue(undefined);

      const res = await service.updateUser("admin-1", "user-1", "org-1", {
        isAdmin: true,
      });
      expect(repo.updateIsAdmin).toHaveBeenCalledWith("user-1", true);
      expect(res.isAdmin).toBe(true);
    });

    it("should throw LAST_ADMIN when demoting last admin", async () => {
      repo.findById.mockResolvedValue(makeUser({ isAdmin: true }));
      repo.countActiveAdmins.mockResolvedValue(1);

      await expect(
        service.updateUser("other-admin", "user-1", "org-1", {
          isAdmin: false,
        }),
      ).rejects.toThrow(
        expect.objectContaining({ code: ErrorCode.USER.LAST_ADMIN }),
      );
    });

    it("should throw CANNOT_MODIFY_SELF when demoting self from admin", async () => {
      repo.findById.mockResolvedValue(
        makeUser({ id: "admin-1", isAdmin: true }),
      );

      await expect(
        service.updateUser("admin-1", "admin-1", "org-1", { isAdmin: false }),
      ).rejects.toThrow(
        expect.objectContaining({ code: ErrorCode.USER.CANNOT_MODIFY_SELF }),
      );
    });

    it("should replace team assignments after validation", async () => {
      repo.findById.mockResolvedValue(makeUser());
      repo.countValidTeams.mockResolvedValue(1);
      repo.findTeamsWhereOnlyManager.mockResolvedValue([]);
      repo.findTeamNames.mockResolvedValue(new Map([["team-2", "Design"]]));
      repo.replaceTeamAssignments.mockResolvedValue(undefined);

      const assignments = [{ teamId: "team-2", role: "manager" as const }];
      await service.updateUser("admin-1", "user-1", "org-1", {
        teamAssignments: assignments,
      });
      expect(repo.countValidTeams).toHaveBeenCalledWith("org-1", ["team-2"]);
      expect(repo.replaceTeamAssignments).toHaveBeenCalledWith(
        "user-1",
        assignments,
      );
    });

    it("should throw INVALID_TEAM_ASSIGNMENT for invalid teamId", async () => {
      repo.findById.mockResolvedValue(makeUser());
      repo.countValidTeams.mockResolvedValue(0);

      await expect(
        service.updateUser("admin-1", "user-1", "org-1", {
          teamAssignments: [{ teamId: "bad-team", role: "member" }],
        }),
      ).rejects.toThrow(
        expect.objectContaining({
          code: ErrorCode.USER.INVALID_TEAM_ASSIGNMENT,
        }),
      );
    });

    it("should throw WOULD_ORPHAN_TEAM when removing sole manager", async () => {
      repo.findById.mockResolvedValue(makeUser());
      repo.countValidTeams.mockResolvedValue(1);
      repo.findTeamsWhereOnlyManager.mockResolvedValue(["team-1"]);

      await expect(
        service.updateUser("admin-1", "user-1", "org-1", {
          teamAssignments: [{ teamId: "team-2", role: "member" }],
        }),
      ).rejects.toThrow(
        expect.objectContaining({ code: ErrorCode.USER.WOULD_ORPHAN_TEAM }),
      );
    });

    it("should allow reassignment if user remains manager on solo-managed team", async () => {
      repo.findById.mockResolvedValue(makeUser());
      repo.countValidTeams.mockResolvedValue(2);
      repo.findTeamsWhereOnlyManager.mockResolvedValue(["team-1"]);
      repo.findTeamNames.mockResolvedValue(new Map([["team-2", "Design"]]));
      repo.replaceTeamAssignments.mockResolvedValue(undefined);

      await service.updateUser("admin-1", "user-1", "org-1", {
        teamAssignments: [
          { teamId: "team-1", role: "manager" },
          { teamId: "team-2", role: "member" },
        ],
      });
      expect(repo.replaceTeamAssignments).toHaveBeenCalled();
    });

    it("should update both isAdmin and teamAssignments together", async () => {
      repo.findById
        .mockResolvedValueOnce(makeUser({ isAdmin: false }))
        .mockResolvedValueOnce(makeUser({ isAdmin: true }));
      repo.updateIsAdmin.mockResolvedValue(undefined);
      repo.countValidTeams.mockResolvedValue(1);
      repo.findTeamsWhereOnlyManager.mockResolvedValue([]);
      repo.replaceTeamAssignments.mockResolvedValue(undefined);

      await service.updateUser("admin-1", "user-1", "org-1", {
        isAdmin: true,
        teamAssignments: [{ teamId: "team-1", role: "manager" }],
      });
      expect(repo.updateIsAdmin).toHaveBeenCalled();
      expect(repo.replaceTeamAssignments).toHaveBeenCalled();
    });
  });

  describe("canViewUserDetails", () => {
    it("should allow admin", async () => {
      const result = await service.canViewUserDetails(
        "admin-1",
        true,
        "user-2",
      );
      expect(result).toBe(true);
      expect(repo.countManagerRelationship).not.toHaveBeenCalled();
    });

    it("should allow self", async () => {
      const result = await service.canViewUserDetails(
        "user-1",
        false,
        "user-1",
      );
      expect(result).toBe(true);
      expect(repo.countManagerRelationship).not.toHaveBeenCalled();
    });

    it("should allow manager of shared team", async () => {
      repo.countManagerRelationship.mockResolvedValue(1);
      const result = await service.canViewUserDetails(
        "manager-1",
        false,
        "user-2",
      );
      expect(result).toBe(true);
      expect(repo.countManagerRelationship).toHaveBeenCalledWith(
        "manager-1",
        "user-2",
      );
    });

    it("should deny non-manager for unrelated user", async () => {
      repo.countManagerRelationship.mockResolvedValue(0);
      const result = await service.canViewUserDetails(
        "user-1",
        false,
        "user-2",
      );
      expect(result).toBe(false);
    });
  });

  describe("deactivateUser", () => {
    it("should deactivate active user", async () => {
      repo.findById.mockResolvedValue(makeUser({ status: "active" }));
      repo.deactivateUser.mockResolvedValue(undefined);

      await service.deactivateUser("admin-1", "user-1", "org-1");
      expect(repo.deactivateUser).toHaveBeenCalledWith("user-1");
    });

    it("should throw CANNOT_MODIFY_SELF", async () => {
      await expect(
        service.deactivateUser("user-1", "user-1", "org-1"),
      ).rejects.toThrow(
        expect.objectContaining({ code: ErrorCode.USER.CANNOT_MODIFY_SELF }),
      );
    });

    it("should throw ALREADY_DEACTIVATED for deactivated user", async () => {
      repo.findById.mockResolvedValue(makeUser({ status: "deactivated" }));

      await expect(
        service.deactivateUser("admin-1", "user-1", "org-1"),
      ).rejects.toThrow(
        expect.objectContaining({ code: ErrorCode.USER.ALREADY_DEACTIVATED }),
      );
    });

    it("should throw ALREADY_DEACTIVATED for pending user", async () => {
      repo.findById.mockResolvedValue(makeUser({ status: "pending" }));

      await expect(
        service.deactivateUser("admin-1", "user-1", "org-1"),
      ).rejects.toThrow(
        expect.objectContaining({ code: ErrorCode.USER.ALREADY_DEACTIVATED }),
      );
    });

    it("should throw LAST_ADMIN when deactivating last admin", async () => {
      repo.findById.mockResolvedValue(makeUser({ isAdmin: true }));
      repo.countActiveAdmins.mockResolvedValue(1);

      await expect(
        service.deactivateUser("admin-2", "user-1", "org-1"),
      ).rejects.toThrow(
        expect.objectContaining({ code: ErrorCode.USER.LAST_ADMIN }),
      );
    });
  });

  describe("reactivateUser", () => {
    it("should reactivate deactivated user", async () => {
      repo.findById.mockResolvedValue(makeUser({ status: "deactivated" }));
      repo.reactivateUser.mockResolvedValue(undefined);

      await service.reactivateUser("user-1", "org-1", "admin-1");
      expect(repo.reactivateUser).toHaveBeenCalledWith("user-1");
    });

    it("should throw NOT_DEACTIVATED for active user", async () => {
      repo.findById.mockResolvedValue(makeUser({ status: "active" }));

      await expect(
        service.reactivateUser("user-1", "org-1", "admin-1"),
      ).rejects.toThrow(
        expect.objectContaining({ code: ErrorCode.USER.NOT_DEACTIVATED }),
      );
    });

    it("should throw NOT_DEACTIVATED for pending user", async () => {
      repo.findById.mockResolvedValue(makeUser({ status: "pending" }));

      await expect(
        service.reactivateUser("user-1", "org-1", "admin-1"),
      ).rejects.toThrow(
        expect.objectContaining({ code: ErrorCode.USER.NOT_DEACTIVATED }),
      );
    });
  });
});
