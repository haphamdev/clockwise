import { Injectable } from '@nestjs/common';
import { Invitation, InvitationTeamAssignment } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  InvitationEntity,
  InvitationTeamAssignmentEntity,
} from './entities/invitation.entity';

type InvitationWithRelations = Invitation & {
  sender: { name: string };
  teamAssignments: Array<
    InvitationTeamAssignment & {
      team: { id: string; name: string };
    }
  >;
};

const INVITATION_INCLUDE = {
  sender: { select: { name: true } },
  teamAssignments: {
    include: { team: { select: { id: true, name: true } } },
  },
} as const;

@Injectable()
export class InvitationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    orgId: string;
    email: string;
    invitedBy: string;
    token: string;
    expiresAt: Date;
    teamAssignments: Array<{ teamId: string; role: 'manager' | 'member' }>;
  }): Promise<InvitationEntity> {
    const invitation = await this.prisma.invitation.create({
      data: {
        orgId: data.orgId,
        email: data.email,
        invitedBy: data.invitedBy,
        token: data.token,
        expiresAt: data.expiresAt,
        teamAssignments: {
          create: data.teamAssignments.map((ta) => ({
            teamId: ta.teamId,
            role: ta.role,
          })),
        },
      },
      include: INVITATION_INCLUDE,
    });

    return this.toEntity(invitation as InvitationWithRelations);
  }

  async findAll(
    orgId: string,
    options: { page: number; limit: number; status?: string },
  ): Promise<{ data: InvitationEntity[]; total: number }> {
    const where = {
      orgId,
      ...(options.status && { status: options.status as 'pending' | 'accepted' | 'revoked' }),
    };

    const [invitations, total] = await Promise.all([
      this.prisma.invitation.findMany({
        where,
        include: INVITATION_INCLUDE,
        orderBy: { createdAt: 'desc' },
        skip: (options.page - 1) * options.limit,
        take: options.limit,
      }),
      this.prisma.invitation.count({ where }),
    ]);

    return {
      data: invitations.map((i) => this.toEntity(i as InvitationWithRelations)),
      total,
    };
  }

  async findById(id: string): Promise<InvitationEntity | null> {
    const invitation = await this.prisma.invitation.findUnique({
      where: { id },
      include: INVITATION_INCLUDE,
    });

    return invitation ? this.toEntity(invitation as InvitationWithRelations) : null;
  }

  async findByToken(token: string): Promise<InvitationEntity | null> {
    const invitation = await this.prisma.invitation.findUnique({
      where: { token },
      include: INVITATION_INCLUDE,
    });

    return invitation ? this.toEntity(invitation as InvitationWithRelations) : null;
  }

  async findPendingByEmail(orgId: string, email: string): Promise<InvitationEntity | null> {
    const invitation = await this.prisma.invitation.findFirst({
      where: { orgId, email, status: 'pending', expiresAt: { gt: new Date() } },
      include: INVITATION_INCLUDE,
    });

    return invitation ? this.toEntity(invitation as InvitationWithRelations) : null;
  }

  /**
   * Finds a pending, non-expired invitation by email without org scoping.
   * Used during OAuth callback where only the email is known.
   */
  async findPendingByEmailAnyOrg(email: string): Promise<InvitationEntity | null> {
    const invitation = await this.prisma.invitation.findFirst({
      where: { email, status: 'pending', expiresAt: { gt: new Date() } },
      include: INVITATION_INCLUDE,
    });

    return invitation ? this.toEntity(invitation as InvitationWithRelations) : null;
  }

  async updateStatus(id: string, status: 'accepted' | 'revoked'): Promise<void> {
    await this.prisma.invitation.update({
      where: { id },
      data: { status },
    });
  }

  async updateTokenAndExpiry(id: string, token: string, expiresAt: Date): Promise<InvitationEntity> {
    const invitation = await this.prisma.invitation.update({
      where: { id },
      data: { token, expiresAt },
      include: INVITATION_INCLUDE,
    });

    return this.toEntity(invitation as InvitationWithRelations);
  }

  private toEntity(invitation: InvitationWithRelations): InvitationEntity {
    return {
      id: invitation.id,
      orgId: invitation.orgId,
      email: invitation.email,
      invitedBy: invitation.invitedBy,
      invitedByName: invitation.sender.name,
      token: invitation.token,
      expiresAt: invitation.expiresAt,
      status: invitation.status as InvitationEntity['status'],
      createdAt: invitation.createdAt,
      teamAssignments: invitation.teamAssignments.map(
        (ta): InvitationTeamAssignmentEntity => ({
          teamId: ta.team.id,
          teamName: ta.team.name,
          role: ta.role as 'manager' | 'member',
        }),
      ),
    };
  }
}
