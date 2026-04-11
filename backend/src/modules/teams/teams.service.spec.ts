import { ErrorCode } from "../../common/exceptions/error-codes";
import { AuditLogService } from "../audit-log/audit-log.service";
import { UserWithTeams } from "../users/entities/user.entity";
import { UsersService } from "../users/users.service";
import {
  TeamEntity,
  TeamListItem,
  TeamWithMembers,
} from "./entities/team.entity";
import { TeamsRepository } from "./teams.repository";
import { TeamsService } from "./teams.service";

function makeTeam(overrides?: Partial<TeamEntity>): TeamEntity {
  return {
    id: "team-1",
    orgId: "org-1",
    name: "Engineering",
    description: null,
    isArchived: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function makeTeamListItem(overrides?: Partial<TeamListItem>): TeamListItem {
  return {
    ...makeTeam(overrides),
    memberCount: 3,
    ...overrides,
  };
}

function makeTeamWithMembers(
  overrides?: Partial<TeamWithMembers>,
): TeamWithMembers {
  return {
    ...makeTeam(overrides),
    members: [
      {
        id: "tm-1",
        userId: "user-1",
        userName: "Alice",
        userEmail: "alice@example.com",
        userStatus: "active",
        role: "manager",
        createdAt: new Date(),
      },
      {
        id: "tm-2",
        userId: "user-2",
        userName: "Bob",
        userEmail: "bob@example.com",
        userStatus: "active",
        role: "member",
        createdAt: new Date(),
      },
    ],
    ...overrides,
  };
}

function makeUserWithTeams(overrides?: Partial<UserWithTeams>): UserWithTeams {
  return {
    id: "user-3",
    orgId: "org-1",
    email: "charlie@example.com",
    name: "Charlie",
    avatarUrl: null,
    isAdmin: false,
    status: "active",
    lastLoginAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    teamMemberships: [],
    ...overrides,
  };
}

describe("TeamsService", () => {
  let service: TeamsService;
  let repo: jest.Mocked<TeamsRepository>;
  let usersService: jest.Mocked<UsersService>;
  let auditLogService: jest.Mocked<AuditLogService>;

  beforeEach(() => {
    repo = {
      findAll: jest.fn(),
      findAllForUser: jest.fn(),
      findById: jest.fn(),
      findEntityById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      archive: jest.fn(),
      unarchive: jest.fn(),
      addMember: jest.fn(),
      findMember: jest.fn(),
      updateMemberRole: jest.fn(),
      removeMember: jest.fn(),
      countManagers: jest.fn(),
    } as unknown as jest.Mocked<TeamsRepository>;

    usersService = {
      findById: jest.fn(),
    } as unknown as jest.Mocked<UsersService>;

    auditLogService = {
      log: jest.fn(),
      logMany: jest.fn(),
    } as unknown as jest.Mocked<AuditLogService>;

    service = new TeamsService(repo, usersService, auditLogService);
  });

  describe("findAll", () => {
    const opts = { includeArchived: false, page: 1, limit: 20 };

    it("should return all teams for admin", async () => {
      const result = { data: [makeTeamListItem()], total: 1 };
      repo.findAll.mockResolvedValue(result);

      const res = await service.findAll("org-1", "user-1", true, opts);
      expect(res).toEqual(result);
      expect(repo.findAll).toHaveBeenCalledWith("org-1", opts);
    });

    it("should return only user teams for non-admin", async () => {
      const result = { data: [makeTeamListItem()], total: 1 };
      repo.findAllForUser.mockResolvedValue(result);

      const res = await service.findAll("org-1", "user-1", false, opts);
      expect(res).toEqual(result);
      expect(repo.findAllForUser).toHaveBeenCalledWith("org-1", "user-1", {
        page: 1,
        limit: 20,
      });
    });

    it("should pass includeArchived to repo for admin", async () => {
      repo.findAll.mockResolvedValue({ data: [], total: 0 });
      const archivedOpts = { includeArchived: true, page: 1, limit: 20 };

      await service.findAll("org-1", "user-1", true, archivedOpts);
      expect(repo.findAll).toHaveBeenCalledWith("org-1", archivedOpts);
    });
  });

  describe("findById", () => {
    it("should return team for admin", async () => {
      const team = makeTeamWithMembers();
      repo.findById.mockResolvedValue(team);

      const res = await service.findById("team-1", "admin-user", true);
      expect(res).toEqual(team);
    });

    it("should return team for member", async () => {
      const team = makeTeamWithMembers();
      repo.findById.mockResolvedValue(team);

      const res = await service.findById("team-1", "user-1", false);
      expect(res).toEqual(team);
    });

    it("should throw NOT_FOUND if team does not exist", async () => {
      repo.findById.mockResolvedValue(null);

      await expect(service.findById("bad-id", "user-1", false)).rejects.toThrow(
        expect.objectContaining({ code: ErrorCode.TEAM.NOT_FOUND }),
      );
    });

    it("should throw NOT_A_MEMBER for non-member non-admin", async () => {
      const team = makeTeamWithMembers();
      repo.findById.mockResolvedValue(team);

      await expect(
        service.findById("team-1", "outsider", false),
      ).rejects.toThrow(
        expect.objectContaining({ code: ErrorCode.TEAM.NOT_A_MEMBER }),
      );
    });
  });

  describe("create", () => {
    it("should create a team", async () => {
      const team = makeTeam();
      repo.create.mockResolvedValue(team);

      const res = await service.create(
        "org-1",
        { name: "Engineering" },
        "admin-1",
      );
      expect(res).toEqual(team);
      expect(repo.create).toHaveBeenCalledWith({
        orgId: "org-1",
        name: "Engineering",
      });
    });

    it("should propagate ALREADY_EXISTS from repository on duplicate name", async () => {
      const { TeamAlreadyExistsException } = await import(
        "../../common/exceptions/team.exceptions"
      );
      repo.create.mockRejectedValue(new TeamAlreadyExistsException());

      await expect(
        service.create("org-1", { name: "Engineering" }, "admin-1"),
      ).rejects.toThrow(
        expect.objectContaining({ code: ErrorCode.TEAM.ALREADY_EXISTS }),
      );
    });
  });

  describe("update", () => {
    it("should update team", async () => {
      repo.findEntityById.mockResolvedValue(makeTeam());
      const updated = makeTeam({ name: "Platform" });
      repo.update.mockResolvedValue(updated);

      const res = await service.update(
        "team-1",
        "org-1",
        { name: "Platform" },
        "admin-1",
      );
      expect(res).toEqual(updated);
    });

    it("should throw ARCHIVED for archived team", async () => {
      repo.findEntityById.mockResolvedValue(makeTeam({ isArchived: true }));

      await expect(
        service.update("team-1", "org-1", { name: "New" }, "admin-1"),
      ).rejects.toThrow(
        expect.objectContaining({ code: ErrorCode.TEAM.ARCHIVED }),
      );
    });

    it("should propagate ALREADY_EXISTS from repository on duplicate name", async () => {
      const { TeamAlreadyExistsException } = await import(
        "../../common/exceptions/team.exceptions"
      );
      repo.findEntityById.mockResolvedValue(makeTeam());
      repo.update.mockRejectedValue(new TeamAlreadyExistsException());

      await expect(
        service.update("team-1", "org-1", { name: "Taken" }, "admin-1"),
      ).rejects.toThrow(
        expect.objectContaining({ code: ErrorCode.TEAM.ALREADY_EXISTS }),
      );
    });

    it("should throw NOT_FOUND for team in different org", async () => {
      repo.findEntityById.mockResolvedValue(makeTeam({ orgId: "other-org" }));

      await expect(
        service.update("team-1", "org-1", { name: "New" }, "admin-1"),
      ).rejects.toThrow(
        expect.objectContaining({ code: ErrorCode.TEAM.NOT_FOUND }),
      );
    });
  });

  describe("archive", () => {
    it("should archive team", async () => {
      repo.findEntityById.mockResolvedValue(makeTeam());
      const archived = makeTeam({ isArchived: true });
      repo.archive.mockResolvedValue(archived);

      const res = await service.archive("team-1", "org-1", "admin-1");
      expect(res.isArchived).toBe(true);
    });

    it("should throw ARCHIVED if already archived", async () => {
      repo.findEntityById.mockResolvedValue(makeTeam({ isArchived: true }));

      await expect(
        service.archive("team-1", "org-1", "admin-1"),
      ).rejects.toThrow(
        expect.objectContaining({ code: ErrorCode.TEAM.ARCHIVED }),
      );
    });
  });

  describe("unarchive", () => {
    it("should unarchive an archived team", async () => {
      repo.findEntityById.mockResolvedValue(makeTeam({ isArchived: true }));
      const unarchived = makeTeam({ isArchived: false });
      repo.unarchive.mockResolvedValue(unarchived);

      const res = await service.unarchive("team-1", "org-1", "admin-1");
      expect(res.isArchived).toBe(false);
    });

    it("should throw NOT_ARCHIVED if team is not archived", async () => {
      repo.findEntityById.mockResolvedValue(makeTeam({ isArchived: false }));

      await expect(
        service.unarchive("team-1", "org-1", "admin-1"),
      ).rejects.toThrow(
        expect.objectContaining({ code: ErrorCode.TEAM.NOT_ARCHIVED }),
      );
    });

    it("should throw NOT_FOUND for team in different org", async () => {
      repo.findEntityById.mockResolvedValue(makeTeam({ orgId: "other-org" }));

      await expect(
        service.unarchive("team-1", "org-1", "admin-1"),
      ).rejects.toThrow(
        expect.objectContaining({ code: ErrorCode.TEAM.NOT_FOUND }),
      );
    });
  });

  describe("addMember", () => {
    it("should add member", async () => {
      repo.findEntityById.mockResolvedValue(makeTeam());
      usersService.findById.mockResolvedValue(makeUserWithTeams());
      repo.findMember.mockResolvedValue(null);
      const member = {
        id: "tm-3",
        userId: "user-3",
        userName: "Charlie",
        userEmail: "charlie@example.com",
        userStatus: "active",
        role: "member" as const,
        createdAt: new Date(),
      };
      repo.addMember.mockResolvedValue(member);

      const res = await service.addMember(
        "team-1",
        "org-1",
        "user-3",
        "member",
        "admin-1",
      );
      expect(res).toEqual(member);
    });

    it("should throw USER_NOT_FOUND for nonexistent user", async () => {
      repo.findEntityById.mockResolvedValue(makeTeam());
      usersService.findById.mockResolvedValue(null);

      await expect(
        service.addMember("team-1", "org-1", "bad-user", "member", "admin-1"),
      ).rejects.toThrow(
        expect.objectContaining({ code: ErrorCode.TEAM.USER_NOT_FOUND }),
      );
    });

    it("should throw USER_NOT_FOUND for user in different org", async () => {
      repo.findEntityById.mockResolvedValue(makeTeam());
      usersService.findById.mockResolvedValue(
        makeUserWithTeams({ orgId: "other-org" }),
      );

      await expect(
        service.addMember("team-1", "org-1", "user-3", "member", "admin-1"),
      ).rejects.toThrow(
        expect.objectContaining({ code: ErrorCode.TEAM.USER_NOT_FOUND }),
      );
    });

    it("should throw USER_NOT_FOUND for deactivated user", async () => {
      repo.findEntityById.mockResolvedValue(makeTeam());
      usersService.findById.mockResolvedValue(
        makeUserWithTeams({ status: "deactivated" }),
      );

      await expect(
        service.addMember("team-1", "org-1", "user-3", "member", "admin-1"),
      ).rejects.toThrow(
        expect.objectContaining({ code: ErrorCode.TEAM.USER_NOT_FOUND }),
      );
    });

    it("should throw MEMBER_ALREADY_EXISTS", async () => {
      repo.findEntityById.mockResolvedValue(makeTeam());
      usersService.findById.mockResolvedValue(
        makeUserWithTeams({ id: "user-1" }),
      );
      repo.findMember.mockResolvedValue({
        id: "tm-1",
        userId: "user-1",
        userName: "Alice",
        userEmail: "alice@example.com",
        userStatus: "active",
        role: "manager",
        createdAt: new Date(),
      });

      await expect(
        service.addMember("team-1", "org-1", "user-1", "member", "admin-1"),
      ).rejects.toThrow(
        expect.objectContaining({ code: ErrorCode.TEAM.MEMBER_ALREADY_EXISTS }),
      );
    });

    it("should throw ARCHIVED for archived team", async () => {
      repo.findEntityById.mockResolvedValue(makeTeam({ isArchived: true }));

      await expect(
        service.addMember("team-1", "org-1", "user-3", "member", "admin-1"),
      ).rejects.toThrow(
        expect.objectContaining({ code: ErrorCode.TEAM.ARCHIVED }),
      );
    });
  });

  describe("updateMemberRole", () => {
    it("should update role", async () => {
      repo.findEntityById.mockResolvedValue(makeTeam());
      repo.findMember.mockResolvedValue({
        id: "tm-2",
        userId: "user-2",
        userName: "Bob",
        userEmail: "bob@example.com",
        userStatus: "active",
        role: "member",
        createdAt: new Date(),
      });
      const updated = {
        id: "tm-2",
        userId: "user-2",
        userName: "Bob",
        userEmail: "bob@example.com",
        userStatus: "active",
        role: "manager" as const,
        createdAt: new Date(),
      };
      repo.updateMemberRole.mockResolvedValue(updated);

      const res = await service.updateMemberRole(
        "team-1",
        "org-1",
        "user-2",
        "manager",
        "admin-1",
      );
      expect(res.role).toBe("manager");
    });

    it("should throw MEMBER_NOT_FOUND", async () => {
      repo.findEntityById.mockResolvedValue(makeTeam());
      repo.findMember.mockResolvedValue(null);

      await expect(
        service.updateMemberRole(
          "team-1",
          "org-1",
          "bad-user",
          "member",
          "admin-1",
        ),
      ).rejects.toThrow(
        expect.objectContaining({ code: ErrorCode.TEAM.MEMBER_NOT_FOUND }),
      );
    });

    it("should throw LAST_MANAGER when demoting the only manager", async () => {
      repo.findEntityById.mockResolvedValue(makeTeam());
      repo.findMember.mockResolvedValue({
        id: "tm-1",
        userId: "user-1",
        userName: "Alice",
        userEmail: "alice@example.com",
        userStatus: "active",
        role: "manager",
        createdAt: new Date(),
      });
      repo.countManagers.mockResolvedValue(1);

      await expect(
        service.updateMemberRole(
          "team-1",
          "org-1",
          "user-1",
          "member",
          "admin-1",
        ),
      ).rejects.toThrow(
        expect.objectContaining({ code: ErrorCode.TEAM.LAST_MANAGER }),
      );
    });
  });

  describe("removeMember", () => {
    it("should remove member", async () => {
      repo.findEntityById.mockResolvedValue(makeTeam());
      repo.findMember.mockResolvedValue({
        id: "tm-2",
        userId: "user-2",
        userName: "Bob",
        userEmail: "bob@example.com",
        userStatus: "active",
        role: "member",
        createdAt: new Date(),
      });
      repo.removeMember.mockResolvedValue(undefined);

      await service.removeMember("team-1", "org-1", "user-2", "admin-1");
      expect(repo.removeMember).toHaveBeenCalledWith("team-1", "user-2");
    });

    it("should throw MEMBER_NOT_FOUND", async () => {
      repo.findEntityById.mockResolvedValue(makeTeam());
      repo.findMember.mockResolvedValue(null);

      await expect(
        service.removeMember("team-1", "org-1", "bad-user", "admin-1"),
      ).rejects.toThrow(
        expect.objectContaining({ code: ErrorCode.TEAM.MEMBER_NOT_FOUND }),
      );
    });

    it("should throw LAST_MANAGER when removing the only manager", async () => {
      repo.findEntityById.mockResolvedValue(makeTeam());
      repo.findMember.mockResolvedValue({
        id: "tm-1",
        userId: "user-1",
        userName: "Alice",
        userEmail: "alice@example.com",
        userStatus: "active",
        role: "manager",
        createdAt: new Date(),
      });
      repo.countManagers.mockResolvedValue(1);

      await expect(
        service.removeMember("team-1", "org-1", "user-1", "admin-1"),
      ).rejects.toThrow(
        expect.objectContaining({ code: ErrorCode.TEAM.LAST_MANAGER }),
      );
    });
  });
});
