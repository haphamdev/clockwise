import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { UserPreferencesController } from './user-preferences.controller';
import { UserPreferencesRepository } from './user-preferences.repository';
import { UserPreferencesService } from './user-preferences.service';

@Module({
  imports: [UsersModule],
  controllers: [UserPreferencesController],
  providers: [UserPreferencesRepository, UserPreferencesService],
})
export class UserPreferencesModule {}
