import { ErrorCode } from '../../common/exceptions/error-codes';
import { OrgService } from './org.service';
import { OrgRepository } from './org.repository';
import { OrgSettingsEntity } from './entities/org-settings.entity';

function makeSettings(overrides?: Partial<OrgSettingsEntity>): OrgSettingsEntity {
  return {
    orgName: 'Acme Corp',
    expectedHoursPerWeek: 40,
    dailyWarningThreshold: 12,
    weeklyWarningThreshold: 60,
    dateFormat: 'YYYY-MM-DD',
    csvMaxRows: 500,
    ...overrides,
  };
}

describe('OrgService', () => {
  let service: OrgService;
  let repo: jest.Mocked<OrgRepository>;

  beforeEach(() => {
    repo = {
      findSettings: jest.fn(),
      updateSettings: jest.fn(),
    } as unknown as jest.Mocked<OrgRepository>;

    service = new OrgService(repo);
  });

  describe('getSettings', () => {
    it('should return settings', async () => {
      const settings = makeSettings();
      repo.findSettings.mockResolvedValue(settings);

      const res = await service.getSettings('org-1');
      expect(res).toEqual(settings);
      expect(repo.findSettings).toHaveBeenCalledWith('org-1');
    });

    it('should throw ORG_NOT_FOUND when org does not exist', async () => {
      repo.findSettings.mockResolvedValue(null);

      await expect(service.getSettings('bad-org')).rejects.toThrow(
        expect.objectContaining({ code: ErrorCode.ORG.NOT_FOUND }),
      );
    });
  });

  describe('updateSettings', () => {
    it('should update and return settings', async () => {
      repo.findSettings.mockResolvedValue(makeSettings());
      const updated = makeSettings({ orgName: 'New Name', expectedHoursPerWeek: 35 });
      repo.updateSettings.mockResolvedValue(updated);

      const res = await service.updateSettings('org-1', {
        orgName: 'New Name',
        expectedHoursPerWeek: 35,
      });
      expect(res.orgName).toBe('New Name');
      expect(res.expectedHoursPerWeek).toBe(35);
    });

    it('should update a single field without affecting others', async () => {
      const current = makeSettings();
      repo.findSettings.mockResolvedValue(current);
      const updated = makeSettings({ dateFormat: 'DD/MM/YYYY' });
      repo.updateSettings.mockResolvedValue(updated);

      const res = await service.updateSettings('org-1', { dateFormat: 'DD/MM/YYYY' });
      expect(res.dateFormat).toBe('DD/MM/YYYY');
      expect(res.expectedHoursPerWeek).toBe(40);
      expect(repo.updateSettings).toHaveBeenCalledWith('org-1', current, { dateFormat: 'DD/MM/YYYY' });
    });

    it('should throw ORG_NOT_FOUND when org does not exist', async () => {
      repo.findSettings.mockResolvedValue(null);

      await expect(
        service.updateSettings('bad-org', { orgName: 'New' }),
      ).rejects.toThrow(expect.objectContaining({ code: ErrorCode.ORG.NOT_FOUND }));
    });
  });
});
