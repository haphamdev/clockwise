import type { UserEntity } from "../users/entities/user.entity";
import { DashboardController } from "./dashboard.controller";
import { DashboardService } from "./dashboard.service";

function makeUser(overrides?: Partial<UserEntity>): UserEntity {
  return {
    id: "user-1",
    orgId: "org-1",
    email: "user@example.com",
    name: "User",
    avatarUrl: null,
    isAdmin: false,
    status: "active",
    lastLoginAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe("DashboardController", () => {
  let controller: DashboardController;
  let service: jest.Mocked<DashboardService>;

  beforeEach(() => {
    service = {
      getMySummary: jest.fn(),
      getTeamBreakdown: jest.fn(),
      getOrgOverview: jest.fn(),
    } as unknown as jest.Mocked<DashboardService>;

    controller = new DashboardController(service);
  });

  describe("getMySummary", () => {
    it("should delegate to service with userId and orgId", async () => {
      const mockResponse = {
        myHours: {
          today: 4,
          thisWeek: 20,
          lastWeek: 18,
          weekOverWeekPct: 11,
          thisMonth: 80,
          lastMonth: 75,
          monthOverMonthPct: 7,
        },
        gaps: [],
        recentLogs: [],
        projectSummaries: [],
      };
      service.getMySummary.mockResolvedValue(mockResponse);

      const result = await controller.getMySummary(makeUser());

      expect(service.getMySummary).toHaveBeenCalledWith("user-1", "org-1");
      expect(result).toEqual(mockResponse);
    });
  });

  describe("getTeamBreakdown", () => {
    it("should pass isAdmin=false for non-admin user", async () => {
      service.getTeamBreakdown.mockResolvedValue({ teams: [] });

      await controller.getTeamBreakdown(makeUser());

      expect(service.getTeamBreakdown).toHaveBeenCalledWith(
        "user-1",
        "org-1",
        false,
      );
    });

    it("should pass isAdmin=true for admin user", async () => {
      service.getTeamBreakdown.mockResolvedValue({ teams: [] });

      await controller.getTeamBreakdown(
        makeUser({ id: "admin-1", isAdmin: true }),
      );

      expect(service.getTeamBreakdown).toHaveBeenCalledWith(
        "admin-1",
        "org-1",
        true,
      );
    });
  });

  describe("getOrgOverview", () => {
    it("should delegate to service with orgId", async () => {
      const mockResponse = {
        users: { active: 10, deactivated: 2 },
        teams: { active: 3, archived: 1 },
        projects: { active: 5, archived: 2 },
      };
      service.getOrgOverview.mockResolvedValue(mockResponse);

      const result = await controller.getOrgOverview(
        makeUser({ isAdmin: true }),
      );

      expect(service.getOrgOverview).toHaveBeenCalledWith("org-1");
      expect(result).toEqual(mockResponse);
    });
  });
});
