import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  UserPreferencesEntity,
  DEFAULT_USER_PREFERENCES,
} from './entities/user-preferences.entity';

interface PreferencesJson {
  theme?: string;
  dateFormat?: string | null;
  timeFormat?: string | null;
  timezone?: string;
  defaultProjectId?: string | null;
  weekStartDay?: string;
}

@Injectable()
export class UserPreferencesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findPreferences(userId: string): Promise<UserPreferencesEntity | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { preferences: true },
    });

    return user ? this.toEntity(user.preferences) : null;
  }

  async updatePreferences(
    userId: string,
    current: PreferencesJson,
    data: Partial<UserPreferencesEntity>,
  ): Promise<UserPreferencesEntity> {
    const merged: PreferencesJson = { ...current, ...data };

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { preferences: merged as Prisma.InputJsonValue },
      select: { preferences: true },
    });

    return this.toEntity(user.preferences);
  }

  /**
   * Returns the raw preferences JSON for merging.
   * Caller should use findPreferences() for the resolved entity.
   */
  async findRawPreferences(userId: string): Promise<PreferencesJson | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { preferences: true },
    });

    return user ? ((user.preferences ?? {}) as PreferencesJson) : null;
  }

  private toEntity(json: unknown): UserPreferencesEntity {
    const p = (json ?? {}) as PreferencesJson;
    const d = DEFAULT_USER_PREFERENCES;

    return {
      theme: (p.theme as UserPreferencesEntity['theme']) ?? d.theme,
      dateFormat: p.dateFormat !== undefined ? (p.dateFormat as UserPreferencesEntity['dateFormat']) : d.dateFormat,
      timeFormat: p.timeFormat !== undefined ? (p.timeFormat as UserPreferencesEntity['timeFormat']) : d.timeFormat,
      timezone: p.timezone ?? d.timezone,
      defaultProjectId: p.defaultProjectId !== undefined ? p.defaultProjectId ?? null : d.defaultProjectId,
      weekStartDay: (p.weekStartDay as UserPreferencesEntity['weekStartDay']) ?? d.weekStartDay,
    };
  }
}
