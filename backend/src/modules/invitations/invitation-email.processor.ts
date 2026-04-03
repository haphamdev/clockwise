import { Logger } from '@nestjs/common';
import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { INVITATION_EMAIL_QUEUE, InvitationEmailJobData } from './invitation-email.constants';
import { InvitationsService } from './invitations.service';
import { InvitationsRepository } from './invitations.repository';

@Processor(INVITATION_EMAIL_QUEUE, { concurrency: 3 })
export class InvitationEmailProcessor extends WorkerHost {
  private readonly logger = new Logger(InvitationEmailProcessor.name);

  constructor(
    private readonly invitationsService: InvitationsService,
    private readonly invitationsRepository: InvitationsRepository,
  ) {
    super();
  }

  async process(job: Job<InvitationEmailJobData>): Promise<void> {
    const { invitationId } = job.data;

    // CAS: only claim if still 'initiated' (guards against concurrent resend/revoke)
    const claimed = await this.invitationsRepository.updateStatusIf(invitationId, 'initiated', 'sending');
    if (!claimed) {
      this.logger.warn(`Invitation ${invitationId} not in 'initiated' state, skipping`);
      return;
    }

    // Re-read to get fresh token (may have been updated by concurrent resend before we claimed)
    const invitation = await this.invitationsRepository.findById(invitationId);
    if (!invitation || invitation.status !== 'sending') {
      this.logger.warn(`Invitation ${invitationId} was modified after claiming, skipping`);
      return;
    }

    await this.invitationsService.sendInvitationEmail(invitation.orgId, invitation);

    // CAS: only mark sent if still sending (respects concurrent revoke)
    const sent = await this.invitationsRepository.updateStatusIf(invitationId, 'sending', 'sent');
    if (!sent) {
      this.logger.warn(`Invitation ${invitationId} status changed during send, not marking as sent`);
    }
  }

  @OnWorkerEvent('failed')
  async onFailed(job: Job<InvitationEmailJobData>, error: Error): Promise<void> {
    this.logger.error(
      `Invitation email job ${job.id} (invitation=${job.data.invitationId}) failed: ${error.message}`,
      error.stack,
    );

    try {
      await this.invitationsRepository.updateStatusIf(job.data.invitationId, 'sending', 'failed');
    } catch (updateError) {
      this.logger.error(
        `Failed to update invitation ${job.data.invitationId} to failed: ${updateError.message}`,
      );
    }
  }
}
