import { Injectable } from '@nestjs/common';
import { Organization, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { OrgSettingsEntity, DEFAULT_ORG_SETTINGS } from './entities/org-settings.entity';

interface SettingsJson {
  expectedHoursPerWeek?: number;
  dailyWarningThreshold?: number;
  weeklyWarningThreshold?: number;
  dateFormat?: string;
  csvMaxRows?: number;
}

@Injectable()
export class OrgRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findSettings(orgId: string): Promise<OrgSettingsEntity | null> {
    const org = await this.prisma.organization.findUnique({
      where: { id: orgId },
    });

    return org ? this.toSettingsEntity(org) : null;
  }

  /**
   * Merges the provided fields into the existing settings JSON.
   * Caller (OrgService) must verify the org exists before calling this.
   */
  async updateSettings(
    orgId: string,
    currentSettings: SettingsJson,
    data: {
      orgName?: string;
      expectedHoursPerWeek?: number;
      dailyWarningThreshold?: number;
      weeklyWarningThreshold?: number;
      dateFormat?: string;
      csvMaxRows?: number;
    },
  ): Promise<OrgSettingsEntity> {
    const { orgName, ...settingsFields } = data;
    const mergedSettings: SettingsJson = { ...currentSettings, ...settingsFields };

    const updated = await this.prisma.organization.update({
      where: { id: orgId },
      data: {
        ...(orgName !== undefined && { name: orgName }),
        settings: mergedSettings as Prisma.InputJsonValue,
      },
    });

    return this.toSettingsEntity(updated);
  }

  private toSettingsEntity(org: Organization): OrgSettingsEntity {
    const s = (org.settings ?? {}) as SettingsJson;
    const d = DEFAULT_ORG_SETTINGS;

    return {
      orgName: org.name,
      expectedHoursPerWeek: s.expectedHoursPerWeek ?? d.expectedHoursPerWeek,
      dailyWarningThreshold: s.dailyWarningThreshold ?? d.dailyWarningThreshold,
      weeklyWarningThreshold: s.weeklyWarningThreshold ?? d.weeklyWarningThreshold,
      dateFormat: (s.dateFormat as OrgSettingsEntity['dateFormat']) ?? d.dateFormat,
      csvMaxRows: s.csvMaxRows ?? d.csvMaxRows,
    };
  }
}
