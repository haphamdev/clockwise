import { ConfigService } from "@nestjs/config";
import { Queue } from "bullmq";
import { ErrorCode } from "../../common/exceptions/error-codes";
import { MailService } from "../mail/mail.service";
import { OrgService } from "../org/org.service";
import { TeamsService } from "../teams/teams.service";
import { UsersService } from "../users/users.service";
import { InvitationEntity } from "./entities/invitation.entity";
import { InvitationEmailJobData } from "./invitation-email.constants";
import { InvitationsRepository } from "./invitations.repository";
import { InvitationsService } from "./invitations.service";

function makeInvitation(
  overrides?: Partial<InvitationEntity>,
): InvitationEntity {
  return {
    id: "inv-1",
    orgId: "org-1",
    email: "new@example.com",
    invitedBy: "admin-1",
    invitedByName: "Admin",
    token: "abc123",
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    status: "sent",
    createdAt: new Date(),
    teamAssignments: [
      { teamId: "team-1", teamName: "Engineering", role: "member" },
    ],
    ...overrides,
  };
}

describe("InvitationsService", () => {
  let service: InvitationsService;
  let repo: jest.Mocked<InvitationsRepository>;
  let usersService: jest.Mocked<UsersService>;
  let teamsService: jest.Mocked<TeamsService>;
  let orgService: jest.Mocked<OrgService>;
  let mailService: jest.Mocked<MailService>;
  let configService: jest.Mocked<ConfigService>;
  let emailQueue: jest.Mocked<Queue<InvitationEmailJobData>>;

  beforeEach(() => {
    repo = {
      create: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
      findByToken: jest.fn(),
      findActiveByEmail: jest.fn(),
      findActiveByEmailAnyOrg: jest.fn(),
      updateStatus: jest.fn(),
      acceptInvitation: jest.fn(),
      updateTokenAndExpiry: jest.fn(),
      updateTeamAssignments: jest.fn(),
    } as unknown as jest.Mocked<InvitationsRepository>;

    usersService = {
      findByEmail: jest.fn(),
      createPendingUser: jest.fn(),
    } as unknown as jest.Mocked<UsersService>;

    teamsService = {
      validateTeamExists: jest.fn(),
    } as unknown as jest.Mocked<TeamsService>;

    orgService = {
      getSettings: jest.fn().mockResolvedValue({ orgName: "Acme Corp" }),
    } as unknown as jest.Mocked<OrgService>;

    mailService = {
      sendInvitationEmail: jest.fn(),
    } as unknown as jest.Mocked<MailService>;

    configService = {
      get: jest.fn().mockReturnValue("http://localhost:5173"),
    } as unknown as jest.Mocked<ConfigService>;

    emailQueue = {
      add: jest.fn(),
    } as unknown as jest.Mocked<Queue<InvitationEmailJobData>>;

    service = new InvitationsService(
      repo,
      usersService,
      teamsService,
      orgService,
      mailService,
      configService,
      emailQueue,
    );
  });

  describe("create", () => {
    const createData = {
      email: "new@example.com",
      teamAssignments: [{ teamId: "team-1", role: "member" as const }],
    };

    it("should create invitation, pending user, and queue email", async () => {
      usersService.findByEmail.mockResolvedValue(null);
      repo.findActiveByEmail.mockResolvedValue(null);
      teamsService.validateTeamExists.mockResolvedValue(undefined);
      const invitation = makeInvitation({ status: "initiated" });
      repo.create.mockResolvedValue(invitation);

      const res = await service.create("org-1", "admin-1", createData);
      expect(res.status).toBe("initiated");
      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "initiated",
          email: "new@example.com",
          orgId: "org-1",
        }),
      );
      expect(usersService.createPendingUser).toHaveBeenCalledWith(
        "org-1",
        "new@example.com",
        "admin-1",
      );
      expect(emailQueue.add).toHaveBeenCalledWith(
        "send-invitation-email",
        { invitationId: "inv-1" },
        expect.objectContaining({
          removeOnComplete: { age: 3600 },
          removeOnFail: { age: 7200 },
        }),
      );
      expect(mailService.sendInvitationEmail).not.toHaveBeenCalled();
    });

    it("should not create pending user if one already exists (re-invite after revoke)", async () => {
      usersService.findByEmail.mockResolvedValue({
        id: "u-1",
        orgId: "org-1",
        email: "new@example.com",
        name: "new@example.com",
        avatarUrl: null,
        isAdmin: false,
        status: "pending",
        lastLoginAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      repo.findActiveByEmail.mockResolvedValue(null);
      teamsService.validateTeamExists.mockResolvedValue(undefined);
      repo.create.mockResolvedValue(makeInvitation());

      await service.create("org-1", "admin-1", createData);
      expect(usersService.createPendingUser).not.toHaveBeenCalled();
    });

    it("should throw EMAIL_ALREADY_REGISTERED for active user", async () => {
      usersService.findByEmail.mockResolvedValue({
        id: "u-1",
        orgId: "org-1",
        email: "new@example.com",
        name: "Existing",
        avatarUrl: null,
        isAdmin: false,
        status: "active",
        lastLoginAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await expect(
        service.create("org-1", "admin-1", createData),
      ).rejects.toThrow(
        expect.objectContaining({
          code: ErrorCode.INVITATION.EMAIL_ALREADY_REGISTERED,
        }),
      );
    });

    it("should throw EMAIL_ALREADY_INVITED for active invitation", async () => {
      usersService.findByEmail.mockResolvedValue(null);
      repo.findActiveByEmail.mockResolvedValue(makeInvitation());

      await expect(
        service.create("org-1", "admin-1", createData),
      ).rejects.toThrow(
        expect.objectContaining({
          code: ErrorCode.INVITATION.EMAIL_ALREADY_INVITED,
        }),
      );
    });

    it("should allow re-inviting after previous invitation expired", async () => {
      // Pending user exists from the first invitation
      usersService.findByEmail.mockResolvedValue({
        id: "u-1",
        orgId: "org-1",
        email: "new@example.com",
        name: "new@example.com",
        avatarUrl: null,
        isAdmin: false,
        status: "pending",
        lastLoginAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      // No active (non-expired) invitation found
      repo.findActiveByEmail.mockResolvedValue(null);
      teamsService.validateTeamExists.mockResolvedValue(undefined);
      repo.create.mockResolvedValue(makeInvitation());

      await service.create("org-1", "admin-1", createData);
      expect(repo.create).toHaveBeenCalled();
      expect(usersService.createPendingUser).not.toHaveBeenCalled();
    });

    it("should throw INVALID_TEAM_ASSIGNMENT for bad team", async () => {
      usersService.findByEmail.mockResolvedValue(null);
      repo.findActiveByEmail.mockResolvedValue(null);
      teamsService.validateTeamExists.mockRejectedValue(new Error("not found"));

      await expect(
        service.create("org-1", "admin-1", createData),
      ).rejects.toThrow(
        expect.objectContaining({
          code: ErrorCode.INVITATION.INVALID_TEAM_ASSIGNMENT,
        }),
      );
    });
  });

  describe("findAll", () => {
    it("should return paginated invitations", async () => {
      const result = { data: [makeInvitation()], total: 1 };
      repo.findAll.mockResolvedValue(result);

      const res = await service.findAll("org-1", { page: 1, limit: 20 });
      expect(res).toEqual(result);
    });
  });

  describe("revoke", () => {
    it("should revoke a sent invitation", async () => {
      repo.findById.mockResolvedValue(makeInvitation());
      repo.updateStatus.mockResolvedValue(undefined);

      await service.revoke("inv-1", "org-1");
      expect(repo.updateStatus).toHaveBeenCalledWith("inv-1", "revoked");
    });

    it("should throw ALREADY_ACCEPTED", async () => {
      repo.findById.mockResolvedValue(makeInvitation({ status: "accepted" }));

      await expect(service.revoke("inv-1", "org-1")).rejects.toThrow(
        expect.objectContaining({
          code: ErrorCode.INVITATION.ALREADY_ACCEPTED,
        }),
      );
    });

    it("should throw ALREADY_REVOKED", async () => {
      repo.findById.mockResolvedValue(makeInvitation({ status: "revoked" }));

      await expect(service.revoke("inv-1", "org-1")).rejects.toThrow(
        expect.objectContaining({ code: ErrorCode.INVITATION.ALREADY_REVOKED }),
      );
    });

    it("should revoke an initiated invitation", async () => {
      repo.findById.mockResolvedValue(makeInvitation({ status: "initiated" }));
      repo.updateStatus.mockResolvedValue(undefined);

      await service.revoke("inv-1", "org-1");
      expect(repo.updateStatus).toHaveBeenCalledWith("inv-1", "revoked");
    });

    it("should revoke a failed invitation", async () => {
      repo.findById.mockResolvedValue(makeInvitation({ status: "failed" }));
      repo.updateStatus.mockResolvedValue(undefined);

      await service.revoke("inv-1", "org-1");
      expect(repo.updateStatus).toHaveBeenCalledWith("inv-1", "revoked");
    });

    it("should throw NOT_FOUND for wrong org", async () => {
      repo.findById.mockResolvedValue(makeInvitation({ orgId: "other-org" }));

      await expect(service.revoke("inv-1", "org-1")).rejects.toThrow(
        expect.objectContaining({ code: ErrorCode.INVITATION.NOT_FOUND }),
      );
    });
  });

  describe("resend", () => {
    it("should resend with new token, set initiated atomically, and queue email", async () => {
      repo.findById.mockResolvedValue(makeInvitation());
      const updated = makeInvitation({
        token: "new-token",
        status: "initiated",
      });
      repo.updateTokenAndExpiry.mockResolvedValue(updated);

      const res = await service.resend("inv-1", "org-1");
      expect(res.token).toBe("new-token");
      expect(res.status).toBe("initiated");
      expect(repo.updateTokenAndExpiry).toHaveBeenCalledWith(
        "inv-1",
        expect.any(String),
        expect.any(Date),
        "initiated",
      );
      expect(emailQueue.add).toHaveBeenCalledWith(
        "send-invitation-email",
        { invitationId: "inv-1" },
        expect.objectContaining({
          removeOnComplete: { age: 3600 },
          removeOnFail: { age: 7200 },
        }),
      );
      expect(mailService.sendInvitationEmail).not.toHaveBeenCalled();
    });

    it("should throw ALREADY_ACCEPTED", async () => {
      repo.findById.mockResolvedValue(makeInvitation({ status: "accepted" }));

      await expect(service.resend("inv-1", "org-1")).rejects.toThrow(
        expect.objectContaining({
          code: ErrorCode.INVITATION.ALREADY_ACCEPTED,
        }),
      );
    });

    it("should throw ALREADY_REVOKED", async () => {
      repo.findById.mockResolvedValue(makeInvitation({ status: "revoked" }));

      await expect(service.resend("inv-1", "org-1")).rejects.toThrow(
        expect.objectContaining({ code: ErrorCode.INVITATION.ALREADY_REVOKED }),
      );
    });
  });

  describe("updateTeamAssignments", () => {
    const newAssignments = [{ teamId: "team-2", role: "manager" as const }];

    it("should update team assignments for non-expired invitation", async () => {
      repo.findById.mockResolvedValue(makeInvitation());
      teamsService.validateTeamExists.mockResolvedValue(undefined);
      const updated = makeInvitation({
        teamAssignments: [
          { teamId: "team-2", teamName: "Design", role: "manager" },
        ],
      });
      repo.updateTeamAssignments.mockResolvedValue(updated);

      const res = await service.updateTeamAssignments(
        "inv-1",
        "org-1",
        newAssignments,
      );
      expect(res.teamAssignments[0].teamId).toBe("team-2");
      expect(emailQueue.add).not.toHaveBeenCalled();
    });

    it("should renew token, set initiated atomically, and queue email for expired invitation", async () => {
      repo.findById.mockResolvedValue(
        makeInvitation({ expiresAt: new Date(Date.now() - 1000) }),
      );
      teamsService.validateTeamExists.mockResolvedValue(undefined);
      const updated = makeInvitation({ status: "initiated" });
      repo.updateTeamAssignments.mockResolvedValue(updated);

      const res = await service.updateTeamAssignments(
        "inv-1",
        "org-1",
        newAssignments,
      );
      expect(res.status).toBe("initiated");
      expect(repo.updateTeamAssignments).toHaveBeenCalledWith(
        "inv-1",
        newAssignments,
        expect.objectContaining({
          token: expect.any(String),
          expiresAt: expect.any(Date),
          status: "initiated",
        }),
      );
      expect(emailQueue.add).toHaveBeenCalledWith(
        "send-invitation-email",
        { invitationId: "inv-1" },
        expect.objectContaining({
          removeOnComplete: { age: 3600 },
          removeOnFail: { age: 7200 },
        }),
      );
      expect(mailService.sendInvitationEmail).not.toHaveBeenCalled();
    });

    it("should throw ALREADY_ACCEPTED", async () => {
      repo.findById.mockResolvedValue(makeInvitation({ status: "accepted" }));

      await expect(
        service.updateTeamAssignments("inv-1", "org-1", newAssignments),
      ).rejects.toThrow(
        expect.objectContaining({
          code: ErrorCode.INVITATION.ALREADY_ACCEPTED,
        }),
      );
    });

    it("should throw ALREADY_REVOKED", async () => {
      repo.findById.mockResolvedValue(makeInvitation({ status: "revoked" }));

      await expect(
        service.updateTeamAssignments("inv-1", "org-1", newAssignments),
      ).rejects.toThrow(
        expect.objectContaining({ code: ErrorCode.INVITATION.ALREADY_REVOKED }),
      );
    });
  });

  describe("validateToken", () => {
    it("should return invitation for valid token", async () => {
      const invitation = makeInvitation();
      repo.findByToken.mockResolvedValue(invitation);

      const res = await service.validateToken("abc123");
      expect(res).toEqual(invitation);
    });

    it("should throw NOT_FOUND for unknown token", async () => {
      repo.findByToken.mockResolvedValue(null);

      await expect(service.validateToken("bad-token")).rejects.toThrow(
        expect.objectContaining({ code: ErrorCode.INVITATION.NOT_FOUND }),
      );
    });

    it("should throw EXPIRED for expired invitation", async () => {
      repo.findByToken.mockResolvedValue(
        makeInvitation({ expiresAt: new Date(Date.now() - 1000) }),
      );

      await expect(service.validateToken("abc123")).rejects.toThrow(
        expect.objectContaining({ code: ErrorCode.INVITATION.EXPIRED }),
      );
    });

    it("should throw ALREADY_REVOKED for revoked invitation", async () => {
      repo.findByToken.mockResolvedValue(makeInvitation({ status: "revoked" }));

      await expect(service.validateToken("abc123")).rejects.toThrow(
        expect.objectContaining({ code: ErrorCode.INVITATION.ALREADY_REVOKED }),
      );
    });

    it("should throw NOT_FOUND for initiated invitation", async () => {
      repo.findByToken.mockResolvedValue(
        makeInvitation({ status: "initiated" }),
      );

      await expect(service.validateToken("abc123")).rejects.toThrow(
        expect.objectContaining({ code: ErrorCode.INVITATION.NOT_FOUND }),
      );
    });

    it("should throw NOT_FOUND for sending invitation", async () => {
      repo.findByToken.mockResolvedValue(makeInvitation({ status: "sending" }));

      await expect(service.validateToken("abc123")).rejects.toThrow(
        expect.objectContaining({ code: ErrorCode.INVITATION.NOT_FOUND }),
      );
    });

    it("should throw NOT_FOUND for failed invitation", async () => {
      repo.findByToken.mockResolvedValue(makeInvitation({ status: "failed" }));

      await expect(service.validateToken("abc123")).rejects.toThrow(
        expect.objectContaining({ code: ErrorCode.INVITATION.NOT_FOUND }),
      );
    });
  });

  describe("acceptByEmail", () => {
    it("should accept invitation and create team memberships", async () => {
      repo.findActiveByEmailAnyOrg.mockResolvedValue(makeInvitation());
      repo.acceptInvitation.mockResolvedValue(undefined);

      await service.acceptByEmail("new@example.com", "user-1");
      expect(repo.acceptInvitation).toHaveBeenCalledWith("inv-1", "user-1");
    });

    it("should do nothing when no active invitation", async () => {
      repo.findActiveByEmailAnyOrg.mockResolvedValue(null);

      await service.acceptByEmail("unknown@example.com", "user-1");
      expect(repo.acceptInvitation).not.toHaveBeenCalled();
    });
  });

  describe("validateTokenWithOrgName", () => {
    it("should return invitation and org name", async () => {
      const invitation = makeInvitation();
      repo.findByToken.mockResolvedValue(invitation);

      const res = await service.validateTokenWithOrgName("abc123");
      expect(res.invitation).toEqual(invitation);
      expect(res.orgName).toBe("Acme Corp");
    });
  });
});
