import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { AuthGuard } from "@nestjs/passport";
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";
import { Throttle, ThrottlerGuard } from "@nestjs/throttler";
import { Request, Response } from "express";
import {
  InvalidRefreshTokenException,
  NoRefreshTokenException,
  UserNotFoundException,
} from "../../common/exceptions/auth.exceptions";
import { UserEntity } from "../users/entities/user.entity";
import { UsersService } from "../users/users.service";
import { AuthService, JwtPayload } from "./auth.service";
import {
  AccessTokenResponseDto,
  UserProfileDto,
} from "./dto/auth-response.dto";
import { DemoConfigResponseDto, DemoLoginDto } from "./dto/demo-login.dto";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";

const REFRESH_COOKIE_NAME = "refresh_token";
const REFRESH_COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days

@ApiTags("Auth")
@Controller("auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
  ) {}

  @Get("google")
  @UseGuards(AuthGuard("google"))
  @ApiOperation({ summary: "Initiate Google OAuth login" })
  googleLogin() {
    // Passport handles the redirect
  }

  @Get("google/callback")
  @UseGuards(AuthGuard("google"))
  @ApiOperation({ summary: "Google OAuth callback" })
  async googleCallback(@Req() req: Request, @Res() res: Response) {
    const user = req.user as UserEntity;
    const tokens = await this.authService.login(user);

    this.setRefreshTokenCookie(res, tokens.refreshToken);

    const frontendUrl = this.configService.getOrThrow<string>("FRONTEND_URL");
    res.redirect(`${frontendUrl}/auth/callback#token=${tokens.accessToken}`);
  }

  @Post("refresh")
  @ApiOperation({ summary: "Refresh access token" })
  @ApiOkResponse({ type: AccessTokenResponseDto })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AccessTokenResponseDto> {
    const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME];
    if (!refreshToken) {
      throw new NoRefreshTokenException();
    }

    let payload: JwtPayload;
    try {
      payload = this.jwtService.verify<JwtPayload>(refreshToken, {
        secret: this.configService.getOrThrow<string>("JWT_REFRESH_SECRET"),
      });
    } catch {
      throw new InvalidRefreshTokenException();
    }

    const tokens = await this.authService.refreshTokens(
      payload.sub,
      refreshToken,
    );

    this.setRefreshTokenCookie(res, tokens.refreshToken);
    return { accessToken: tokens.accessToken };
  }

  @Post("logout")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Logout and invalidate refresh token" })
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const user = req.user as UserEntity;
    await this.authService.logout(user.id);

    res.clearCookie(REFRESH_COOKIE_NAME, {
      path: "/api/v1/auth",
    });
    return { message: "Logged out" };
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get current user profile" })
  async me(@Req() req: Request): Promise<UserProfileDto> {
    const user = req.user as UserEntity;
    const fullUser = await this.usersService.findById(user.id);

    if (!fullUser) {
      throw new UserNotFoundException();
    }

    return {
      id: fullUser.id,
      email: fullUser.email,
      name: fullUser.name,
      avatarUrl: fullUser.avatarUrl,
      isAdmin: fullUser.isAdmin,
      teams: fullUser.teamMemberships.map((tm) => ({
        teamId: tm.teamId,
        teamName: tm.teamName,
        role: tm.role,
      })),
    };
  }

  @Post("demo-login")
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({ summary: "Log in as a pre-seeded demo user" })
  @ApiOkResponse({ type: AccessTokenResponseDto })
  async demoLogin(@Body() dto: DemoLoginDto): Promise<AccessTokenResponseDto> {
    return this.authService.demoLogin(dto.role);
  }

  @Get("demo-config")
  @ApiOperation({ summary: "Whether demo login is available" })
  @ApiOkResponse({ type: DemoConfigResponseDto })
  demoConfig(): DemoConfigResponseDto {
    return { enabled: this.authService.isDemoLoginEnabled() };
  }

  private setRefreshTokenCookie(res: Response, token: string) {
    res.cookie(REFRESH_COOKIE_NAME, token, {
      httpOnly: true,
      secure: this.configService.get<string>("NODE_ENV") === "production",
      sameSite: "lax",
      path: "/api/v1/auth",
      maxAge: REFRESH_COOKIE_MAX_AGE,
    });
  }
}
