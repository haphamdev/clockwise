import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'crypto';
import {
  NoInvitationException,
  AccountDeactivatedException,
  InvalidRefreshTokenException,
  AccountNotActiveException,
} from '../../common/exceptions/auth.exceptions';
import { UsersService } from '../users/users.service';
import { InvitationsService } from '../invitations/invitations.service';
import { UserEntity } from '../users/entities/user.entity';

export interface OAuthProfile {
  email: string;
  name: string;
  avatarUrl?: string;
}

export interface JwtPayload {
  sub: string;
  email: string;
  isAdmin: boolean;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly invitationsService: InvitationsService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async validateOAuthUser(profile: OAuthProfile): Promise<UserEntity> {
    const user = await this.usersService.findByEmail(profile.email);

    if (!user) {
      throw new NoInvitationException();
    }

    if (user.status === 'deactivated') {
      throw new AccountDeactivatedException();
    }

    if (user.status === 'pending') {
      const activatedUser = await this.usersService.activateUser(user.id, {
        name: profile.name,
        avatarUrl: profile.avatarUrl,
      });

      // Accept invitation and create team memberships
      await this.invitationsService.acceptByEmail(profile.email, activatedUser.id);

      return activatedUser;
    }

    await this.usersService.updateLastLogin(user.id);
    return user;
  }

  async login(user: UserEntity): Promise<{ accessToken: string; refreshToken: string }> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      isAdmin: user.isAdmin,
    };

    const accessToken = this.jwtService.sign(payload);

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      expiresIn: '7d',
    });

    const hashedToken = this.hashToken(refreshToken);
    await this.usersService.updateRefreshToken(user.id, hashedToken);

    return { accessToken, refreshToken };
  }

  async refreshTokens(
    userId: string,
    refreshToken: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const user = await this.usersService.findByIdWithRefreshToken(userId);

    if (!user || !user.refreshToken) {
      throw new InvalidRefreshTokenException();
    }

    if (user.status !== 'active') {
      throw new AccountNotActiveException();
    }

    const hashedToken = this.hashToken(refreshToken);
    if (hashedToken !== user.refreshToken) {
      throw new InvalidRefreshTokenException();
    }

    return this.login(user);
  }

  async logout(userId: string): Promise<void> {
    await this.usersService.updateRefreshToken(userId, null);
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
