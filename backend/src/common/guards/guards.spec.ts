import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IsAdminGuard } from './is-admin.guard';
import { RolesGuard } from './roles.guard';
import { TeamMemberGuard } from './team-member.guard';
import { IsProjectOwnerGuard } from './is-project-owner.guard';
import { AppException } from '../exceptions';
import { PrismaService } from '../../prisma/prisma.service';

interface MockUser {
  id: string;
  isAdmin: boolean;
}

// Helper to build a mock ExecutionContext
function createMockContext(overrides: {
  user?: MockUser;
  params?: Record<string, string>;
}): ExecutionContext {
  const request = {
    user: overrides.user,
    params: overrides.params ?? {},
  };
  return {
    switchToHttp: () => ({ getRequest: () => request }),
    getHandler: () => jest.fn(),
    getClass: () => jest.fn(),
  } as unknown as ExecutionContext;
}

describe('IsAdminGuard', () => {
  const guard = new IsAdminGuard();

  it('should allow admin users', () => {
    const ctx = createMockContext({ user: { id: '1', isAdmin: true } });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('should deny non-admin users', () => {
    const ctx = createMockContext({ user: { id: '1', isAdmin: false } });
    expect(() => guard.canActivate(ctx)).toThrow(AppException);
  });

  it('should deny when no user', () => {
    const ctx = createMockContext({ user: undefined });
    expect(() => guard.canActivate(ctx)).toThrow(AppException);
  });
});

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: jest.Mocked<Pick<Reflector, 'getAllAndOverride'>>;
  let prisma: { teamMember: { findUnique: jest.Mock } };

  beforeEach(() => {
    reflector = { getAllAndOverride: jest.fn() };
    prisma = { teamMember: { findUnique: jest.fn() } };
    guard = new RolesGuard(reflector as unknown as Reflector, prisma as unknown as PrismaService);
  });

  it('should allow when no roles required', async () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);
    const ctx = createMockContext({ user: { id: '1', isAdmin: false } });

    expect(await guard.canActivate(ctx)).toBe(true);
  });

  it('should allow admin regardless of role', async () => {
    reflector.getAllAndOverride.mockReturnValue(['manager']);
    const ctx = createMockContext({
      user: { id: '1', isAdmin: true },
      params: { teamId: 'team-1' },
    });

    expect(await guard.canActivate(ctx)).toBe(true);
    expect(prisma.teamMember.findUnique).not.toHaveBeenCalled();
  });

  it('should deny when no teamId param', async () => {
    reflector.getAllAndOverride.mockReturnValue(['manager']);
    const ctx = createMockContext({
      user: { id: '1', isAdmin: false },
      params: {},
    });

    await expect(guard.canActivate(ctx)).rejects.toThrow(AppException);
  });

  it('should deny when user has wrong role', async () => {
    reflector.getAllAndOverride.mockReturnValue(['manager']);
    prisma.teamMember.findUnique.mockResolvedValue({ role: 'member' });
    const ctx = createMockContext({
      user: { id: '1', isAdmin: false },
      params: { teamId: 'team-1' },
    });

    await expect(guard.canActivate(ctx)).rejects.toThrow(AppException);
  });

  it('should deny when user is not a team member', async () => {
    reflector.getAllAndOverride.mockReturnValue(['manager']);
    prisma.teamMember.findUnique.mockResolvedValue(null);
    const ctx = createMockContext({
      user: { id: '1', isAdmin: false },
      params: { teamId: 'team-1' },
    });

    await expect(guard.canActivate(ctx)).rejects.toThrow(AppException);
  });

  it('should allow when user has required role', async () => {
    reflector.getAllAndOverride.mockReturnValue(['manager']);
    prisma.teamMember.findUnique.mockResolvedValue({ role: 'manager' });
    const ctx = createMockContext({
      user: { id: '1', isAdmin: false },
      params: { teamId: 'team-1' },
    });

    expect(await guard.canActivate(ctx)).toBe(true);
  });
});

describe('TeamMemberGuard', () => {
  let guard: TeamMemberGuard;
  let prisma: { teamMember: { findUnique: jest.Mock } };

  beforeEach(() => {
    prisma = { teamMember: { findUnique: jest.fn() } };
    guard = new TeamMemberGuard(prisma as unknown as PrismaService);
  });

  it('should allow admin without checking membership', async () => {
    const ctx = createMockContext({
      user: { id: '1', isAdmin: true },
      params: { teamId: 'team-1' },
    });

    expect(await guard.canActivate(ctx)).toBe(true);
    expect(prisma.teamMember.findUnique).not.toHaveBeenCalled();
  });

  it('should allow team members', async () => {
    prisma.teamMember.findUnique.mockResolvedValue({ id: 'tm-1' });
    const ctx = createMockContext({
      user: { id: '1', isAdmin: false },
      params: { teamId: 'team-1' },
    });

    expect(await guard.canActivate(ctx)).toBe(true);
  });

  it('should deny non-members', async () => {
    prisma.teamMember.findUnique.mockResolvedValue(null);
    const ctx = createMockContext({
      user: { id: '1', isAdmin: false },
      params: { teamId: 'team-1' },
    });

    await expect(guard.canActivate(ctx)).rejects.toThrow(AppException);
  });

  it('should deny when no teamId param', async () => {
    const ctx = createMockContext({
      user: { id: '1', isAdmin: false },
      params: {},
    });

    await expect(guard.canActivate(ctx)).rejects.toThrow(AppException);
  });
});

describe('IsProjectOwnerGuard', () => {
  let guard: IsProjectOwnerGuard;
  let prisma: { project: { findUnique: jest.Mock } };

  beforeEach(() => {
    prisma = { project: { findUnique: jest.fn() } };
    guard = new IsProjectOwnerGuard(prisma as unknown as PrismaService);
  });

  it('should allow admin without checking ownership', async () => {
    const ctx = createMockContext({
      user: { id: '1', isAdmin: true },
      params: { projectId: 'proj-1' },
    });

    expect(await guard.canActivate(ctx)).toBe(true);
    expect(prisma.project.findUnique).not.toHaveBeenCalled();
  });

  it('should allow project owner', async () => {
    prisma.project.findUnique.mockResolvedValue({ ownerId: 'user-1' });
    const ctx = createMockContext({
      user: { id: 'user-1', isAdmin: false },
      params: { projectId: 'proj-1' },
    });

    expect(await guard.canActivate(ctx)).toBe(true);
  });

  it('should deny non-owner', async () => {
    prisma.project.findUnique.mockResolvedValue({ ownerId: 'other-user' });
    const ctx = createMockContext({
      user: { id: 'user-1', isAdmin: false },
      params: { projectId: 'proj-1' },
    });

    await expect(guard.canActivate(ctx)).rejects.toThrow(AppException);
  });

  it('should throw AppException when project does not exist', async () => {
    prisma.project.findUnique.mockResolvedValue(null);
    const ctx = createMockContext({
      user: { id: 'user-1', isAdmin: false },
      params: { projectId: 'bad-id' },
    });

    await expect(guard.canActivate(ctx)).rejects.toThrow(AppException);
  });

  it('should use :id param as fallback for :projectId', async () => {
    prisma.project.findUnique.mockResolvedValue({ ownerId: 'user-1' });
    const ctx = createMockContext({
      user: { id: 'user-1', isAdmin: false },
      params: { id: 'proj-1' },
    });

    expect(await guard.canActivate(ctx)).toBe(true);
    expect(prisma.project.findUnique).toHaveBeenCalledWith({
      where: { id: 'proj-1' },
      select: { ownerId: true },
    });
  });
});
