import { Injectable } from "@nestjs/common";
import { Invitation, InvitationTeamAssignment } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { AuditLogService } from "../audit-log/audit-log.service";
import {
  InvitationEntity,
  InvitationTeamAssignmentEntity,
} from "./entities/invitation.entity";

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
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogService: AuditLogService,
  ) {}

  async create(data: {
    orgId: string;
    email: string;
    invitedBy: string;
    token: string;
    expiresAt: Date;
    status: InvitationEntity["status"];
    teamAssignments: Array<{ teamId: string; role: "manager" | "member" }>;
  }): Promise<InvitationEntity> {
    const invitation = await this.prisma.invitation.create({
      data: {
        orgId: data.orgId,
        email: data.email,
        invitedBy: data.invitedBy,
        token: data.token,
        expiresAt: data.expiresAt,
        status: data.status,
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
      ...(options.status && {
        status: options.status as InvitationEntity["status"],
      }),
    };

    const [invitations, total] = await Promise.all([
      this.prisma.invitation.findMany({
        where,
        include: INVITATION_INCLUDE,
        orderBy: { createdAt: "desc" },
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

    return invitation
      ? this.toEntity(invitation as InvitationWithRelations)
      : null;
  }

  async findByToken(token: string): Promise<InvitationEntity | null> {
    const invitation = await this.prisma.invitation.findUnique({
      where: { token },
      include: INVITATION_INCLUDE,
    });

    return invitation
      ? this.toEntity(invitation as InvitationWithRelations)
      : null;
  }

  async findActiveByEmail(
    orgId: string,
    email: string,
  ): Promise<InvitationEntity | null> {
    const invitation = await this.prisma.invitation.findFirst({
      where: {
        orgId,
        email,
        status: { in: ["initiated", "sending", "sent", "failed"] },
        expiresAt: { gt: new Date() },
      },
      include: INVITATION_INCLUDE,
    });

    return invitation
      ? this.toEntity(invitation as InvitationWithRelations)
      : null;
  }

  /**
   * Finds an active, non-expired invitation by email without org scoping.
   * Used during OAuth callback where only the email is known.
   */
  async findActiveByEmailAnyOrg(
    email: string,
  ): Promise<InvitationEntity | null> {
    const invitation = await this.prisma.invitation.findFirst({
      where: {
        email,
        status: { in: ["initiated", "sending", "sent", "failed"] },
        expiresAt: { gt: new Date() },
      },
      include: INVITATION_INCLUDE,
    });

    return invitation
      ? this.toEntity(invitation as InvitationWithRelations)
      : null;
  }

  async updateStatus(
    id: string,
    status: InvitationEntity["status"],
  ): Promise<void> {
    await this.prisma.invitation.update({
      where: { id },
      data: { status },
    });
  }

  /**
   * Conditional status update (CAS). Only updates if current status matches expectedStatus.
   * Returns true if the row was updated, false if the status had already changed.
   */
  async updateStatusIf(
    id: string,
    expectedStatus: InvitationEntity["status"],
    newStatus: InvitationEntity["status"],
  ): Promise<boolean> {
    const result = await this.prisma.invitation.updateMany({
      where: { id, status: expectedStatus },
      data: { status: newStatus },
    });
    return result.count > 0;
  }

  /**
   * Marks invitation as accepted and creates TeamMember rows from team assignments.
   * Runs in a transaction to ensure atomicity.
   */
  async acceptInvitation(invitationId: string, userId: string): Promise<void> {
    const invitation = await this.prisma.invitation.findUnique({
      where: { id: invitationId },
      include: {
        teamAssignments: {
          include: { team: { select: { id: true, name: true } } },
        },
      },
    });

    if (!invitation) return;

    await this.prisma.$transaction(async (tx) => {
      await tx.invitation.update({
        where: { id: invitationId },
        data: { status: "accepted" },
      });

      for (const ta of invitation.teamAssignments) {
        await tx.teamMember.upsert({
          where: { teamId_userId: { teamId: ta.teamId, userId } },
          create: { teamId: ta.teamId, userId, role: ta.role },
          update: { role: ta.role },
        });
      }

      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { name: true },
      });
      const userName = user?.name ?? invitation.email;

      const auditInputs = invitation.teamAssignments.flatMap((ta) => {
        const meta = {
          after: {
            userId,
            userName,
            role: ta.role,
            teamId: ta.team.id,
            teamName: ta.team.name,
          },
        };
        return [
          {
            orgId: invitation.orgId,
            entityType: "team" as const,
            entityId: ta.team.id,
            action: "member_added",
            performedBy: "system",
            metadata: meta,
          },
          {
            orgId: invitation.orgId,
            entityType: "user" as const,
            entityId: userId,
            action: "member_added",
            performedBy: "system",
            metadata: meta,
          },
        ];
      });

      await this.auditLogService.logInTransaction(tx, auditInputs);
    });
  }

  async updateTeamAssignments(
    invitationId: string,
    teamAssignments: Array<{ teamId: string; role: "manager" | "member" }>,
    resend?: {
      token: string;
      expiresAt: Date;
      status: InvitationEntity["status"];
    },
  ): Promise<InvitationEntity> {
    const invitation = await this.prisma.$transaction(async (tx) => {
      await tx.invitationTeamAssignment.deleteMany({ where: { invitationId } });

      await tx.invitationTeamAssignment.createMany({
        data: teamAssignments.map((ta) => ({
          invitationId,
          teamId: ta.teamId,
          role: ta.role,
        })),
      });

      if (resend) {
        await tx.invitation.update({
          where: { id: invitationId },
          data: {
            token: resend.token,
            expiresAt: resend.expiresAt,
            status: resend.status,
          },
        });
      }

      const result = await tx.invitation.findUnique({
        where: { id: invitationId },
        include: INVITATION_INCLUDE,
      });

      if (!result) throw new Error("Invitation not found after update");
      return result;
    });

    return this.toEntity(invitation as InvitationWithRelations);
  }

  async updateTokenAndExpiry(
    id: string,
    token: string,
    expiresAt: Date,
    status?: InvitationEntity["status"],
  ): Promise<InvitationEntity> {
    const invitation = await this.prisma.invitation.update({
      where: { id },
      data: { token, expiresAt, ...(status && { status }) },
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
      status: invitation.status as InvitationEntity["status"],
      createdAt: invitation.createdAt,
      teamAssignments: invitation.teamAssignments.map(
        (ta): InvitationTeamAssignmentEntity => ({
          teamId: ta.team.id,
          teamName: ta.team.name,
          role: ta.role as "manager" | "member",
        }),
      ),
    };
  }
}
