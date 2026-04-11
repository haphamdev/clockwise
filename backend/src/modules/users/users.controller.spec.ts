import { UserNotFoundException } from "../../common/exceptions/user.exceptions";
import { ProjectListItem } from "../projects/entities/project.entity";
import { UserEntity, UserWithTeams } from "./entities/user.entity";
import { UsersController } from "./users.controller";
import { UsersService } from "./users.service";

function makeAdmin(overrides?: Partial<UserEntity>): UserEntity {
  return {
    id: "admin-1",
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

function makeUserWithTeams(overrides?: Partial<UserWithTeams>): UserWithTeams {
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

function makeProjectListItem(
  overrides?: Partial<ProjectListItem>,
): ProjectListItem {
  return {
    id: "proj-1",
    orgId: "org-1",
    name: "Project Alpha",
    description: null,
    status: "active",
    teamCount: 2,
    teamIds: ["team-1", "team-2"],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe("UsersController", () => {
  let controller: UsersController;
  let service: jest.Mocked<UsersService>;

  beforeEach(() => {
    service = {
      findAll: jest.fn(),
      getUserDetail: jest.fn(),
      updateUser: jest.fn(),
      deactivateUser: jest.fn(),
      reactivateUser: jest.fn(),
      canViewUserDetails: jest.fn(),
      findProjectsForUser: jest.fn(),
    } as unknown as jest.Mocked<UsersService>;

    controller = new UsersController(service);
  });

  describe("list", () => {
    it("should return paginated users", async () => {
      service.findAll.mockResolvedValue({
        data: [makeUserWithTeams()],
        total: 1,
      });

      const result = await controller.list(makeAdmin(), { page: 1, limit: 20 });
      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.data[0].teamMemberships).toHaveLength(1);
    });

    it("should pass filters to service", async () => {
      service.findAll.mockResolvedValue({ data: [], total: 0 });

      await controller.list(makeAdmin(), {
        page: 1,
        limit: 20,
        search: "alice",
        status: "active",
        teamId: "team-1",
      });
      expect(service.findAll).toHaveBeenCalledWith("org-1", {
        page: 1,
        limit: 20,
        search: "alice",
        status: "active",
        teamId: "team-1",
      });
    });
  });

  describe("findOne", () => {
    it("should return user detail", async () => {
      service.getUserDetail.mockResolvedValue(makeUserWithTeams());

      const result = await controller.findOne("user-1", makeAdmin());
      expect(result.email).toBe("alice@example.com");
      expect(service.getUserDetail).toHaveBeenCalledWith("user-1", "org-1");
    });
  });

  describe("update", () => {
    it("should pass adminId, userId, orgId, and dto", async () => {
      service.updateUser.mockResolvedValue(
        makeUserWithTeams({ isAdmin: true }),
      );

      const admin = makeAdmin();
      const result = await controller.update("user-1", admin, {
        isAdmin: true,
      });
      expect(result.isAdmin).toBe(true);
      expect(service.updateUser).toHaveBeenCalledWith(
        "admin-1",
        "user-1",
        "org-1",
        {
          isAdmin: true,
        },
      );
    });
  });

  describe("deactivate", () => {
    it("should pass adminId and orgId", async () => {
      service.deactivateUser.mockResolvedValue(undefined);

      const result = await controller.deactivate("user-1", makeAdmin());
      expect(result.message).toBe("User deactivated");
      expect(service.deactivateUser).toHaveBeenCalledWith(
        "admin-1",
        "user-1",
        "org-1",
      );
    });
  });

  describe("reactivate", () => {
    it("should pass orgId", async () => {
      service.reactivateUser.mockResolvedValue(undefined);

      const result = await controller.reactivate("user-1", makeAdmin());
      expect(result.message).toBe("User reactivated");
      expect(service.reactivateUser).toHaveBeenCalledWith(
        "user-1",
        "org-1",
        "admin-1",
      );
    });
  });

  describe("listUserProjects", () => {
    it("should return paginated projects for admin", async () => {
      service.canViewUserDetails.mockResolvedValue(true);
      service.getUserDetail.mockResolvedValue(makeUserWithTeams());
      service.findProjectsForUser.mockResolvedValue({
        data: [
          makeProjectListItem(),
          makeProjectListItem({ id: "proj-2", name: "Project Beta" }),
        ],
        total: 2,
      });

      const result = await controller.listUserProjects("user-1", makeAdmin(), {
        page: 1,
        limit: 5,
      });

      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(5);
      expect(service.canViewUserDetails).toHaveBeenCalledWith(
        "admin-1",
        true,
        "user-1",
      );
      expect(service.getUserDetail).toHaveBeenCalledWith("user-1", "org-1");
    });

    it("should allow manager to view managed member projects", async () => {
      const manager = makeAdmin({ id: "manager-1", isAdmin: false });
      service.canViewUserDetails.mockResolvedValue(true);
      service.getUserDetail.mockResolvedValue(makeUserWithTeams());
      service.findProjectsForUser.mockResolvedValue({
        data: [makeProjectListItem()],
        total: 1,
      });

      const result = await controller.listUserProjects("user-1", manager, {});

      expect(result.data).toHaveLength(1);
      expect(service.canViewUserDetails).toHaveBeenCalledWith(
        "manager-1",
        false,
        "user-1",
      );
    });

    it("should throw NOT_FOUND when member tries to view another user projects", async () => {
      const member = makeAdmin({ id: "member-1", isAdmin: false });
      service.canViewUserDetails.mockResolvedValue(false);

      await expect(
        controller.listUserProjects("user-1", member, {}),
      ).rejects.toThrow(UserNotFoundException);
    });

    it("should pass includeArchived param to service", async () => {
      service.canViewUserDetails.mockResolvedValue(true);
      service.getUserDetail.mockResolvedValue(makeUserWithTeams());
      service.findProjectsForUser.mockResolvedValue({
        data: [],
        total: 0,
      });

      await controller.listUserProjects("user-1", makeAdmin(), {
        page: 1,
        limit: 10,
        includeArchived: true,
      });

      expect(service.findProjectsForUser).toHaveBeenCalledWith(
        "org-1",
        "user-1",
        {
          includeArchived: true,
          page: 1,
          limit: 10,
        },
      );
    });

    it("should default includeArchived to false", async () => {
      service.canViewUserDetails.mockResolvedValue(true);
      service.getUserDetail.mockResolvedValue(makeUserWithTeams());
      service.findProjectsForUser.mockResolvedValue({
        data: [],
        total: 0,
      });

      await controller.listUserProjects("user-1", makeAdmin(), {});

      expect(service.findProjectsForUser).toHaveBeenCalledWith(
        "org-1",
        "user-1",
        {
          includeArchived: false,
          page: 1,
          limit: 20,
        },
      );
    });

    it("should throw 404 if user not found", async () => {
      service.canViewUserDetails.mockResolvedValue(true);
      service.getUserDetail.mockRejectedValue(new UserNotFoundException());

      await expect(
        controller.listUserProjects("nonexistent", makeAdmin(), {}),
      ).rejects.toThrow(UserNotFoundException);
    });
  });
});
