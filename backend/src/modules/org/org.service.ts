import { Injectable } from '@nestjs/common';
import { OrgNotFoundException } from '../../common/exceptions/org.exceptions';
import { OrgRepository } from './org.repository';
import { OrgSettingsEntity } from './entities/org-settings.entity';

@Injectable()
export class OrgService {
  constructor(private readonly orgRepository: OrgRepository) {}

  async getSettings(orgId: string): Promise<OrgSettingsEntity> {
    const settings = await this.orgRepository.findSettings(orgId);
    if (!settings) {
      throw new OrgNotFoundException();
    }
    return settings;
  }

  async updateSettings(
    orgId: string,
    data: {
      orgName?: string;
      expectedHoursPerWeek?: number;
      dailyWarningThreshold?: number;
      weeklyWarningThreshold?: number;
      dateFormat?: 'YYYY-MM-DD' | 'DD/MM/YYYY' | 'MM/DD/YYYY';
      timeFormat?: '12h' | '24h';
      csvMaxRows?: number;
    },
  ): Promise<OrgSettingsEntity> {
    const existing = await this.orgRepository.findSettings(orgId);
    if (!existing) {
      throw new OrgNotFoundException();
    }

    return this.orgRepository.updateSettings(orgId, existing, data);
  }
}
