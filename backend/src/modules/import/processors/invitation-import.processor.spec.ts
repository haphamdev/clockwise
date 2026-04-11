import { ImportCallerContext } from "../interfaces/import-processor.interface";
import { InvitationImportProcessor } from "./invitation-import.processor";

describe("InvitationImportProcessor — parseAndValidate", () => {
  let processor: InvitationImportProcessor;
  let mockInvitationsService: any;
  let mockTeamsService: any;
  let mockUsersService: any;

  const orgId = "org-1";
  const userId = "admin-1";
  const ctx: ImportCallerContext = { userId, orgId, isAdmin: true };

  const makeTeam = (id: string, name: string) => ({
    id,
    orgId,
    name,
    description: null,
    isArchived: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  beforeEach(() => {
    mockInvitationsService = {
      createForImport: jest.fn().mockResolvedValue({ id: "inv-new" }),
      queueInvitationEmail: jest.fn().mockResolvedValue(undefined),
    };
    mockTeamsService = {
      findByNameInOrg: jest.fn().mockImplementation((name: string) => {
        if (name === "Engineering")
          return Promise.resolve(makeTeam("t-eng", "Engineering"));
        if (name === "Design")
          return Promise.resolve(makeTeam("t-des", "Design"));
        return Promise.resolve(null);
      }),
    };
    mockUsersService = {
      findByEmail: jest.fn().mockResolvedValue(null),
    };
    mockInvitationsService.findActiveByEmail = jest
      .fn()
      .mockResolvedValue(null);
    processor = new InvitationImportProcessor(
      mockInvitationsService,
      mockTeamsService,
      mockUsersService,
    );
  });

  const validCsv = [
    "email,teams,manager_teams",
    "alice@example.com,Engineering,",
  ].join("\n");

  it('should have type "invitation"', () => {
    expect(processor.type).toBe("invitation");
  });

  it("should parse a valid CSV row", async () => {
    const result = await processor.parseAndValidate(validCsv, ctx);

    expect(result.totalRows).toBe(1);
    expect(result.validRows).toHaveLength(1);
    expect(result.errors).toHaveLength(0);
    expect(result.validRows[0].data).toEqual({
      email: "alice@example.com",
      teams: "Engineering",
      manager_teams: "",
    });
  });

  it("should not leak _resolved fields in validRows", async () => {
    const result = await processor.parseAndValidate(validCsv, ctx);
    expect(result.validRows[0].data).not.toHaveProperty(
      "_resolved_team_assignments",
    );
  });

  it("should include executableRows with resolved team assignments", async () => {
    const csv = [
      "email,teams,manager_teams",
      "alice@example.com,Engineering,Design",
    ].join("\n");
    const result = await processor.parseAndValidate(csv, ctx);

    expect(result.executableRows).toHaveLength(1);
    const assignments = JSON.parse(
      result.executableRows[0].data._resolved_team_assignments,
    );
    expect(assignments).toEqual(
      expect.arrayContaining([
        { teamId: "t-eng", role: "member" },
        { teamId: "t-des", role: "manager" },
      ]),
    );
  });

  describe("header validation", () => {
    it("should reject CSV with missing required headers", async () => {
      const csv = "email\nalice@example.com";
      const result = await processor.parseAndValidate(csv, ctx);

      expect(result.validRows).toHaveLength(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toMatchObject({
        row: 1,
        message: expect.stringContaining("Missing"),
      });
    });
  });

  describe("email validation", () => {
    it("should reject rows with empty email", async () => {
      const csv = "email,teams,manager_teams\n,Engineering,";
      const result = await processor.parseAndValidate(csv, ctx);

      expect(result.validRows).toHaveLength(0);
      expect(result.errors[0]).toMatchObject({ row: 2, field: "email" });
    });

    it("should reject invalid email format", async () => {
      const csv = "email,teams,manager_teams\nnot-an-email,Engineering,";
      const result = await processor.parseAndValidate(csv, ctx);

      expect(result.validRows).toHaveLength(0);
      expect(result.errors[0]).toMatchObject({
        row: 2,
        field: "email",
        message: expect.stringContaining("valid email"),
      });
    });

    it("should reject email of an already active user", async () => {
      mockUsersService.findByEmail.mockResolvedValue({
        id: "u-1",
        orgId,
        email: "alice@example.com",
        status: "active",
      });
      const result = await processor.parseAndValidate(validCsv, ctx);

      expect(result.validRows).toHaveLength(0);
      expect(result.errors[0]).toMatchObject({
        row: 2,
        field: "email",
        message: expect.stringContaining("already registered"),
      });
    });

    it("should allow email of a pending user", async () => {
      mockUsersService.findByEmail.mockResolvedValue({
        id: "u-1",
        orgId,
        email: "alice@example.com",
        status: "pending",
      });
      const result = await processor.parseAndValidate(validCsv, ctx);

      expect(result.validRows).toHaveLength(1);
    });

    it("should allow active user from a different org", async () => {
      mockUsersService.findByEmail.mockResolvedValue({
        id: "u-1",
        orgId: "other-org",
        email: "alice@example.com",
        status: "active",
      });
      const result = await processor.parseAndValidate(validCsv, ctx);

      expect(result.validRows).toHaveLength(1);
    });
  });

  describe("duplicate detection", () => {
    it("should reject email with active invitation", async () => {
      mockInvitationsService.findActiveByEmail.mockResolvedValue({
        id: "inv-existing",
        email: "alice@example.com",
      });
      const result = await processor.parseAndValidate(validCsv, ctx);

      expect(result.validRows).toHaveLength(0);
      expect(result.errors[0]).toMatchObject({
        row: 2,
        field: "email",
        message: expect.stringContaining("active invitation"),
      });
    });

    it("should detect intra-CSV duplicate emails", async () => {
      const csv = [
        "email,teams,manager_teams",
        "alice@example.com,Engineering,",
        "alice@example.com,Design,",
      ].join("\n");
      const result = await processor.parseAndValidate(csv, ctx);

      expect(result.validRows).toHaveLength(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toMatchObject({
        row: 3,
        message: expect.stringContaining("Duplicate"),
      });
    });

    it("should detect case-insensitive intra-CSV duplicate emails", async () => {
      const csv = [
        "email,teams,manager_teams",
        "alice@example.com,Engineering,",
        "Alice@Example.com,Engineering,",
      ].join("\n");
      const result = await processor.parseAndValidate(csv, ctx);

      expect(result.validRows).toHaveLength(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toMatchObject({
        row: 3,
        message: expect.stringContaining("Duplicate"),
      });
    });

    it("should cache email lookups", async () => {
      const csv = [
        "email,teams,manager_teams",
        "alice@example.com,Engineering,",
        "bob@example.com,Engineering,",
      ].join("\n");
      await processor.parseAndValidate(csv, ctx);

      // Two different emails = two calls each for user + invitation lookup
      expect(mockUsersService.findByEmail).toHaveBeenCalledTimes(2);
      expect(mockInvitationsService.findActiveByEmail).toHaveBeenCalledTimes(2);
    });
  });

  describe("teams validation", () => {
    it("should require at least one valid team", async () => {
      const csv = "email,teams,manager_teams\nalice@example.com,,";
      const result = await processor.parseAndValidate(csv, ctx);

      expect(result.validRows).toHaveLength(0);
      expect(result.errors[0]).toMatchObject({
        row: 2,
        field: "teams",
        message: expect.stringContaining("At least one"),
      });
    });

    it("should warn and skip unknown teams (non-fatal)", async () => {
      const csv =
        'email,teams,manager_teams\nalice@example.com,"Engineering, Unknown",';
      const result = await processor.parseAndValidate(csv, ctx);

      expect(result.validRows).toHaveLength(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toMatchObject({
        row: 2,
        field: "teams",
        message: expect.stringContaining("Unknown"),
      });
    });

    it("should warn and skip archived teams", async () => {
      mockTeamsService.findByNameInOrg.mockImplementation((name: string) => {
        if (name === "Engineering") {
          return Promise.resolve({
            ...makeTeam("t-eng", "Engineering"),
            isArchived: true,
          });
        }
        if (name === "Design")
          return Promise.resolve(makeTeam("t-des", "Design"));
        return Promise.resolve(null);
      });

      const csv =
        'email,teams,manager_teams\nalice@example.com,"Engineering, Design",';
      const result = await processor.parseAndValidate(csv, ctx);

      expect(result.validRows).toHaveLength(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toMatchObject({
        row: 2,
        field: "teams",
        message: expect.stringContaining("archived"),
      });
    });

    it("should error when ALL teams are invalid", async () => {
      const csv = "email,teams,manager_teams\nalice@example.com,Unknown,";
      const result = await processor.parseAndValidate(csv, ctx);

      expect(result.validRows).toHaveLength(0);
      // Should have the warning + the "at least one" error
      const fatalError = result.errors.find((e: any) =>
        e.message.includes("At least one"),
      );
      expect(fatalError).toBeDefined();
    });

    it("should warn and skip unknown manager_teams", async () => {
      const csv =
        "email,teams,manager_teams\nalice@example.com,Engineering,Unknown";
      const result = await processor.parseAndValidate(csv, ctx);

      expect(result.validRows).toHaveLength(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toMatchObject({
        row: 2,
        field: "manager_teams",
        message: expect.stringContaining("Unknown"),
      });
    });

    it("should resolve team in both columns as manager role", async () => {
      const csv =
        "email,teams,manager_teams\nalice@example.com,Engineering,Engineering";
      const result = await processor.parseAndValidate(csv, ctx);

      expect(result.validRows).toHaveLength(1);
      const assignments = JSON.parse(
        result.executableRows[0].data._resolved_team_assignments,
      );
      expect(assignments).toEqual([{ teamId: "t-eng", role: "manager" }]);
    });

    it("should cache team lookups across rows", async () => {
      const csv = [
        "email,teams,manager_teams",
        "alice@example.com,Engineering,",
        "bob@example.com,Engineering,",
      ].join("\n");
      await processor.parseAndValidate(csv, ctx);

      expect(mockTeamsService.findByNameInOrg).toHaveBeenCalledTimes(1);
    });

    it("should resolve multiple teams and manager_teams", async () => {
      const csv =
        'email,teams,manager_teams\nalice@example.com,"Engineering, Design",Design';
      const result = await processor.parseAndValidate(csv, ctx);

      expect(result.validRows).toHaveLength(1);
      const assignments = JSON.parse(
        result.executableRows[0].data._resolved_team_assignments,
      );
      // Design appears in both — manager wins
      expect(assignments).toEqual(
        expect.arrayContaining([
          { teamId: "t-eng", role: "member" },
          { teamId: "t-des", role: "manager" },
        ]),
      );
      expect(assignments).toHaveLength(2);
    });
  });

  describe("edge cases", () => {
    it("should handle empty CSV", async () => {
      const result = await processor.parseAndValidate("", ctx);
      expect(result.totalRows).toBe(0);
      expect(result.validRows).toHaveLength(0);
    });

    it("should skip empty rows", async () => {
      const csv = [
        "email,teams,manager_teams",
        "alice@example.com,Engineering,",
        "",
        "  ",
      ].join("\n");
      const result = await processor.parseAndValidate(csv, ctx);

      expect(result.totalRows).toBe(1);
      expect(result.validRows).toHaveLength(1);
    });

    it("should include row data on error objects", async () => {
      const csv = "email,teams,manager_teams\n,Engineering,";
      const result = await processor.parseAndValidate(csv, ctx);

      expect(result.errors[0].data).toBeDefined();
      expect(result.errors[0].data?.email).toBe("");
    });
  });
});

describe("InvitationImportProcessor — execute", () => {
  let processor: InvitationImportProcessor;
  let mockInvitationsService: any;
  let mockTeamsService: any;
  let mockUsersService: any;

  const orgId = "org-1";
  const userId = "admin-1";
  const ctx: ImportCallerContext = { userId, orgId, isAdmin: true };

  beforeEach(() => {
    mockInvitationsService = {
      createForImport: jest.fn().mockResolvedValue({ id: "inv-new" }),
      queueInvitationEmail: jest.fn().mockResolvedValue(undefined),
      findActiveByEmail: jest.fn(),
    };
    mockTeamsService = { findByNameInOrg: jest.fn() };
    mockUsersService = { findByEmail: jest.fn() };
    processor = new InvitationImportProcessor(
      mockInvitationsService,
      mockTeamsService,
      mockUsersService,
    );
  });

  it("should create invitations and queue emails", async () => {
    const rows = [
      {
        rowNumber: 2,
        data: {
          email: "alice@example.com",
          teams: "Engineering",
          manager_teams: "",
          _resolved_team_assignments: JSON.stringify([
            { teamId: "t-eng", role: "member" },
          ]),
        },
      },
    ];

    const result = await processor.execute(rows, ctx);

    expect(result.imported).toBe(1);
    expect(result.errors).toHaveLength(0);
    expect(mockInvitationsService.createForImport).toHaveBeenCalledWith(
      orgId,
      userId,
      {
        email: "alice@example.com",
        teamAssignments: [{ teamId: "t-eng", role: "member" }],
      },
    );
    expect(mockInvitationsService.queueInvitationEmail).toHaveBeenCalledWith(
      "inv-new",
    );
  });

  it("should continue on row failure and report errors", async () => {
    mockInvitationsService.createForImport
      .mockRejectedValueOnce(new Error("DB error"))
      .mockResolvedValueOnce({ id: "inv-2" });

    const rows = [
      {
        rowNumber: 2,
        data: {
          email: "a@test.com",
          teams: "E",
          manager_teams: "",
          _resolved_team_assignments: '[{"teamId":"t-1","role":"member"}]',
        },
      },
      {
        rowNumber: 3,
        data: {
          email: "b@test.com",
          teams: "E",
          manager_teams: "",
          _resolved_team_assignments: '[{"teamId":"t-1","role":"member"}]',
        },
      },
    ];

    const result = await processor.execute(rows, ctx);

    expect(result.imported).toBe(1);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toMatchObject({ row: 2, message: "DB error" });
  });

  it("should not queue email if createForImport fails", async () => {
    mockInvitationsService.createForImport.mockRejectedValue(new Error("fail"));

    const rows = [
      {
        rowNumber: 2,
        data: {
          email: "a@test.com",
          teams: "E",
          manager_teams: "",
          _resolved_team_assignments: '[{"teamId":"t-1","role":"member"}]',
        },
      },
    ];

    await processor.execute(rows, ctx);

    expect(mockInvitationsService.queueInvitationEmail).not.toHaveBeenCalled();
  });
});
