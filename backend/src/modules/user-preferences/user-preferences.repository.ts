import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import {
  DEFAULT_USER_PREFERENCES,
  Theme,
  UserPreferencesEntity,
  WeekStartDay,
} from "./entities/user-preferences.entity";

interface PreferencesJson {
  theme?: string;
  dateFormat?: string | null;
  timeFormat?: string | null;
  timezone?: string;
  defaultProjectId?: string | null;
  weekStartDay?: string;
}

const VALID_THEMES: readonly string[] = ["light", "dark", "system"];
const VALID_WEEK_START_DAYS: readonly string[] = ["monday", "sunday"];

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

  /**
   * Merges the provided fields into the current preferences.
   * Caller (service) must verify the user exists before calling this.
   */
  async updatePreferences(
    userId: string,
    current: UserPreferencesEntity,
    data: Partial<UserPreferencesEntity>,
  ): Promise<UserPreferencesEntity> {
    const merged = { ...current, ...data };

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { preferences: merged as unknown as Prisma.InputJsonValue },
      select: { preferences: true },
    });

    return this.toEntity(user.preferences);
  }

  private toEntity(json: unknown): UserPreferencesEntity {
    const p = (json ?? {}) as PreferencesJson;
    const d = DEFAULT_USER_PREFERENCES;

    return {
      theme: VALID_THEMES.includes(p.theme as string)
        ? (p.theme as Theme)
        : d.theme,
      dateFormat:
        p.dateFormat !== undefined
          ? (p.dateFormat as UserPreferencesEntity["dateFormat"])
          : d.dateFormat,
      timeFormat:
        p.timeFormat !== undefined
          ? (p.timeFormat as UserPreferencesEntity["timeFormat"])
          : d.timeFormat,
      timezone:
        typeof p.timezone === "string" && p.timezone.length > 0
          ? p.timezone
          : d.timezone,
      defaultProjectId:
        p.defaultProjectId !== undefined
          ? (p.defaultProjectId ?? null)
          : d.defaultProjectId,
      weekStartDay: VALID_WEEK_START_DAYS.includes(p.weekStartDay as string)
        ? (p.weekStartDay as WeekStartDay)
        : d.weekStartDay,
    };
  }
}
