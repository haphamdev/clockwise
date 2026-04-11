import { ErrorCode } from "../../common/exceptions/error-codes";
import { UserPreferencesEntity } from "./entities/user-preferences.entity";
import { UserPreferencesRepository } from "./user-preferences.repository";
import { UserPreferencesService } from "./user-preferences.service";

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

describe("UserPreferencesService", () => {
  let service: UserPreferencesService;
  let prefsRepo: jest.Mocked<UserPreferencesRepository>;

  beforeEach(() => {
    prefsRepo = {
      findPreferences: jest.fn(),
      updatePreferences: jest.fn(),
    } as unknown as jest.Mocked<UserPreferencesRepository>;

    service = new UserPreferencesService(prefsRepo);
  });

  describe("getPreferences", () => {
    it("should return preferences from repo", async () => {
      const prefs = makePreferences({ theme: "dark" });
      prefsRepo.findPreferences.mockResolvedValue(prefs);

      const result = await service.getPreferences("user-1");
      expect(result).toEqual(prefs);
      expect(prefsRepo.findPreferences).toHaveBeenCalledWith("user-1");
    });

    it("should throw USER_NOT_FOUND when user missing", async () => {
      prefsRepo.findPreferences.mockResolvedValue(null);

      await expect(service.getPreferences("bad-id")).rejects.toThrow(
        expect.objectContaining({ code: ErrorCode.USER.NOT_FOUND }),
      );
    });
  });

  describe("updatePreferences", () => {
    it("should merge partial update and return result", async () => {
      const current = makePreferences({ theme: "dark" });
      prefsRepo.findPreferences.mockResolvedValue(current);
      const updated = makePreferences({ theme: "light" });
      prefsRepo.updatePreferences.mockResolvedValue(updated);

      const result = await service.updatePreferences("user-1", {
        theme: "light",
      });

      expect(result).toEqual(updated);
      expect(prefsRepo.updatePreferences).toHaveBeenCalledWith(
        "user-1",
        current,
        { theme: "light" },
      );
    });

    it("should throw USER_NOT_FOUND when user missing", async () => {
      prefsRepo.findPreferences.mockResolvedValue(null);

      await expect(
        service.updatePreferences("bad-id", { theme: "dark" }),
      ).rejects.toThrow(
        expect.objectContaining({ code: ErrorCode.USER.NOT_FOUND }),
      );
    });

    it("should return current preferences without DB write when body is empty", async () => {
      const prefs = makePreferences({ theme: "dark" });
      prefsRepo.findPreferences.mockResolvedValue(prefs);

      const result = await service.updatePreferences("user-1", {});

      expect(result).toEqual(prefs);
      expect(prefsRepo.findPreferences).toHaveBeenCalledWith("user-1");
      expect(prefsRepo.updatePreferences).not.toHaveBeenCalled();
    });
  });
});
