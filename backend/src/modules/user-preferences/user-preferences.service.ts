import { Injectable } from '@nestjs/common';
import { UserNotFoundException } from '../../common/exceptions/user.exceptions';
import { UserPreferencesRepository } from './user-preferences.repository';
import { UsersService } from '../users/users.service';
import { UserPreferencesEntity } from './entities/user-preferences.entity';
import { UpdateUserPreferencesDto } from './dto/update-user-preferences.dto';

@Injectable()
export class UserPreferencesService {
  constructor(
    private readonly prefsRepo: UserPreferencesRepository,
    private readonly usersService: UsersService,
  ) {}

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
    const raw = await this.prefsRepo.findRawPreferences(userId);
    if (raw === null) {
      throw new UserNotFoundException();
    }

    return this.prefsRepo.updatePreferences(userId, raw, dto);
  }
}
