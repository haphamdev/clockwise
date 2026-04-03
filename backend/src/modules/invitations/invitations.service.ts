import { Injectable } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { ConfigService } from '@nestjs/config';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import {
  InvitationNotFoundException,
  InvitationAlreadyAcceptedException,
  InvitationAlreadyRevokedException,
  InvitationExpiredException,
  InvitationEmailAlreadyInvitedException,
  InvitationEmailAlreadyRegisteredException,
  InvitationInvalidTeamAssignmentException,
} from '../../common/exceptions/invitation.exceptions';
import { InvitationsRepository } from './invitations.repository';
import { UsersService } from '../users/users.service';
import { TeamsService } from '../teams/teams.service';
import { OrgService } from '../org/org.service';
import { MailService } from '../mail/mail.service';
import { InvitationEntity } from './entities/invitation.entity';
import { INVITATION_EMAIL_QUEUE, InvitationEmailJobData } from './invitation-email.constants';

const INVITE_EXPIRY_DAYS = 7;

@Injectable()
export class InvitationsService {
  constructor(
    private readonly invitationsRepository: InvitationsRepository,
    private readonly usersService: UsersService,
    private readonly teamsService: TeamsService,
    private readonly orgService: OrgService,
    private readonly mailService: MailService,
    private readonly configService: ConfigService,
    @InjectQueue(INVITATION_EMAIL_QUEUE) private readonly emailQueue: Queue<InvitationEmailJobData>,
  ) {}

  async create(
    orgId: string,
    invitedBy: string,
    data: {
      email: string;
      teamAssignments: Array<{ teamId: string; role: 'manager' | 'member' }>;
    },
  ): Promise<InvitationEntity> {
    const existingUser = await this.usersService.findByEmail(data.email);
    if (existingUser && existingUser.status === 'active') {
      throw new InvitationEmailAlreadyRegisteredException();
    }

    const activeInvitation = await this.invitationsRepository.findActiveByEmail(
      orgId,
      data.email,
    );
    if (activeInvitation) {
      throw new InvitationEmailAlreadyInvitedException();
    }

    await this.validateTeamAssignments(orgId, data.teamAssignments);

    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + INVITE_EXPIRY_DAYS);

    // Create a pending User record so OAuth can find them by email on first login
    if (!existingUser) {
      await this.usersService.createPendingUser(orgId, data.email, invitedBy);
    }

    const invitation = await this.invitationsRepository.create({
      orgId,
      email: data.email,
      invitedBy,
      token,
      expiresAt,
      status: 'initiated',
      teamAssignments: data.teamAssignments,
    });

    await this.queueInvitationEmail(invitation.id);

