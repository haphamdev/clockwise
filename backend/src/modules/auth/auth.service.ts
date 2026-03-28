import { Injectable, HttpStatus } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'crypto';
import { AppException, ErrorCode } from '../../common';
import { UsersService } from '../users/users.service';
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
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async validateOAuthUser(profile: OAuthProfile): Promise<UserEntity> {
    const user = await this.usersService.findByEmail(profile.email);

    if (!user) {
      throw new AppException(
        ErrorCode.AUTH.NO_INVITATION,
        'No invitation found for this email. Contact your admin to get access.',
        HttpStatus.UNAUTHORIZED,
      );
    }

    if (user.status === 'deactivated') {
      throw new AppException(
        ErrorCode.AUTH.ACCOUNT_DEACTIVATED,
        'Your account has been deactivated. Contact your admin.',
        HttpStatus.FORBIDDEN,
      );
    }

    if (user.status === 'pending') {
      return this.usersService.activateUser(user.id, {
        name: profile.name,
        avatarUrl: profile.avatarUrl,
      });
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
      throw new AppException(
        ErrorCode.AUTH.INVALID_REFRESH_TOKEN,
        'Invalid refresh token',
        HttpStatus.UNAUTHORIZED,
      );
    }

    if (user.status !== 'active') {
      throw new AppException(
        ErrorCode.AUTH.ACCOUNT_NOT_ACTIVE,
        'Account is not active',
        HttpStatus.FORBIDDEN,
      );
    }

    const hashedToken = this.hashToken(refreshToken);
    if (hashedToken !== user.refreshToken) {
      throw new AppException(
        ErrorCode.AUTH.INVALID_REFRESH_TOKEN,
        'Invalid refresh token',
        HttpStatus.UNAUTHORIZED,
      );
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
