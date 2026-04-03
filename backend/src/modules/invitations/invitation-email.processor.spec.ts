import { Job } from 'bullmq';
import { InvitationEmailProcessor } from './invitation-email.processor';
import { InvitationEmailJobData } from './invitation-email.constants';
import { InvitationsService } from './invitations.service';
import { InvitationsRepository } from './invitations.repository';
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
    status: 'initiated',
    createdAt: new Date(),
    teamAssignments: [{ teamId: 'team-1', teamName: 'Engineering', role: 'member' }],
    ...overrides,
  };
}

function makeJob(data: InvitationEmailJobData): Job<InvitationEmailJobData> {
  return { id: 'job-1', data } as unknown as Job<InvitationEmailJobData>;
}

describe('InvitationEmailProcessor', () => {
  let processor: InvitationEmailProcessor;
  let service: jest.Mocked<InvitationsService>;
  let repo: jest.Mocked<InvitationsRepository>;

  beforeEach(() => {
    service = {
      sendInvitationEmail: jest.fn(),
    } as unknown as jest.Mocked<InvitationsService>;

    repo = {
      findById: jest.fn(),
      updateStatusIf: jest.fn(),
    } as unknown as jest.Mocked<InvitationsRepository>;

    processor = new InvitationEmailProcessor(service, repo);
    jest.spyOn(processor['logger'], 'error').mockImplementation();
    jest.spyOn(processor['logger'], 'warn').mockImplementation();
  });

  describe('process', () => {
    it('should send email and transition initiated → sending → sent', async () => {
      const invitation = makeInvitation({ status: 'sending' });
      repo.updateStatusIf.mockResolvedValue(true);
      repo.findById.mockResolvedValue(invitation);
      const job = makeJob({ invitationId: 'inv-1' });

      await processor.process(job);

      expect(repo.updateStatusIf).toHaveBeenCalledWith('inv-1', 'initiated', 'sending');
      expect(repo.findById).toHaveBeenCalledWith('inv-1');
      expect(service.sendInvitationEmail).toHaveBeenCalledWith('org-1', invitation);
      expect(repo.updateStatusIf).toHaveBeenCalledWith('inv-1', 'sending', 'sent');
    });

    it('should skip if CAS initiated → sending fails (concurrent modification)', async () => {
      repo.updateStatusIf.mockResolvedValue(false);
      const job = makeJob({ invitationId: 'inv-1' });

      await processor.process(job);

      expect(repo.findById).not.toHaveBeenCalled();
      expect(service.sendInvitationEmail).not.toHaveBeenCalled();
    });

    it('should skip if invitation not found after claiming', async () => {
      repo.updateStatusIf.mockResolvedValue(true);
      repo.findById.mockResolvedValue(null);
      const job = makeJob({ invitationId: 'inv-1' });

      await processor.process(job);

      expect(service.sendInvitationEmail).not.toHaveBeenCalled();
    });

    it('should skip if status changed between CAS and re-read', async () => {
      repo.updateStatusIf.mockResolvedValue(true);
      repo.findById.mockResolvedValue(makeInvitation({ status: 'initiated' }));
      const job = makeJob({ invitationId: 'inv-1' });

      await processor.process(job);

      expect(service.sendInvitationEmail).not.toHaveBeenCalled();
    });

    it('should not mark as sent if revoked during email send', async () => {
      const invitation = makeInvitation({ status: 'sending' });
      repo.updateStatusIf
        .mockResolvedValueOnce(true)   // initiated → sending
        .mockResolvedValueOnce(false); // sending → sent fails (was revoked)
      repo.findById.mockResolvedValue(invitation);
      const job = makeJob({ invitationId: 'inv-1' });

      await processor.process(job);

      expect(service.sendInvitationEmail).toHaveBeenCalledWith('org-1', invitation);
      expect(repo.updateStatusIf).toHaveBeenCalledWith('inv-1', 'sending', 'sent');
    });
  });

  describe('onFailed', () => {
    it('should set invitation status to failed via CAS', async () => {
      repo.updateStatusIf.mockResolvedValue(true);
      const job = makeJob({ invitationId: 'inv-1' });
      const error = new Error('SMTP error');

      await processor.onFailed(job, error);

      expect(repo.updateStatusIf).toHaveBeenCalledWith('inv-1', 'sending', 'failed');
    });

    it('should not throw when updateStatusIf fails', async () => {
      repo.updateStatusIf.mockRejectedValue(new Error('DB connection lost'));
      const job = makeJob({ invitationId: 'inv-1' });
      const error = new Error('SMTP error');

      await expect(processor.onFailed(job, error)).resolves.not.toThrow();
    });
  });
});
