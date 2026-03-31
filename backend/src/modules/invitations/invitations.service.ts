import { Injectable } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { ConfigService } from '@nestjs/config';
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

    const pendingInvitation = await this.invitationsRepository.findPendingByEmail(orgId, data.email);
    if (pendingInvitation) {
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
      teamAssignments: data.teamAssignments,
    });

    await this.sendInvitationEmail(orgId, invitation);

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
    );

    await this.sendInvitationEmail(orgId, updated);

    return updated;
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
    const invitation = await this.invitationsRepository.findPendingByEmailAnyOrg(email);
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
    for (const assignment of assignments) {
      try {
        await this.teamsService.validateTeamExists(assignment.teamId, orgId);
      } catch {
        throw new InvitationInvalidTeamAssignmentException();
      }
    }
  }

  private async sendInvitationEmail(orgId: string, invitation: InvitationEntity): Promise<void> {
    const orgSettings = await this.orgService.getSettings(orgId);
    const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:5173');
    const inviteUrl = `${frontendUrl}/invite/${invitation.token}`;
    await this.mailService.sendInvitationEmail(invitation.email, inviteUrl, orgSettings.orgName);
  }
}
