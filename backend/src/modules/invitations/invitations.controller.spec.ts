import { InvitationsController } from './invitations.controller';
import { InvitationsService } from './invitations.service';
import { UserEntity } from '../users/entities/user.entity';
import { InvitationEntity } from './entities/invitation.entity';

function makeUser(overrides?: Partial<UserEntity>): UserEntity {
  return {
    id: 'admin-1',
    orgId: 'org-1',
    email: 'admin@example.com',
    name: 'Admin',
    avatarUrl: null,
    isAdmin: true,
    status: 'active',
    lastLoginAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function makeInvitation(overrides?: Partial<InvitationEntity>): InvitationEntity {
  return {
    id: 'inv-1',
    orgId: 'org-1',
    email: 'new@example.com',
    invitedBy: 'admin-1',
    invitedByName: 'Admin',
    token: 'abc123',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    status: 'pending',
    createdAt: new Date(),
    teamAssignments: [
      { teamId: 'team-1', teamName: 'Engineering', role: 'member' },
    ],
    ...overrides,
  };
}

describe('InvitationsController', () => {
  let controller: InvitationsController;
  let service: jest.Mocked<InvitationsService>;

  beforeEach(() => {
    service = {
      create: jest.fn(),
      findAll: jest.fn(),
      revoke: jest.fn(),
      resend: jest.fn(),
    } as unknown as jest.Mocked<InvitationsService>;

    controller = new InvitationsController(service);
  });

  describe('create', () => {
    it('should create and return invitation', async () => {
      const invitation = makeInvitation();
      service.create.mockResolvedValue(invitation);

      const user = makeUser();
      const result = await controller.create(user, {
        email: 'new@example.com',
        teamAssignments: [{ teamId: 'team-1', role: 'member' }],
      });

      expect(result.email).toBe('new@example.com');
      expect(result.teamAssignments).toHaveLength(1);
      expect(service.create).toHaveBeenCalledWith('org-1', 'admin-1', {
        email: 'new@example.com',
        teamAssignments: [{ teamId: 'team-1', role: 'member' }],
      });
    });
  });

  describe('list', () => {
    it('should return paginated invitations', async () => {
      service.findAll.mockResolvedValue({ data: [makeInvitation()], total: 1 });

      const result = await controller.list(makeUser(), { page: 1, limit: 20 });
      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should pass status filter', async () => {
      service.findAll.mockResolvedValue({ data: [], total: 0 });

      await controller.list(makeUser(), { page: 1, limit: 20, status: 'pending' });
      expect(service.findAll).toHaveBeenCalledWith('org-1', {
        page: 1,
        limit: 20,
        status: 'pending',
      });
    });
  });

  describe('revoke', () => {
    it('should revoke and return message', async () => {
      service.revoke.mockResolvedValue(undefined);

      const result = await controller.revoke('inv-1', makeUser());
      expect(result.message).toBe('Invitation revoked');
      expect(service.revoke).toHaveBeenCalledWith('inv-1', 'org-1');
    });
  });

  describe('resend', () => {
    it('should resend and return updated invitation', async () => {
      const invitation = makeInvitation({ token: 'new-token' });
      service.resend.mockResolvedValue(invitation);

      const result = await controller.resend('inv-1', makeUser());
      expect(result.email).toBe('new@example.com');
      expect(service.resend).toHaveBeenCalledWith('inv-1', 'org-1');
    });
  });
});
