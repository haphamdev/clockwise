import { Injectable } from '@nestjs/common';
import { UsersRepository } from './users.repository';
import { UserEntity, UserWithRefreshToken, UserWithTeams } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async findByEmail(email: string): Promise<UserEntity | null> {
    return this.usersRepository.findByEmail(email);
  }

  async findById(id: string): Promise<UserWithTeams | null> {
    return this.usersRepository.findById(id);
  }

  async createPendingUser(orgId: string, email: string): Promise<UserEntity> {
    return this.usersRepository.createPendingUser(orgId, email);
  }

  async findByIdWithRefreshToken(id: string): Promise<UserWithRefreshToken | null> {
    return this.usersRepository.findByIdWithRefreshToken(id);
  }

  async updateRefreshToken(userId: string, hashedToken: string | null): Promise<void> {
    return this.usersRepository.updateRefreshToken(userId, hashedToken);
  }

  async activateUser(
    userId: string,
    data: { name: string; avatarUrl?: string },
  ): Promise<UserEntity> {
    return this.usersRepository.activateUser(userId, data);
  }

  async updateLastLogin(userId: string): Promise<void> {
    return this.usersRepository.updateLastLogin(userId);
  }
}
