import { Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { Test, TestingModule } from "@nestjs/testing";
import { ThrottlerGuard } from "@nestjs/throttler";
import { Request, Response } from "express";
import { AppException } from "../../common/exceptions/app.exception";
import {
  AccountDeactivatedException,
  NoInvitationException,
} from "../../common/exceptions/auth.exceptions";
import { UserEntity, UserWithTeams } from "../users/entities/user.entity";
import { UsersService } from "../users/users.service";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";

describe("AuthController", () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;
  let usersService: jest.Mocked<UsersService>;
  let jwtService: jest.Mocked<JwtService>;

  const mockUser: UserEntity = {
    id: "user-1",
    orgId: "org-1",
    email: "test@example.com",
    name: "Test User",
    avatarUrl: null,
    isAdmin: false,
    status: "active",
    lastLoginAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  interface MockResponse {
    cookie: jest.Mock;
    clearCookie: jest.Mock;
    redirect: jest.Mock;
  }

  const mockRes = (): MockResponse => {
    const res: MockResponse = {
      cookie: jest.fn(),
      clearCookie: jest.fn(),
      redirect: jest.fn(),
    };
    res.cookie.mockReturnValue(res);
    res.clearCookie.mockReturnValue(res);
    res.redirect.mockReturnValue(res);
    return res;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            login: jest.fn(),
            validateOAuthUser: jest.fn(),
            refreshTokens: jest.fn(),
            logout: jest.fn(),
            demoLogin: jest.fn(),
            isDemoLoginEnabled: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: jest.fn().mockReturnValue("http://localhost:5173"),
            get: jest.fn().mockReturnValue("development"),
          },
        },
        {
          provide: JwtService,
          useValue: {
            verify: jest.fn(),
          },
        },
        {
          provide: UsersService,
          useValue: {
            findById: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(ThrottlerGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get(AuthController);
    authService = module.get(AuthService);
    usersService = module.get(UsersService);
    jwtService = module.get(JwtService);
  });

  describe("googleCallback", () => {
    it("should redirect with access token in URL hash", async () => {
      const res = mockRes();
      const req = {
        user: { email: "test@example.com", name: "Test User", avatarUrl: null },
      } as unknown as Request;
      authService.validateOAuthUser.mockResolvedValue(mockUser);
      authService.login.mockResolvedValue({
        accessToken: "at-123",
        refreshToken: "rt-123",
      });

      await controller.googleCallback(req, res as unknown as Response);

      expect(res.cookie).toHaveBeenCalledWith(
        "refresh_token",
        "rt-123",
        expect.objectContaining({ httpOnly: true, path: "/api/v1/auth" }),
      );
      expect(res.redirect).toHaveBeenCalledWith(
        "http://localhost:5173/auth/callback#token=at-123",
      );
    });

    it("redirects to /login when the email has no invitation", async () => {
      const res = mockRes();
      const req = {
        user: { email: "nobody@example.com", name: "N", avatarUrl: null },
      } as unknown as Request;
      authService.validateOAuthUser.mockRejectedValue(
        new NoInvitationException(),
      );

      await controller.googleCallback(req, res as unknown as Response);

      expect(res.redirect).toHaveBeenCalledWith(
        "http://localhost:5173/login?error=not_invited&email=nobody%40example.com",
      );
      expect(authService.login).not.toHaveBeenCalled();
    });

    it("redirects with deactivated slug for a deactivated account", async () => {
      const res = mockRes();
      const req = {
        user: { email: "gone@example.com", name: "G", avatarUrl: null },
      } as unknown as Request;
      authService.validateOAuthUser.mockRejectedValue(
        new AccountDeactivatedException(),
      );

      await controller.googleCallback(req, res as unknown as Response);

      expect(res.redirect).toHaveBeenCalledWith(
        "http://localhost:5173/login?error=deactivated&email=gone%40example.com",
      );
      expect(authService.login).not.toHaveBeenCalled();
    });

    it("falls back to signin_failed and logs an unexpected error", async () => {
      const res = mockRes();
      const req = {
        user: { email: "boom@example.com", name: "B", avatarUrl: null },
      } as unknown as Request;
      const logSpy = jest
        .spyOn(Logger.prototype, "error")
        .mockImplementation(() => undefined);
      authService.validateOAuthUser.mockRejectedValue(new Error("db down"));

      await controller.googleCallback(req, res as unknown as Response);

      expect(res.redirect).toHaveBeenCalledWith(
        "http://localhost:5173/login?error=signin_failed&email=boom%40example.com",
      );
      expect(logSpy).toHaveBeenCalled();
      logSpy.mockRestore();
    });
  });

  describe("refresh", () => {
    it("should throw when no refresh cookie", async () => {
      const req = { cookies: {} } as unknown as Request;
      const res = mockRes();

      await expect(
        controller.refresh(req, res as unknown as Response),
      ).rejects.toThrow(AppException);
    });

    it("should throw on invalid JWT in cookie", async () => {
      const req = {
        cookies: { refresh_token: "bad-token" },
      } as unknown as Request;
      const res = mockRes();
      jwtService.verify.mockImplementation(() => {
        throw new Error("invalid");
      });

      await expect(
        controller.refresh(req, res as unknown as Response),
      ).rejects.toThrow(AppException);
    });

    it("should return new access token and set new refresh cookie", async () => {
      const req = {
        cookies: { refresh_token: "valid-rt" },
      } as unknown as Request;
      const res = mockRes();
      jwtService.verify.mockReturnValue({
        sub: "user-1",
        email: "test@example.com",
        isAdmin: false,
      });
      authService.refreshTokens.mockResolvedValue({
        accessToken: "new-at",
        refreshToken: "new-rt",
      });

      const result = await controller.refresh(req, res as unknown as Response);

      expect(result).toEqual({ accessToken: "new-at" });
      expect(res.cookie).toHaveBeenCalledWith(
        "refresh_token",
        "new-rt",
        expect.objectContaining({ httpOnly: true }),
      );
    });
  });

  describe("logout", () => {
    it("should clear refresh token and cookie", async () => {
      const req = { user: mockUser } as unknown as Request;
      const res = mockRes();

      const result = await controller.logout(req, res as unknown as Response);

      expect(authService.logout).toHaveBeenCalledWith("user-1");
      expect(res.clearCookie).toHaveBeenCalledWith(
        "refresh_token",
        expect.objectContaining({ path: "/api/v1/auth" }),
      );
      expect(result).toEqual({ message: "Logged out" });
    });
  });

  describe("me", () => {
    it("should return user profile with teams", async () => {
      const req = { user: mockUser } as unknown as Request;
      const fullUser: UserWithTeams = {
        ...mockUser,
        teamMemberships: [
          {
            teamId: "team-1",
            teamName: "Engineering",
            role: "manager",
            isArchived: false,
          },
        ],
      };
      usersService.findById.mockResolvedValue(fullUser);

      const result = await controller.me(req);

      expect(result).toEqual({
        id: "user-1",
        email: "test@example.com",
        name: "Test User",
        avatarUrl: null,
        isAdmin: false,
        teams: [{ teamId: "team-1", teamName: "Engineering", role: "manager" }],
      });
    });

    it("should throw when user not found in DB", async () => {
      const req = { user: mockUser } as unknown as Request;
      usersService.findById.mockResolvedValue(null);

      await expect(controller.me(req)).rejects.toThrow(AppException);
    });
  });

  describe("demoLogin", () => {
    it("returns the access token without setting a refresh cookie", async () => {
      authService.demoLogin.mockResolvedValue({ accessToken: "demo-at" });

      const result = await controller.demoLogin({ role: "manager" });

      expect(authService.demoLogin).toHaveBeenCalledWith("manager");
      expect(result).toEqual({ accessToken: "demo-at" });
    });
  });

  describe("demoConfig", () => {
    it("reports the service enabled flag", () => {
      authService.isDemoLoginEnabled.mockReturnValue(true);
      expect(controller.demoConfig()).toEqual({ enabled: true });

      authService.isDemoLoginEnabled.mockReturnValue(false);
      expect(controller.demoConfig()).toEqual({ enabled: false });
    });
  });
});
