import { UserEntity } from "../users/entities/user.entity";
import {
  TeamEntity,
  TeamListItem,
  TeamWithMembers,
} from "./entities/team.entity";
import { TeamsController } from "./teams.controller";
import { TeamsService } from "./teams.service";

function makeUser(overrides?: Partial<UserEntity>): UserEntity {
  return {
    id: "user-1",
    orgId: "org-1",
    email: "admin@example.com",
    name: "Admin",
    avatarUrl: null,
    isAdmin: true,
    status: "active",
    lastLoginAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function makeTeamListItem(overrides?: Partial<TeamListItem>): TeamListItem {
  return {
    id: "team-1",
    orgId: "org-1",
    name: "Engineering",
    description: null,
    isArchived: false,
    memberCount: 3,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

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
    ],
    ...overrides,
  };
}

describe("TeamsController", () => {
  let controller: TeamsController;
  let service: jest.Mocked<TeamsService>;

  beforeEach(() => {
    service = {
      findAll: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      archive: jest.fn(),
      unarchive: jest.fn(),
      addMember: jest.fn(),
      updateMemberRole: jest.fn(),
      removeMember: jest.fn(),
    } as unknown as jest.Mocked<TeamsService>;

    controller = new TeamsController(service);
  });

  describe("list", () => {
    it("should return paginated team list", async () => {
      const items = [makeTeamListItem()];
      service.findAll.mockResolvedValue({ data: items, total: 1 });

      const user = makeUser();
      const result = await controller.list(user, {
        page: 1,
        limit: 20,
        includeArchived: false,
      });

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.data[0].memberCount).toBe(3);
      expect(service.findAll).toHaveBeenCalledWith("org-1", "user-1", true, {
        includeArchived: false,
        page: 1,
        limit: 20,
      });
    });
  });

  describe("create", () => {
    it("should create and return team with memberCount 0", async () => {
      const team = makeTeam();
      service.create.mockResolvedValue(team);

      const result = await controller.create(makeUser(), {
        name: "Engineering",
      });
      expect(result.name).toBe("Engineering");
      expect(result.memberCount).toBe(0);
      expect(service.create).toHaveBeenCalledWith(
        "org-1",
        { name: "Engineering" },
        "user-1",
      );
    });
  });

  describe("findOne", () => {
    it("should return team detail with members", async () => {
      const team = makeTeamWithMembers();
      service.findById.mockResolvedValue(team);

      const result = await controller.findOne("team-1", makeUser());
      expect(result.members).toHaveLength(1);
      expect(result.members[0].userName).toBe("Alice");
    });
  });

  describe("update", () => {
    it("should pass orgId to service", async () => {
      const team = makeTeam({ name: "Platform" });
      service.update.mockResolvedValue(team);

      const user = makeUser();
      await controller.update("team-1", user, { name: "Platform" });
      expect(service.update).toHaveBeenCalledWith(
        "team-1",
        "org-1",
        { name: "Platform" },
        "user-1",
      );
    });
  });

  describe("archive", () => {
    it("should pass orgId to service", async () => {
      const team = makeTeam({ isArchived: true });
      service.archive.mockResolvedValue(team);

      const user = makeUser();
      const result = await controller.archive("team-1", user);
      expect(result.isArchived).toBe(true);
      expect(service.archive).toHaveBeenCalledWith("team-1", "org-1", "user-1");
    });
  });

  describe("unarchive", () => {
    it("should pass orgId to service", async () => {
      const team = makeTeam({ isArchived: false });
      service.unarchive.mockResolvedValue(team);

      const user = makeUser();
      const result = await controller.unarchive("team-1", user);
      expect(result.isArchived).toBe(false);
      expect(service.unarchive).toHaveBeenCalledWith(
        "team-1",
        "org-1",
        "user-1",
      );
    });
  });

  describe("addMember", () => {
    it("should pass orgId to service", async () => {
      const member = {
        id: "tm-3",
        userId: "user-3",
        userName: "Charlie",
        userEmail: "charlie@example.com",
        userStatus: "active",
        role: "member" as const,
        createdAt: new Date(),
      };
      service.addMember.mockResolvedValue(member);

      const user = makeUser();
      const result = await controller.addMember("team-1", user, {
        userId: "user-3",
        role: "member",
      });
      expect(result.userName).toBe("Charlie");
      expect(service.addMember).toHaveBeenCalledWith(
        "team-1",
        "org-1",
        "user-3",
        "member",
        "user-1",
      );
    });
  });

  describe("updateMemberRole", () => {
    it("should pass orgId to service", async () => {
      const member = {
        id: "tm-1",
        userId: "user-1",
        userName: "Alice",
        userEmail: "alice@example.com",
        userStatus: "active",
        role: "manager" as const,
        createdAt: new Date(),
      };
      service.updateMemberRole.mockResolvedValue(member);

      const user = makeUser();
      await controller.updateMemberRole("team-1", "user-1", user, {
        role: "manager",
      });
      expect(service.updateMemberRole).toHaveBeenCalledWith(
        "team-1",
        "org-1",
        "user-1",
        "manager",
        "user-1",
      );
    });
  });

  describe("removeMember", () => {
    it("should pass orgId to service", async () => {
      service.removeMember.mockResolvedValue(undefined);

      const user = makeUser();
      const result = await controller.removeMember("team-1", "user-2", user);
      expect(result.message).toBe("Member removed");
      expect(service.removeMember).toHaveBeenCalledWith(
        "team-1",
        "org-1",
        "user-2",
        "user-1",
      );
    });
  });
});
