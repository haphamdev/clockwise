import { createHash } from "node:crypto";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { Test, TestingModule } from "@nestjs/testing";
import { AppException } from "../../common/exceptions/app.exception";
import { InvitationsService } from "../invitations/invitations.service";
import {
  UserEntity,
  UserWithRefreshToken,
} from "../users/entities/user.entity";
import { UsersService } from "../users/users.service";
import { AuthService } from "./auth.service";

describe("AuthService", () => {
  let service: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let invitationsService: jest.Mocked<InvitationsService>;
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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            findByEmail: jest.fn(),
            findById: jest.fn(),
            findByIdWithRefreshToken: jest.fn(),
            activateUser: jest.fn(),
            updateRefreshToken: jest.fn(),
            updateLastLogin: jest.fn(),
          },
        },
        {
          provide: InvitationsService,
          useValue: {
            acceptByEmail: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue("mock-token"),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: jest.fn().mockReturnValue("test-refresh-secret"),
          },
        },
      ],
    }).compile();

    service = module.get(AuthService);
    usersService = module.get(UsersService);
    invitationsService = module.get(InvitationsService);
    jwtService = module.get(JwtService);
  });

  describe("validateOAuthUser", () => {
    const profile = {
      email: "test@example.com",
      name: "Test",
      avatarUrl: "http://avatar.url",
    };

    it("should throw AppException when no user found (invitation-only)", async () => {
      usersService.findByEmail.mockResolvedValue(null);

      await expect(service.validateOAuthUser(profile)).rejects.toThrow(
        AppException,
      );
    });

    it("should throw AppException for deactivated users", async () => {
      usersService.findByEmail.mockResolvedValue({
        ...mockUser,
        status: "deactivated",
      });

      await expect(service.validateOAuthUser(profile)).rejects.toThrow(
        AppException,
      );
    });

    it("should activate pending users and accept invitation on first login", async () => {
      const pendingUser = { ...mockUser, status: "pending" as const };
      const activatedUser = { ...mockUser, status: "active" as const };
      usersService.findByEmail.mockResolvedValue(pendingUser);
      usersService.activateUser.mockResolvedValue(activatedUser);

      const result = await service.validateOAuthUser(profile);

      expect(usersService.activateUser).toHaveBeenCalledWith(
        pendingUser.id,
        {
          name: profile.name,
          avatarUrl: profile.avatarUrl,
        },
        "system",
      );
      expect(invitationsService.acceptByEmail).toHaveBeenCalledWith(
        profile.email,
        activatedUser.id,
      );
      expect(result.status).toBe("active");
    });

    it("should update lastLoginAt for active users", async () => {
      usersService.findByEmail.mockResolvedValue(mockUser);

      await service.validateOAuthUser(profile);

      expect(usersService.updateLastLogin).toHaveBeenCalledWith(mockUser.id);
    });
  });

  describe("login", () => {
    it("should generate access and refresh tokens", async () => {
      jwtService.sign
        .mockReturnValueOnce("access-token")
        .mockReturnValueOnce("refresh-token");

      const result = await service.login(mockUser);

      expect(result).toEqual({
        accessToken: "access-token",
        refreshToken: "refresh-token",
      });
      expect(jwtService.sign).toHaveBeenCalledTimes(2);
    });

    it("should store hashed refresh token", async () => {
      jwtService.sign
        .mockReturnValueOnce("access-token")
        .mockReturnValueOnce("refresh-token");

      await service.login(mockUser);

      const expectedHash = createHash("sha256")
        .update("refresh-token")
        .digest("hex");
      expect(usersService.updateRefreshToken).toHaveBeenCalledWith(
        mockUser.id,
        expectedHash,
      );
    });
  });

  describe("refreshTokens", () => {
    const refreshToken = "valid-refresh-token";
    const hashedToken = createHash("sha256").update(refreshToken).digest("hex");

    it("should throw when user not found", async () => {
      usersService.findByIdWithRefreshToken.mockResolvedValue(null);

      await expect(
        service.refreshTokens("bad-id", refreshToken),
      ).rejects.toThrow(AppException);
    });

    it("should throw when stored refresh token is null (logged out)", async () => {
      const user: UserWithRefreshToken = { ...mockUser, refreshToken: null };
      usersService.findByIdWithRefreshToken.mockResolvedValue(user);

      await expect(
        service.refreshTokens(mockUser.id, refreshToken),
      ).rejects.toThrow(AppException);
    });

    it("should throw AppException for non-active accounts", async () => {
      const user: UserWithRefreshToken = {
        ...mockUser,
        status: "deactivated",
        refreshToken: hashedToken,
      };
      usersService.findByIdWithRefreshToken.mockResolvedValue(user);

      await expect(
        service.refreshTokens(mockUser.id, refreshToken),
      ).rejects.toThrow(AppException);
    });

    it("should throw when token hash does not match (token reuse)", async () => {
      const user: UserWithRefreshToken = {
        ...mockUser,
        refreshToken: "different-hash",
      };
      usersService.findByIdWithRefreshToken.mockResolvedValue(user);

      await expect(
        service.refreshTokens(mockUser.id, refreshToken),
      ).rejects.toThrow(AppException);
    });

    it("should rotate tokens on valid refresh", async () => {
      const user: UserWithRefreshToken = {
        ...mockUser,
        refreshToken: hashedToken,
      };
      usersService.findByIdWithRefreshToken.mockResolvedValue(user);
      jwtService.sign
        .mockReturnValueOnce("new-access")
        .mockReturnValueOnce("new-refresh");

      const result = await service.refreshTokens(mockUser.id, refreshToken);

      expect(result).toEqual({
        accessToken: "new-access",
        refreshToken: "new-refresh",
      });
    });
  });

  describe("logout", () => {
    it("should clear refresh token", async () => {
      await service.logout("user-1");

      expect(usersService.updateRefreshToken).toHaveBeenCalledWith(
        "user-1",
        null,
      );
    });
  });
});
