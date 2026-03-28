import { AppException } from '../../../common';
import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy';
import { UsersService } from '../../users/users.service';
import { UserWithTeams } from '../../users/entities/user.entity';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let usersService: jest.Mocked<UsersService>;

  const mockUserWithTeams: UserWithTeams = {
    id: 'user-1',
    orgId: 'org-1',
    email: 'test@example.com',
    name: 'Test User',
    avatarUrl: null,
    isAdmin: false,
    status: 'active',
    lastLoginAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    teamMemberships: [],
  };

  beforeEach(() => {
    usersService = {
      findById: jest.fn(),
    } as unknown as jest.Mocked<UsersService>;

    const configService = {
      getOrThrow: jest.fn().mockReturnValue('test-jwt-secret'),
    } as unknown as ConfigService;

    strategy = new JwtStrategy(usersService, configService);
  });

  it('should return user for valid active user', async () => {
    usersService.findById.mockResolvedValue(mockUserWithTeams);

    const result = await strategy.validate({ sub: 'user-1', email: 'test@example.com', isAdmin: false });

    expect(result).toEqual(mockUserWithTeams);
  });

  it('should throw when user not found', async () => {
    usersService.findById.mockResolvedValue(null);

    await expect(
      strategy.validate({ sub: 'bad-id', email: 'x@x.com', isAdmin: false }),
    ).rejects.toThrow(AppException);
  });

  it('should throw for deactivated user', async () => {
    usersService.findById.mockResolvedValue({
      ...mockUserWithTeams,
      status: 'deactivated',
    });

    await expect(
      strategy.validate({ sub: 'user-1', email: 'test@example.com', isAdmin: false }),
    ).rejects.toThrow(AppException);
  });

  it('should throw for pending user', async () => {
    usersService.findById.mockResolvedValue({
      ...mockUserWithTeams,
      status: 'pending',
    });

    await expect(
      strategy.validate({ sub: 'user-1', email: 'test@example.com', isAdmin: false }),
    ).rejects.toThrow(AppException);
  });
});
