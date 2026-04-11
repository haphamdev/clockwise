import { ErrorCode } from "../../common/exceptions/error-codes";
import { ProjectsService } from "../projects/projects.service";
import { TaskEntity } from "./entities/task.entity";
import { TasksRepository } from "./tasks.repository";
import { TasksService } from "./tasks.service";

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

describe("TasksService", () => {
  let service: TasksService;
  let repo: jest.Mocked<TasksRepository>;
  let projectsService: jest.Mocked<ProjectsService>;

  beforeEach(() => {
    repo = {
      findByLabel: jest.fn(),
      create: jest.fn(),
      search: jest.fn(),
    } as unknown as jest.Mocked<TasksRepository>;

    projectsService = {
      findById: jest.fn(),
      validateProjectAccess: jest.fn(),
    } as unknown as jest.Mocked<ProjectsService>;

    service = new TasksService(repo, projectsService);
  });

  describe("findOrCreate", () => {
    it("should return existing task when label matches", async () => {
      const existing = makeTask();
      repo.findByLabel.mockResolvedValue(existing);

      const result = await service.findOrCreate(
        "project-1",
        "JIRA-123",
        "user-1",
      );

      expect(result).toEqual(existing);
      expect(repo.findByLabel).toHaveBeenCalledWith("project-1", "jira-123");
      expect(repo.create).not.toHaveBeenCalled();
    });

    it("should create new task when label does not exist", async () => {
      const newTask = makeTask({
        label: "NEW-TASK",
        labelNormalized: "new-task",
      });
      repo.findByLabel.mockResolvedValue(null);
      repo.create.mockResolvedValue(newTask);

      const result = await service.findOrCreate(
        "project-1",
        "NEW-TASK",
        "user-1",
      );

      expect(result).toEqual(newTask);
      expect(repo.create).toHaveBeenCalledWith({
        projectId: "project-1",
        label: "NEW-TASK",
        labelNormalized: "new-task",
        createdBy: "user-1",
      });
    });

    it("should handle case-insensitive matching", async () => {
      const existing = makeTask();
      repo.findByLabel.mockResolvedValue(existing);

      await service.findOrCreate("project-1", "  Jira-123  ", "user-1");

      expect(repo.findByLabel).toHaveBeenCalledWith("project-1", "jira-123");
    });

    it("should handle P2002 race condition by returning existing task", async () => {
      const existing = makeTask();
      repo.findByLabel.mockResolvedValueOnce(null);
      repo.create.mockRejectedValue({ code: "P2002" });
      repo.findByLabel.mockResolvedValueOnce(existing);

      const result = await service.findOrCreate(
        "project-1",
        "JIRA-123",
        "user-1",
      );

      expect(result).toEqual(existing);
    });

    it("should throw TASK_NOT_FOUND when P2002 retry also returns null", async () => {
      repo.findByLabel.mockResolvedValueOnce(null);
      repo.create.mockRejectedValue({ code: "P2002" });
      repo.findByLabel.mockResolvedValueOnce(null);

      await expect(
        service.findOrCreate("project-1", "JIRA-123", "user-1"),
      ).rejects.toThrow(
        expect.objectContaining({ code: ErrorCode.TASK.NOT_FOUND }),
      );
    });

    it("should throw TASK_INVALID_LABEL for empty label", async () => {
      await expect(
        service.findOrCreate("project-1", "", "user-1"),
      ).rejects.toThrow(
        expect.objectContaining({ code: ErrorCode.TASK.INVALID_LABEL }),
      );

      expect(repo.findByLabel).not.toHaveBeenCalled();
      expect(repo.create).not.toHaveBeenCalled();
    });

    it("should throw TASK_INVALID_LABEL for whitespace-only label", async () => {
      await expect(
        service.findOrCreate("project-1", "   ", "user-1"),
      ).rejects.toThrow(
        expect.objectContaining({ code: ErrorCode.TASK.INVALID_LABEL }),
      );
    });
  });

  describe("search", () => {
    it("should validate project access and return results", async () => {
      projectsService.validateProjectAccess.mockResolvedValue(undefined);
      const tasks = [makeTask()];
      repo.search.mockResolvedValue({ data: tasks, total: 1 });

      const result = await service.search(
        "project-1",
        "org-1",
        "user-1",
        false,
        {
          q: "JIRA",
          page: 1,
          limit: 10,
        },
      );

      expect(result).toEqual({ data: tasks, total: 1 });
      expect(projectsService.validateProjectAccess).toHaveBeenCalledWith(
        "project-1",
        "org-1",
        "user-1",
        false,
      );
      expect(repo.search).toHaveBeenCalledWith("project-1", {
        q: "JIRA",
        page: 1,
        limit: 10,
      });
    });

    it("should search without query filter", async () => {
      projectsService.validateProjectAccess.mockResolvedValue(undefined);
      repo.search.mockResolvedValue({ data: [], total: 0 });

      await service.search("project-1", "org-1", "user-1", true, {
        page: 1,
        limit: 10,
      });

      expect(repo.search).toHaveBeenCalledWith("project-1", {
        q: undefined,
        page: 1,
        limit: 10,
      });
    });

    it("should propagate PROJECT_NOT_FOUND from validateProjectAccess", async () => {
      const { ProjectNotFoundException } = await import(
        "../../common/exceptions/project.exceptions"
      );
      projectsService.validateProjectAccess.mockRejectedValue(
        new ProjectNotFoundException(),
      );

      await expect(
        service.search("bad-project", "org-1", "user-1", false, {
          page: 1,
          limit: 10,
        }),
      ).rejects.toThrow(
        expect.objectContaining({ code: ErrorCode.PROJECT.NOT_FOUND }),
      );
    });
  });
});
