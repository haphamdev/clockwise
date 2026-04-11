import type { UserEntity } from "../users/entities/user.entity";
import type { LoggingDelayHeatmapResponseDto } from "./dto/reports-response.dto";
import { ReportsController } from "./reports.controller";
import { ReportsService } from "./reports.service";

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

describe("ReportsController – getLoggingDelayHeatmap", () => {
  let controller: ReportsController;
  let service: jest.Mocked<ReportsService>;

  beforeEach(() => {
    service = {
      getLoggingDelayHeatmap: jest.fn(),
    } as unknown as jest.Mocked<ReportsService>;

    controller = new ReportsController(service);
  });

  it("should delegate to service with orgId, userId, isAdmin, and query", async () => {
    const mockResponse: LoggingDelayHeatmapResponseDto = {
      cells: [
        {
          userId: "user-1",
          userName: "Alice",
          weekday: 0,
          p75Delay: 1.5,
          entryCount: 10,
        },
      ],
      minEntries: 5,
    };
    service.getLoggingDelayHeatmap.mockResolvedValue(mockResponse);

    const user = makeAdmin();
    const query = { dateFrom: "2026-03-01", dateTo: "2026-03-31" };

    const result = await controller.getLoggingDelayHeatmap(user, query);

    expect(service.getLoggingDelayHeatmap).toHaveBeenCalledWith(
      "org-1",
      "admin-1",
      true,
      query,
    );
    expect(result.cells).toHaveLength(1);
    expect(result.minEntries).toBe(5);
  });

  it("should pass filter params from query to service", async () => {
    service.getLoggingDelayHeatmap.mockResolvedValue({
      cells: [],
      minEntries: 5,
    });

    const user = makeAdmin({ id: "mgr-1", isAdmin: false });
    const query = {
      dateFrom: "2026-03-01",
      dateTo: "2026-03-31",
      teamIds: ["team-1"],
      userIds: ["user-1", "user-2"],
      projectIds: ["proj-1"],
    };

    await controller.getLoggingDelayHeatmap(user, query);

    expect(service.getLoggingDelayHeatmap).toHaveBeenCalledWith(
      "org-1",
      "mgr-1",
      false,
      query,
    );
  });
});
