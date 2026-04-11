import { UserEntity } from "../users/entities/user.entity";
import { UserPreferencesEntity } from "./entities/user-preferences.entity";
import { UserPreferencesController } from "./user-preferences.controller";
import { UserPreferencesService } from "./user-preferences.service";

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

function makePreferences(
  overrides?: Partial<UserPreferencesEntity>,
): UserPreferencesEntity {
  return {
    theme: "system",
    dateFormat: null,
    timeFormat: null,
    timezone: "UTC",
    defaultProjectId: null,
    weekStartDay: "monday",
    ...overrides,
  };
}

describe("UserPreferencesController", () => {
  let controller: UserPreferencesController;
  let service: jest.Mocked<UserPreferencesService>;

  beforeEach(() => {
    service = {
      getPreferences: jest.fn(),
      updatePreferences: jest.fn(),
    } as unknown as jest.Mocked<UserPreferencesService>;

    controller = new UserPreferencesController(service);
  });

  describe("getPreferences", () => {
    it("should return preferences using user ID from @CurrentUser()", async () => {
      const prefs = makePreferences({ theme: "dark" });
      service.getPreferences.mockResolvedValue(prefs);

      const result = await controller.getPreferences(makeUser());
      expect(result).toEqual(prefs);
      expect(service.getPreferences).toHaveBeenCalledWith("user-1");
    });
  });

  describe("updatePreferences", () => {
    it("should pass user ID and DTO to service", async () => {
      const updated = makePreferences({ theme: "light" });
      service.updatePreferences.mockResolvedValue(updated);

      const dto = { theme: "light" as const };
      const result = await controller.updatePreferences(makeUser(), dto);
      expect(result).toEqual(updated);
      expect(service.updatePreferences).toHaveBeenCalledWith("user-1", dto);
    });
  });
});
