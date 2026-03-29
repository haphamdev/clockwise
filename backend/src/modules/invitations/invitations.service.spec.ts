import { ConfigService } from '@nestjs/config';
import { ErrorCode } from '../../common/exceptions/error-codes';
import { InvitationsService } from './invitations.service';
import { InvitationsRepository } from './invitations.repository';
import { UsersService } from '../users/users.service';
import { TeamsService } from '../teams/teams.service';
import { MailService } from '../mail/mail.service';
import { InvitationEntity } from './entities/invitation.entity';

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

describe('InvitationsService', () => {
  let service: InvitationsService;
  let repo: jest.Mocked<InvitationsRepository>;
  let usersService: jest.Mocked<UsersService>;
  let teamsService: jest.Mocked<TeamsService>;
  let mailService: jest.Mocked<MailService>;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(() => {
    repo = {
      create: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
      findByToken: jest.fn(),
      findPendingByEmail: jest.fn(),
      findPendingByEmailAnyOrg: jest.fn(),
      updateStatus: jest.fn(),
      updateTokenAndExpiry: jest.fn(),
    } as unknown as jest.Mocked<InvitationsRepository>;

    usersService = {
      findByEmail: jest.fn(),
    } as unknown as jest.Mocked<UsersService>;

    teamsService = {
      findById: jest.fn(),
    } as unknown as jest.Mocked<TeamsService>;

    mailService = {
      sendInvitationEmail: jest.fn(),
    } as unknown as jest.Mocked<MailService>;

    configService = {
      get: jest.fn().mockReturnValue('http://localhost:5173'),
    } as unknown as jest.Mocked<ConfigService>;

    service = new InvitationsService(
      repo,
      usersService,
      teamsService,
      mailService,
      configService,
    );
  });

  describe('create', () => {
    const createData = {
      email: 'new@example.com',
      teamAssignments: [{ teamId: 'team-1', role: 'member' as const }],
    };

    it('should create invitation and send email', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      repo.findPendingByEmail.mockResolvedValue(null);
      teamsService.findById.mockResolvedValue({} as never);
      const invitation = makeInvitation();
      repo.create.mockResolvedValue(invitation);

      const res = await service.create('org-1', 'admin-1', createData);
      expect(res).toEqual(invitation);
      expect(mailService.sendInvitationEmail).toHaveBeenCalled();
    });

    it('should throw EMAIL_ALREADY_REGISTERED for active user', async () => {
      usersService.findByEmail.mockResolvedValue({
        id: 'u-1',
        orgId: 'org-1',
        email: 'new@example.com',
        name: 'Existing',
        avatarUrl: null,
        isAdmin: false,
        status: 'active',
        lastLoginAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await expect(service.create('org-1', 'admin-1', createData)).rejects.toThrow(
        expect.objectContaining({ code: ErrorCode.INVITATION.EMAIL_ALREADY_REGISTERED }),
      );
    });

    it('should throw EMAIL_ALREADY_INVITED for pending invitation', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      repo.findPendingByEmail.mockResolvedValue(makeInvitation());

      await expect(service.create('org-1', 'admin-1', createData)).rejects.toThrow(
        expect.objectContaining({ code: ErrorCode.INVITATION.EMAIL_ALREADY_INVITED }),
      );
    });

    it('should throw INVALID_TEAM_ASSIGNMENT for bad team', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      repo.findPendingByEmail.mockResolvedValue(null);
      teamsService.findById.mockRejectedValue(new Error('not found'));

      await expect(service.create('org-1', 'admin-1', createData)).rejects.toThrow(
        expect.objectContaining({ code: ErrorCode.INVITATION.INVALID_TEAM_ASSIGNMENT }),
      );
    });
  });

  describe('findAll', () => {
    it('should return paginated invitations', async () => {
      const result = { data: [makeInvitation()], total: 1 };
      repo.findAll.mockResolvedValue(result);

      const res = await service.findAll('org-1', { page: 1, limit: 20 });
      expect(res).toEqual(result);
    });
  });

  describe('revoke', () => {
    it('should revoke a pending invitation', async () => {
      repo.findById.mockResolvedValue(makeInvitation());
      repo.updateStatus.mockResolvedValue(undefined);

      await service.revoke('inv-1', 'org-1');
      expect(repo.updateStatus).toHaveBeenCalledWith('inv-1', 'revoked');
    });

    it('should throw ALREADY_ACCEPTED', async () => {
      repo.findById.mockResolvedValue(makeInvitation({ status: 'accepted' }));

      await expect(service.revoke('inv-1', 'org-1')).rejects.toThrow(
        expect.objectContaining({ code: ErrorCode.INVITATION.ALREADY_ACCEPTED }),
      );
    });

    it('should throw ALREADY_REVOKED', async () => {
      repo.findById.mockResolvedValue(makeInvitation({ status: 'revoked' }));

      await expect(service.revoke('inv-1', 'org-1')).rejects.toThrow(
        expect.objectContaining({ code: ErrorCode.INVITATION.ALREADY_REVOKED }),
      );
    });

    it('should throw NOT_FOUND for wrong org', async () => {
      repo.findById.mockResolvedValue(makeInvitation({ orgId: 'other-org' }));

      await expect(service.revoke('inv-1', 'org-1')).rejects.toThrow(
        expect.objectContaining({ code: ErrorCode.INVITATION.NOT_FOUND }),
      );
    });
  });

  describe('resend', () => {
    it('should resend with new token and expiry', async () => {
      repo.findById.mockResolvedValue(makeInvitation());
      const updated = makeInvitation({ token: 'new-token' });
      repo.updateTokenAndExpiry.mockResolvedValue(updated);

      const res = await service.resend('inv-1', 'org-1');
      expect(res.token).toBe('new-token');
      expect(mailService.sendInvitationEmail).toHaveBeenCalled();
    });

    it('should throw ALREADY_ACCEPTED', async () => {
      repo.findById.mockResolvedValue(makeInvitation({ status: 'accepted' }));

      await expect(service.resend('inv-1', 'org-1')).rejects.toThrow(
        expect.objectContaining({ code: ErrorCode.INVITATION.ALREADY_ACCEPTED }),
      );
    });
  });

  describe('validateToken', () => {
    it('should return invitation for valid token', async () => {
      const invitation = makeInvitation();
      repo.findByToken.mockResolvedValue(invitation);

      const res = await service.validateToken('abc123');
      expect(res).toEqual(invitation);
    });

    it('should throw NOT_FOUND for unknown token', async () => {
      repo.findByToken.mockResolvedValue(null);

      await expect(service.validateToken('bad-token')).rejects.toThrow(
        expect.objectContaining({ code: ErrorCode.INVITATION.NOT_FOUND }),
      );
    });

    it('should throw EXPIRED for expired invitation', async () => {
      repo.findByToken.mockResolvedValue(
        makeInvitation({ expiresAt: new Date(Date.now() - 1000) }),
      );

      await expect(service.validateToken('abc123')).rejects.toThrow(
        expect.objectContaining({ code: ErrorCode.INVITATION.EXPIRED }),
      );
    });

    it('should throw ALREADY_REVOKED for revoked invitation', async () => {
      repo.findByToken.mockResolvedValue(makeInvitation({ status: 'revoked' }));

      await expect(service.validateToken('abc123')).rejects.toThrow(
        expect.objectContaining({ code: ErrorCode.INVITATION.ALREADY_REVOKED }),
      );
    });
  });

  describe('acceptByEmail', () => {
    it('should mark invitation as accepted', async () => {
      repo.findPendingByEmailAnyOrg.mockResolvedValue(makeInvitation());
      repo.updateStatus.mockResolvedValue(undefined);

      await service.acceptByEmail('new@example.com');
      expect(repo.updateStatus).toHaveBeenCalledWith('inv-1', 'accepted');
    });

    it('should do nothing when no pending invitation', async () => {
      repo.findPendingByEmailAnyOrg.mockResolvedValue(null);

      await service.acceptByEmail('unknown@example.com');
      expect(repo.updateStatus).not.toHaveBeenCalled();
    });
  });
});
