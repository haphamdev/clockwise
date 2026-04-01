import { Injectable } from '@nestjs/common';
import { UserNotFoundException } from '../../common/exceptions/user.exceptions';
import { UserPreferencesRepository } from './user-preferences.repository';
import { UserPreferencesEntity } from './entities/user-preferences.entity';
import { UpdateUserPreferencesDto } from './dto/update-user-preferences.dto';

@Injectable()
export class UserPreferencesService {
  constructor(private readonly prefsRepo: UserPreferencesRepository) {}

  async getPreferences(userId: string): Promise<UserPreferencesEntity> {
    const prefs = await this.prefsRepo.findPreferences(userId);
    if (!prefs) {
      throw new UserNotFoundException();
    }
    return prefs;
  }

  async updatePreferences(
    userId: string,
    dto: UpdateUserPreferencesDto,
  ): Promise<UserPreferencesEntity> {
    if (Object.keys(dto).length === 0) {
      return this.getPreferences(userId);
    }

    const current = await this.prefsRepo.findPreferences(userId);
    if (!current) {
      throw new UserNotFoundException();
    }

    return this.prefsRepo.updatePreferences(userId, current, dto);
  }
}
