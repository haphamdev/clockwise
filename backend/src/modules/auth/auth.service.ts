import { createHash } from "node:crypto";
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import {
  AccountDeactivatedException,
  AccountNotActiveException,
  DemoLoginDisabledException,
  DemoUserNotAvailableException,
  InvalidRefreshTokenException,
  NoInvitationException,
} from "../../common/exceptions/auth.exceptions";
import { InvitationsService } from "../invitations/invitations.service";
import { UserEntity } from "../users/entities/user.entity";
import { UsersService } from "../users/users.service";
import { DemoRole } from "./dto/demo-login.dto";

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

  private static readonly DEMO_EMAILS: Record<DemoRole, string> = {
    member: "demo-member@clockwise.demo",
    manager: "demo-manager@clockwise.demo",
    admin: "demo-admin@clockwise.demo",
  };

  // Demo sessions are stateless: a longer-lived access token and no refresh
  // token, so concurrent visitors sharing a demo account never clobber each
  // other's persisted refresh token.
  private static readonly DEMO_TOKEN_TTL = "8h";

  async validateOAuthUser(profile: OAuthProfile): Promise<UserEntity> {
    const user = await this.usersService.findByEmail(profile.email);

    if (!user) {
      throw new NoInvitationException();
    }

    if (user.status === "deactivated") {
      throw new AccountDeactivatedException();
    }

    if (user.status === "pending") {
      const activatedUser = await this.usersService.activateUser(
        user.id,
        {
          name: profile.name,
          avatarUrl: profile.avatarUrl,
        },
        "system",
      );

      // Accept invitation and create team memberships
      await this.invitationsService.acceptByEmail(
        profile.email,
        activatedUser.id,
      );

      return activatedUser;
    }

    await this.usersService.updateLastLogin(user.id);
    return user;
  }

  async login(
    user: UserEntity,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      isAdmin: user.isAdmin,
    };

    const accessToken = this.jwtService.sign(payload);

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.getOrThrow<string>("JWT_REFRESH_SECRET"),
      expiresIn: "7d",
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

    if (!user?.refreshToken) {
      throw new InvalidRefreshTokenException();
    }

    if (user.status !== "active") {
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

  isDemoLoginEnabled(): boolean {
    return this.configService.get<string>("DEMO_LOGIN_ENABLED") === "true";
  }

  async demoLogin(role: DemoRole): Promise<{ accessToken: string }> {
    if (!this.isDemoLoginEnabled()) {
      throw new DemoLoginDisabledException();
    }

    const user = await this.usersService.findByEmail(
      AuthService.DEMO_EMAILS[role],
    );

    if (!user || user.status !== "active") {
      throw new DemoUserNotAvailableException();
    }

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      isAdmin: user.isAdmin,
    };

    return {
      accessToken: this.jwtService.sign(payload, {
        expiresIn: AuthService.DEMO_TOKEN_TTL,
      }),
    };
  }

  private hashToken(token: string): string {
    return createHash("sha256").update(token).digest("hex");
  }
}
