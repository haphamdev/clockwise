import { ErrorCode } from "../../common/exceptions/error-codes";
import { AuditLogService } from "../audit-log/audit-log.service";
import { TeamsService } from "../teams/teams.service";
import { ProjectsRepository } from "./projects.repository";
import { ProjectsService } from "./projects.service";

describe("ProjectsService — Settings", () => {
  let service: ProjectsService;
  let repo: jest.Mocked<ProjectsRepository>;
  let teamsService: jest.Mocked<TeamsService>;
  let auditLogService: jest.Mocked<AuditLogService>;

  beforeEach(() => {
    repo = {
      findEntityById: jest.fn(),
      findSettings: jest.fn(),
      updateSettings: jest.fn(),
      isUserLinkedToProject: jest.fn(),
      isManagerOfLinkedTeam: jest.fn(),
    } as unknown as jest.Mocked<ProjectsRepository>;

    teamsService = {} as jest.Mocked<TeamsService>;

    auditLogService = {
      log: jest.fn(),
    } as unknown as jest.Mocked<AuditLogService>;

    service = new ProjectsService(repo, teamsService, auditLogService);
  });

  describe("getSettings", () => {
    it("should return settings for admin", async () => {
      repo.findEntityById.mockResolvedValue({
        id: "project-1",
        orgId: "org-1",
        name: "Test",
        description: null,
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      repo.findSettings.mockResolvedValue({
        dailyHourLimit: 10,
        weeklyHourLimit: 50,
      });

      const result = await service.getSettings(
        "project-1",
        "org-1",
        "admin-1",
        true,
      );

      expect(result).toEqual({ dailyHourLimit: 10, weeklyHourLimit: 50 });
    });

    it("should return settings for linked user", async () => {
      repo.findEntityById.mockResolvedValue({
        id: "project-1",
        orgId: "org-1",
        name: "Test",
        description: null,
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      repo.isUserLinkedToProject.mockResolvedValue(true);
      repo.findSettings.mockResolvedValue({
        dailyHourLimit: null,
        weeklyHourLimit: null,
      });

      const result = await service.getSettings(
        "project-1",
        "org-1",
        "user-1",
        false,
      );

      expect(result).toEqual({ dailyHourLimit: null, weeklyHourLimit: null });
    });

    it("should throw NOT_FOUND for non-linked user", async () => {
      repo.findEntityById.mockResolvedValue({
        id: "project-1",
        orgId: "org-1",
        name: "Test",
        description: null,
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      repo.isUserLinkedToProject.mockResolvedValue(false);

      await expect(
        service.getSettings("project-1", "org-1", "random-user", false),
      ).rejects.toThrow(
        expect.objectContaining({ code: ErrorCode.PROJECT.NOT_FOUND }),
      );
    });
  });

  describe("updateSettings", () => {
    beforeEach(() => {
      repo.findEntityById.mockResolvedValue({
        id: "project-1",
        orgId: "org-1",
        name: "Test",
        description: null,
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      repo.findSettings.mockResolvedValue({
        dailyHourLimit: null,
        weeklyHourLimit: null,
      });
    });

    it("should update settings for admin", async () => {
      repo.updateSettings.mockResolvedValue({
        dailyHourLimit: 10,
        weeklyHourLimit: 50,
      });

      const result = await service.updateSettings(
        "project-1",
        "org-1",
        { dailyHourLimit: 10, weeklyHourLimit: 50 },
        "admin-1",
        true,
      );

      expect(result).toEqual({ dailyHourLimit: 10, weeklyHourLimit: 50 });
      expect(repo.updateSettings).toHaveBeenCalledWith("project-1", {
        dailyHourLimit: 10,
        weeklyHourLimit: 50,
      });
    });

    it("should update settings for manager of linked team", async () => {
      repo.isManagerOfLinkedTeam.mockResolvedValue(true);
      repo.updateSettings.mockResolvedValue({
        dailyHourLimit: 8,
        weeklyHourLimit: null,
      });

      const result = await service.updateSettings(
        "project-1",
        "org-1",
        { dailyHourLimit: 8 },
        "manager-1",
        false,
      );

      expect(result.dailyHourLimit).toBe(8);
    });

    it("should throw INSUFFICIENT_ROLE for non-manager", async () => {
      repo.isManagerOfLinkedTeam.mockResolvedValue(false);

      await expect(
        service.updateSettings(
          "project-1",
          "org-1",
          { dailyHourLimit: 10 },
          "member-1",
          false,
        ),
      ).rejects.toThrow(
        expect.objectContaining({ code: ErrorCode.PROJECT.INSUFFICIENT_ROLE }),
      );
    });

    it("should throw ARCHIVED for archived project", async () => {
      repo.findEntityById.mockResolvedValue({
        id: "project-1",
        orgId: "org-1",
        name: "Test",
        description: null,
        status: "archived",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await expect(
        service.updateSettings(
          "project-1",
          "org-1",
          { dailyHourLimit: 10 },
          "admin-1",
          true,
        ),
      ).rejects.toThrow(
        expect.objectContaining({ code: ErrorCode.PROJECT.ARCHIVED }),
      );
    });

    it("should create audit log entry", async () => {
      repo.updateSettings.mockResolvedValue({
        dailyHourLimit: 10,
        weeklyHourLimit: null,
      });

      await service.updateSettings(
        "project-1",
        "org-1",
        { dailyHourLimit: 10 },
        "admin-1",
        true,
      );

      expect(auditLogService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          entityType: "project",
          entityId: "project-1",
          action: "settings_updated",
          metadata: {
            before: { dailyHourLimit: null, weeklyHourLimit: null },
            after: { dailyHourLimit: 10, weeklyHourLimit: null },
          },
        }),
      );
    });

    it("should allow clearing limits by passing null", async () => {
      repo.updateSettings.mockResolvedValue({
        dailyHourLimit: null,
        weeklyHourLimit: null,
      });

      const result = await service.updateSettings(
        "project-1",
        "org-1",
        { dailyHourLimit: null, weeklyHourLimit: null },
        "admin-1",
        true,
      );

      expect(result).toEqual({ dailyHourLimit: null, weeklyHourLimit: null });
    });
  });

  describe("getSettingsInternal", () => {
    it("should return settings without access check", async () => {
      repo.findSettings.mockResolvedValue({
        dailyHourLimit: 10,
        weeklyHourLimit: null,
      });

      const result = await service.getSettingsInternal("project-1");

      expect(result).toEqual({ dailyHourLimit: 10, weeklyHourLimit: null });
    });

    it("should throw NOT_FOUND when project does not exist", async () => {
      repo.findSettings.mockResolvedValue(null);

      await expect(service.getSettingsInternal("bad-id")).rejects.toThrow(
        expect.objectContaining({ code: ErrorCode.PROJECT.NOT_FOUND }),
      );
    });
  });
});