    return invitation;
  }

  async findAll(
    orgId: string,
    options: { page: number; limit: number; status?: string },
  ): Promise<{ data: InvitationEntity[]; total: number }> {
    return this.invitationsRepository.findAll(orgId, options);
  }

  async revoke(invitationId: string, orgId: string): Promise<void> {
    const invitation = await this.getInvitationOrThrow(invitationId, orgId);

    if (invitation.status === 'accepted') {
      throw new InvitationAlreadyAcceptedException();
    }
    if (invitation.status === 'revoked') {
      throw new InvitationAlreadyRevokedException();
    }
    // Allow revoking: sent, initiated, sending, failed

    await this.invitationsRepository.updateStatus(invitationId, 'revoked');
  }

  async resend(invitationId: string, orgId: string): Promise<InvitationEntity> {
    const invitation = await this.getInvitationOrThrow(invitationId, orgId);

    if (invitation.status === 'accepted') {
      throw new InvitationAlreadyAcceptedException();
    }
    if (invitation.status === 'revoked') {
      throw new InvitationAlreadyRevokedException();
    }

    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + INVITE_EXPIRY_DAYS);

    const updated = await this.invitationsRepository.updateTokenAndExpiry(
      invitationId,
      token,
      expiresAt,
      'initiated',
    );

    await this.queueInvitationEmail(invitationId);

    return updated;
  }

  async updateTeamAssignments(
    invitationId: string,
    orgId: string,
    teamAssignments: Array<{ teamId: string; role: 'manager' | 'member' }>,
  ): Promise<InvitationEntity> {
    const invitation = await this.getInvitationOrThrow(invitationId, orgId);

    if (invitation.status === 'accepted') {
      throw new InvitationAlreadyAcceptedException();
    }
    if (invitation.status === 'revoked') {
      throw new InvitationAlreadyRevokedException();
    }

    await this.validateTeamAssignments(orgId, teamAssignments);

    const isExpired = new Date() > invitation.expiresAt;

    if (isExpired) {
      const token = randomBytes(32).toString('hex');
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + INVITE_EXPIRY_DAYS);

      const updated = await this.invitationsRepository.updateTeamAssignments(
        invitationId,
        teamAssignments,
        { token, expiresAt, status: 'initiated' },
      );

      await this.queueInvitationEmail(invitationId);

      return updated;
    }

    return this.invitationsRepository.updateTeamAssignments(invitationId, teamAssignments);
  }

  async validateToken(token: string): Promise<InvitationEntity> {
    const invitation = await this.invitationsRepository.findByToken(token);
    if (!invitation) {
      throw new InvitationNotFoundException();
    }

    if (invitation.status === 'revoked') {
      throw new InvitationAlreadyRevokedException();
    }
    if (invitation.status === 'accepted') {
      throw new InvitationAlreadyAcceptedException();
    }
    if (invitation.status === 'initiated' || invitation.status === 'sending' || invitation.status === 'failed') {
      throw new InvitationNotFoundException();
    }
    if (new Date() > invitation.expiresAt) {
      throw new InvitationExpiredException();
    }

    return invitation;
  }

  async validateTokenWithOrgName(token: string): Promise<{
    invitation: InvitationEntity;
    orgName: string;
  }> {
    const invitation = await this.validateToken(token);
    const orgSettings = await this.orgService.getSettings(invitation.orgId);
    return { invitation, orgName: orgSettings.orgName };
  }

  /**
   * Called during OAuth activation to accept the invitation and create team memberships.
   * Uses email-based lookup since orgId is not available during the OAuth callback.
   */
  async acceptByEmail(email: string, userId: string): Promise<void> {
    const invitation = await this.invitationsRepository.findActiveByEmailAnyOrg(email);
    if (!invitation) {
      return;
    }

    await this.invitationsRepository.acceptInvitation(invitation.id, userId);
  }

  private async getInvitationOrThrow(
    invitationId: string,
    orgId: string,
  ): Promise<InvitationEntity> {
    const invitation = await this.invitationsRepository.findById(invitationId);
    if (!invitation || invitation.orgId !== orgId) {
      throw new InvitationNotFoundException();
    }
    return invitation;
  }

  private async validateTeamAssignments(
    orgId: string,
    assignments: Array<{ teamId: string; role: 'manager' | 'member' }>,
  ): Promise<void> {
    const uniqueTeamIds = new Set(assignments.map((a) => a.teamId));
    if (uniqueTeamIds.size !== assignments.length) {
      throw new InvitationInvalidTeamAssignmentException();
    }

    for (const assignment of assignments) {
      try {
        await this.teamsService.validateTeamExists(assignment.teamId, orgId);
      } catch {
        throw new InvitationInvalidTeamAssignmentException();
      }
    }
  }

  async findActiveByEmail(orgId: string, email: string): Promise<InvitationEntity | null> {
    return this.invitationsRepository.findActiveByEmail(orgId, email);
  }

  /** Create an invitation from an import row.
   *  Active-user, duplicate-invitation, and team-existence checks are
   *  pre-validated by the import processor — intentionally skipped here. */
  async createForImport(
    orgId: string,
    invitedBy: string,
    data: {
      email: string;
      teamAssignments: Array<{ teamId: string; role: 'manager' | 'member' }>;
    },
  ): Promise<InvitationEntity> {
    const existingUser = await this.usersService.findByEmail(data.email);
    if (!existingUser) {
      await this.usersService.createPendingUser(orgId, data.email, invitedBy, 'import');
    }

    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + INVITE_EXPIRY_DAYS);

    return this.invitationsRepository.create({
      orgId,
      email: data.email,
      invitedBy,
      token,
      expiresAt,
      status: 'initiated',
      teamAssignments: data.teamAssignments,
    });
  }

  async sendInvitationEmail(orgId: string, invitation: InvitationEntity): Promise<void> {
    const orgSettings = await this.orgService.getSettings(orgId);
    const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:5173');
    const inviteUrl = `${frontendUrl}/invite/${invitation.token}`;
    await this.mailService.sendInvitationEmail(invitation.email, inviteUrl, orgSettings.orgName);
  }

  /** Public so import processors can queue emails after creating invitations. */
  async queueInvitationEmail(invitationId: string): Promise<void> {
    await this.emailQueue.add('send-invitation-email', { invitationId }, {
      attempts: 1,
      removeOnComplete: { age: 3600 },
      removeOnFail: { age: 7200 },
    });
  }
}
