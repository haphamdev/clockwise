import { UserEntity } from "../users/entities/user.entity";
import { OrgSettingsEntity } from "./entities/org-settings.entity";
import { OrgController } from "./org.controller";
import { OrgService } from "./org.service";

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

function makeSettings(
  overrides?: Partial<OrgSettingsEntity>,
): OrgSettingsEntity {
  return {
    orgName: "Acme Corp",
    expectedHoursPerWeek: 40,
    dailyWarningThreshold: 12,
    weeklyWarningThreshold: 60,
    dateFormat: "YYYY-MM-DD",
    timeFormat: "12h",
    csvMaxRows: 500,
    trackSaturday: false,
    trackSunday: false,
    ...overrides,
  };
}

describe("OrgController", () => {
  let controller: OrgController;
  let service: jest.Mocked<OrgService>;

  beforeEach(() => {
    service = {
      getSettings: jest.fn(),
      updateSettings: jest.fn(),
    } as unknown as jest.Mocked<OrgService>;

    controller = new OrgController(service);
  });

  describe("getSettings", () => {
    it("should return settings using user orgId", async () => {
      const settings = makeSettings();
      service.getSettings.mockResolvedValue(settings);

      const result = await controller.getSettings(makeUser());
      expect(result).toEqual(settings);
      expect(service.getSettings).toHaveBeenCalledWith("org-1");
    });
  });

  describe("updateSettings", () => {
    it("should pass orgId and dto to service", async () => {
      const updated = makeSettings({ orgName: "New Name" });
      service.updateSettings.mockResolvedValue(updated);

      const result = await controller.updateSettings(makeUser(), {
        orgName: "New Name",
      });
      expect(result.orgName).toBe("New Name");
      expect(service.updateSettings).toHaveBeenCalledWith("org-1", {
        orgName: "New Name",
      });
    });
  });
});
