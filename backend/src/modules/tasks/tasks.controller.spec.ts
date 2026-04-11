import { UserEntity } from "../users/entities/user.entity";
import { TaskEntity } from "./entities/task.entity";
import { TasksController } from "./tasks.controller";
import { TasksService } from "./tasks.service";

function makeUser(overrides?: Partial<UserEntity>): UserEntity {
  return {
    id: "user-1",
    orgId: "org-1",
    email: "user@example.com",
    name: "Test User",
    avatarUrl: null,
    isAdmin: false,
    status: "active",
    lastLoginAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function makeTask(overrides?: Partial<TaskEntity>): TaskEntity {
  return {
    id: "task-1",
    projectId: "project-1",
    label: "JIRA-123",
    labelNormalized: "jira-123",
    description: null,
    createdBy: "user-1",
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe("TasksController", () => {
  let controller: TasksController;
  let service: jest.Mocked<TasksService>;

  beforeEach(() => {
    service = {
      search: jest.fn(),
      findOrCreate: jest.fn(),
    } as unknown as jest.Mocked<TasksService>;

    controller = new TasksController(service);
  });

  describe("list", () => {
    it("should pass projectId, orgId, userId, isAdmin to service", async () => {
      const tasks = [makeTask()];
      service.search.mockResolvedValue({ data: tasks, total: 1 });

      const user = makeUser();
      const result = await controller.list("project-1", user, {
        q: "JIRA",
        page: 1,
        limit: 10,
      });

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.data[0].id).toBe("task-1");
      expect(result.data[0].label).toBe("JIRA-123");
      expect(service.search).toHaveBeenCalledWith(
        "project-1",
        "org-1",
        "user-1",
        false,
        { q: "JIRA", page: 1, limit: 10 },
      );
    });

    it("should pass isAdmin=true for admin users", async () => {
      service.search.mockResolvedValue({ data: [], total: 0 });

      const user = makeUser({ isAdmin: true });
      await controller.list("project-1", user, { page: 1, limit: 10 });

      expect(service.search).toHaveBeenCalledWith(
        "project-1",
        "org-1",
        "user-1",
        true,
        { q: undefined, page: 1, limit: 10 },
      );
    });

    it("should map response to DTOs without labelNormalized or createdBy", async () => {
      const tasks = [makeTask({ description: "A task description" })];
      service.search.mockResolvedValue({ data: tasks, total: 1 });

      const user = makeUser();
      const result = await controller.list("project-1", user, {
        page: 1,
        limit: 10,
      });

      const dto = result.data[0];
      expect(dto).toHaveProperty("id");
      expect(dto).toHaveProperty("label");
      expect(dto).toHaveProperty("description", "A task description");
      expect(dto).not.toHaveProperty("labelNormalized");
      expect(dto).not.toHaveProperty("createdBy");
    });
  });
});
