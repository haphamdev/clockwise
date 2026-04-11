import { ImportCallerContext } from "../interfaces/import-processor.interface";
import { TimeLogImportProcessor } from "./time-log-import.processor";

describe("TimeLogImportProcessor", () => {
  let processor: TimeLogImportProcessor;
  let mockProjectsService: any;
  let mockUsersService: any;
  let mockTimeLogsService: any;

  const orgId = "org-1";
  const userId = "user-1";
  const ctx: ImportCallerContext = { userId, orgId, isAdmin: false };
  const adminCtx: ImportCallerContext = { userId, orgId, isAdmin: true };

  beforeEach(() => {
    mockProjectsService = {
      findActiveByNameInOrg: jest.fn(),
      isUserLinkedToProject: jest.fn(),
    };
    mockUsersService = {
      findByEmail: jest.fn(),
    };
    mockTimeLogsService = {
      createForImport: jest.fn(),
      canLogOnBehalf: jest.fn(),
      existsByUserDateProjectTask: jest.fn().mockResolvedValue(false),
    };

    processor = new TimeLogImportProcessor(
      mockProjectsService,
      mockUsersService,
      mockTimeLogsService,
    );
  });

  it('should have type "time-log"', () => {
    expect(processor.type).toBe("time-log");
  });

  describe("parseAndValidate", () => {
    const validCsv = [
      "date,project_name,task,hours,notes,user_email",
      "2025-06-15,My Project,Design review,2.5,Some notes,",
    ].join("\n");

    beforeEach(() => {
      mockProjectsService.findActiveByNameInOrg.mockResolvedValue({
        id: "proj-1",
        name: "My Project",
        orgId,
        status: "active",
      });
      mockProjectsService.isUserLinkedToProject.mockResolvedValue(true);
    });

    it("should parse a valid CSV row", async () => {
      const result = await processor.parseAndValidate(validCsv, ctx);

      expect(result.totalRows).toBe(1);
      expect(result.validRows).toHaveLength(1);
      expect(result.errors).toHaveLength(0);
      expect(result.validRows[0].data).toEqual({
        date: "2025-06-15",
        project_name: "My Project",
        task: "Design review",
        hours: "2.5",
        notes: "Some notes",
        user_email: "",
      });
    });

    it("should not leak _resolved fields in validRows", async () => {
      const result = await processor.parseAndValidate(validCsv, ctx);

      expect(result.validRows[0].data).not.toHaveProperty(
        "_resolved_project_id",
      );
      expect(result.validRows[0].data).not.toHaveProperty("_resolved_user_id");
    });

    it("should include executableRows with resolved IDs", async () => {
      const result = await processor.parseAndValidate(validCsv, ctx);

      expect(result.executableRows).toHaveLength(1);
      expect(result.executableRows[0].data._resolved_project_id).toBe("proj-1");
      expect(result.executableRows[0].data._resolved_user_id).toBe(userId);
    });

    describe("header validation", () => {
      it("should reject CSV with missing headers", async () => {
        const csv =
          "date,project_name,task,hours\n2025-06-15,My Project,Task,2";
        const result = await processor.parseAndValidate(csv, ctx);

        expect(result.validRows).toHaveLength(0);
        expect(result.errors).toHaveLength(1);
        expect(result.errors[0]).toMatchObject({
          row: 1,
          message: expect.stringContaining("Missing: notes, user_email"),
        });
      });

      it("should accept headers case-insensitively", async () => {
        const csv =
          "Date,Project_Name,Task,Hours,Notes,User_Email\n2025-06-15,My Project,Task,2,,";
        const result = await processor.parseAndValidate(csv, ctx);

        expect(result.errors).toHaveLength(0);
        expect(result.validRows).toHaveLength(1);
      });

      it("should map columns correctly when headers are reordered", async () => {
        const csv =
          "hours,task,project_name,date,user_email,notes\n2,Design review,My Project,2025-06-15,,Some notes";
        const result = await processor.parseAndValidate(csv, ctx);

        expect(result.errors).toHaveLength(0);
        expect(result.validRows).toHaveLength(1);
        expect(result.validRows[0].data).toEqual({
          date: "2025-06-15",
          project_name: "My Project",
          task: "Design review",
          hours: "2",
          notes: "Some notes",
          user_email: "",
        });
      });
    });

    describe("date validation", () => {
      it("should reject rows with invalid date format", async () => {
        const csv =
          "date,project_name,task,hours,notes,user_email\n15/06/2025,My Project,Task,2,,";
        const result = await processor.parseAndValidate(csv, ctx);

        expect(result.validRows).toHaveLength(0);
        expect(result.errors).toHaveLength(1);
        expect(result.errors[0]).toMatchObject({
          row: 2,
          field: "date",
          message: expect.stringContaining("YYYY-MM-DD"),
        });
      });

      it("should reject rows with future dates", async () => {
        const futureDate = "2099-12-31";
        const csv = `date,project_name,task,hours,notes,user_email\n${futureDate},My Project,Task,2,,`;
        const result = await processor.parseAndValidate(csv, ctx);

        expect(result.validRows).toHaveLength(0);
        expect(result.errors).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ row: 2, field: "date" }),
          ]),
        );
      });
    });

    describe("project validation", () => {
      it("should reject rows with unknown project", async () => {
        mockProjectsService.findActiveByNameInOrg.mockResolvedValue(null);
        const result = await processor.parseAndValidate(validCsv, ctx);

        expect(result.errors).toHaveLength(1);
        expect(result.errors[0]).toMatchObject({
          row: 2,
          field: "project_name",
          message: expect.stringContaining("not found"),
        });
      });

      it("should reject rows when user has no access to project", async () => {
        mockProjectsService.isUserLinkedToProject.mockResolvedValue(false);

        const result = await processor.parseAndValidate(validCsv, ctx);

        expect(result.errors).toHaveLength(1);
        expect(result.errors[0]).toMatchObject({
          row: 2,
          field: "project_name",
          message: expect.stringContaining("access"),
        });
      });

      it("should check project access for the TARGET user, not the caller", async () => {
        const csv =
          "date,project_name,task,hours,notes,user_email\n2025-06-15,My Project,Task,2,,other@test.com";
        mockUsersService.findByEmail.mockResolvedValue({
          id: "user-2",
          orgId,
          status: "active",
        });
        mockTimeLogsService.canLogOnBehalf.mockResolvedValue(true);

        await processor.parseAndValidate(csv, adminCtx);

        // Should check access for user-2 (the target), not user-1 (the caller)
        expect(mockProjectsService.isUserLinkedToProject).toHaveBeenCalledWith(
          "proj-1",
          "user-2",
        );
      });
    });

    describe("hours validation", () => {
      it("should reject rows with invalid hours", async () => {
        const csv =
          "date,project_name,task,hours,notes,user_email\n2025-06-15,My Project,Task,abc,,";
        const result = await processor.parseAndValidate(csv, ctx);

        expect(result.validRows).toHaveLength(0);
        expect(result.errors).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ row: 2, field: "hours" }),
          ]),
        );
      });

      it("should reject hours outside 0.01-24 range", async () => {
        const csv =
          "date,project_name,task,hours,notes,user_email\n2025-06-15,My Project,Task,25,,";
        const result = await processor.parseAndValidate(csv, ctx);

        expect(result.validRows).toHaveLength(0);
        expect(result.errors).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ row: 2, field: "hours" }),
          ]),
        );
      });
    });

    describe("task validation", () => {
      it("should reject rows with empty task", async () => {
        const csv =
          "date,project_name,task,hours,notes,user_email\n2025-06-15,My Project,,2,,";
        const result = await processor.parseAndValidate(csv, ctx);

        expect(result.validRows).toHaveLength(0);
        expect(result.errors).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ row: 2, field: "task" }),
          ]),
        );
      });

      it("should reject task labels exceeding 100 characters", async () => {
        const longTask = "a".repeat(101);
        const csv = `date,project_name,task,hours,notes,user_email\n2025-06-15,My Project,${longTask},2,,`;
        const result = await processor.parseAndValidate(csv, ctx);

        expect(result.validRows).toHaveLength(0);
        expect(result.errors).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ row: 2, field: "task" }),
          ]),
        );
      });
    });

    describe("user_email and authorization", () => {
      it("should validate user_email when provided", async () => {
        const csv =
          "date,project_name,task,hours,notes,user_email\n2025-06-15,My Project,Task,2,,other@test.com";
        mockUsersService.findByEmail.mockResolvedValue({
          id: "user-2",
          orgId,
          status: "active",
        });
        mockTimeLogsService.canLogOnBehalf.mockResolvedValue(true);

        const result = await processor.parseAndValidate(csv, adminCtx);

        expect(result.validRows).toHaveLength(1);
        expect(result.executableRows[0].data._resolved_user_id).toBe("user-2");
      });

      it("should reject user_email if user not found", async () => {
        const csv =
          "date,project_name,task,hours,notes,user_email\n2025-06-15,My Project,Task,2,,nobody@test.com";
        mockUsersService.findByEmail.mockResolvedValue(null);

        const result = await processor.parseAndValidate(csv, ctx);

        expect(result.errors).toHaveLength(1);
        expect(result.errors[0]).toMatchObject({
          row: 2,
          field: "user_email",
        });
      });

      it("should reject user_email if user is in different org", async () => {
        const csv =
          "date,project_name,task,hours,notes,user_email\n2025-06-15,My Project,Task,2,,other@test.com";
        mockUsersService.findByEmail.mockResolvedValue({
          id: "user-2",
          orgId: "other-org",
          status: "active",
        });

        const result = await processor.parseAndValidate(csv, ctx);

        expect(result.errors).toHaveLength(1);
        expect(result.errors[0]).toMatchObject({
          row: 2,
          field: "user_email",
          message: expect.stringContaining("not found"),
        });
      });

      it("should reject on-behalf import when caller lacks permission", async () => {
        const csv =
          "date,project_name,task,hours,notes,user_email\n2025-06-15,My Project,Task,2,,other@test.com";
        mockUsersService.findByEmail.mockResolvedValue({
          id: "user-2",
          orgId,
          status: "active",
        });
        mockTimeLogsService.canLogOnBehalf.mockResolvedValue(false);

        const result = await processor.parseAndValidate(csv, ctx);

        expect(result.errors).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              row: 2,
              field: "user_email",
              message: expect.stringContaining("permission"),
            }),
          ]),
        );
      });

      it("should not produce misleading project access error when user_email fails", async () => {
        const csv =
          "date,project_name,task,hours,notes,user_email\n2025-06-15,My Project,Task,2,,nobody@test.com";
        mockUsersService.findByEmail.mockResolvedValue(null);

        const result = await processor.parseAndValidate(csv, ctx);

        // Should only have user_email error, NOT a project access error
        expect(result.errors).toHaveLength(1);
        expect(result.errors[0].field).toBe("user_email");
        expect(
          mockProjectsService.isUserLinkedToProject,
        ).not.toHaveBeenCalled();
      });

      it("should allow on-behalf import for admin users", async () => {
        const csv =
          "date,project_name,task,hours,notes,user_email\n2025-06-15,My Project,Task,2,,other@test.com";
        mockUsersService.findByEmail.mockResolvedValue({
          id: "user-2",
          orgId,
          status: "active",
        });
        mockTimeLogsService.canLogOnBehalf.mockResolvedValue(true);

        const result = await processor.parseAndValidate(csv, adminCtx);

        expect(result.validRows).toHaveLength(1);
      });
    });

    describe("duplicate detection", () => {
      it("should flag duplicate rows", async () => {
        mockTimeLogsService.existsByUserDateProjectTask.mockResolvedValue(true);

        const result = await processor.parseAndValidate(validCsv, ctx);

        expect(result.validRows).toHaveLength(0);
        expect(result.errors).toHaveLength(1);
        expect(result.errors[0]).toMatchObject({
          row: 2,
          message: expect.stringContaining("already exists"),
        });
      });

      it("should not flag non-duplicate rows", async () => {
        mockTimeLogsService.existsByUserDateProjectTask.mockResolvedValue(
          false,
        );

        const result = await processor.parseAndValidate(validCsv, ctx);

        expect(result.validRows).toHaveLength(1);
        expect(result.errors).toHaveLength(0);
      });

      it("should detect intra-CSV duplicates (same user+date+project+task twice in CSV)", async () => {
        const csv = [
          "date,project_name,task,hours,notes,user_email",
          "2025-06-15,My Project,Design review,2,,",
          "2025-06-15,My Project,Design review,3,,",
        ].join("\n");

        const result = await processor.parseAndValidate(csv, ctx);

        expect(result.validRows).toHaveLength(1);
        expect(result.errors).toHaveLength(1);
        expect(result.errors[0]).toMatchObject({
          row: 3,
          message: expect.stringContaining("already exists"),
        });
      });
    });

    describe("mixed rows and edge cases", () => {
      it("should handle multiple rows with mixed valid/invalid", async () => {
        const csv = [
          "date,project_name,task,hours,notes,user_email",
          "2025-06-15,My Project,Task A,2,note,",
          "invalid-date,My Project,Task B,2,,",
          "2025-06-16,My Project,Task C,3,,",
        ].join("\n");

        const result = await processor.parseAndValidate(csv, ctx);

        expect(result.totalRows).toBe(3);
        expect(result.validRows).toHaveLength(2);
        expect(result.errors).toHaveLength(1);
      });

      it("should skip empty rows", async () => {
        const csv = [
          "date,project_name,task,hours,notes,user_email",
          "2025-06-15,My Project,Task,2,,",
          "",
          "  ",
        ].join("\n");

        const result = await processor.parseAndValidate(csv, ctx);

        expect(result.totalRows).toBe(1);
        expect(result.validRows).toHaveLength(1);
      });

      it("should cache project lookups for repeated project names", async () => {
        const csv = [
          "date,project_name,task,hours,notes,user_email",
          "2025-06-15,My Project,Task A,2,,",
          "2025-06-16,My Project,Task B,3,,",
        ].join("\n");

        await processor.parseAndValidate(csv, ctx);

        expect(mockProjectsService.findActiveByNameInOrg).toHaveBeenCalledTimes(
          1,
        );
      });

      it("should include row data on error objects", async () => {
        const csv =
          "date,project_name,task,hours,notes,user_email\n2025-06-15,My Project,,2,,";
        const result = await processor.parseAndValidate(csv, ctx);

        expect(result.errors[0].data).toBeDefined();
        expect(result.errors[0].data?.date).toBe("2025-06-15");
        expect(result.errors[0].data?.project_name).toBe("My Project");
      });
    });

    describe("CSV parsing", () => {
      it("should handle quoted CSV fields", async () => {
        const csv = [
          "date,project_name,task,hours,notes,user_email",
          '2025-06-15,"Project, With Comma","Task ""quoted""",2,"notes, here",',
        ].join("\n");

        mockProjectsService.findActiveByNameInOrg.mockResolvedValue({
          id: "proj-1",
          name: "Project, With Comma",
          orgId,
          status: "active",
        });

        const result = await processor.parseAndValidate(csv, ctx);

        expect(result.validRows).toHaveLength(1);
        expect(result.validRows[0].data.project_name).toBe(
          "Project, With Comma",
        );
        expect(result.validRows[0].data.task).toBe('Task "quoted"');
        expect(result.validRows[0].data.notes).toBe("notes, here");
      });

      it("should handle newlines within quoted fields", async () => {
        const csv =
          "date,project_name,task,hours,notes,user_email\n" +
          '2025-06-15,My Project,Task,2,"line one\nline two",';

        const result = await processor.parseAndValidate(csv, ctx);

        expect(result.validRows).toHaveLength(1);
        expect(result.validRows[0].data.notes).toBe("line one\nline two");
      });

      it("should handle \\r\\n line endings", async () => {
        const csv =
          "date,project_name,task,hours,notes,user_email\r\n" +
          "2025-06-15,My Project,Task A,2,,\r\n" +
          "2025-06-16,My Project,Task B,3,,";

        const result = await processor.parseAndValidate(csv, ctx);

        expect(result.validRows).toHaveLength(2);
      });
    });
  });

  describe("execute", () => {
    it("should create time logs via service for valid rows", async () => {
      const validRows = [
        {
          rowNumber: 2,
          data: {
            date: "2025-06-15",
            project_name: "My Project",
            task: "Task A",
            hours: "2.5",
            notes: "Some notes",
            user_email: "",
            _resolved_project_id: "proj-1",
            _resolved_user_id: "user-1",
          },
        },
      ];

      mockTimeLogsService.createForImport.mockResolvedValue(undefined);

      const result = await processor.execute(validRows, ctx);

      expect(result.totalRows).toBe(1);
      expect(result.imported).toBe(1);
      expect(result.errors).toHaveLength(0);
      expect(mockTimeLogsService.createForImport).toHaveBeenCalledWith(
        "user-1",
        orgId,
        userId,
        {
          projectId: "proj-1",
          taskLabel: "Task A",
          date: "2025-06-15",
          hours: 2.5,
          notes: "Some notes",
        },
      );
    });

    it("should use resolved user_id for on-behalf imports", async () => {
      const validRows = [
        {
          rowNumber: 2,
          data: {
            date: "2025-06-15",
            project_name: "My Project",
            task: "Task",
            hours: "1",
            notes: "",
            user_email: "other@test.com",
            _resolved_project_id: "proj-1",
            _resolved_user_id: "user-2",
          },
        },
      ];

      mockTimeLogsService.createForImport.mockResolvedValue(undefined);

      const result = await processor.execute(validRows, ctx);

      expect(result.imported).toBe(1);
      expect(mockTimeLogsService.createForImport).toHaveBeenCalledWith(
        "user-2",
        orgId,
        userId,
        expect.objectContaining({ projectId: "proj-1" }),
      );
    });

    it("should continue on individual row failure and report errors", async () => {
      const validRows = [
        {
          rowNumber: 2,
          data: {
            date: "2025-06-15",
            project_name: "P1",
            task: "Task A",
            hours: "2",
            notes: "",
            user_email: "",
            _resolved_project_id: "proj-1",
            _resolved_user_id: "user-1",
          },
        },
        {
          rowNumber: 3,
          data: {
            date: "2025-06-16",
            project_name: "P1",
            task: "Task B",
            hours: "3",
            notes: "",
            user_email: "",
            _resolved_project_id: "proj-1",
            _resolved_user_id: "user-1",
          },
        },
      ];

      mockTimeLogsService.createForImport
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error("DB error"));

      const result = await processor.execute(validRows, ctx);

      expect(result.totalRows).toBe(2);
      expect(result.imported).toBe(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toMatchObject({ row: 3 });
    });

    it("should treat empty notes as undefined", async () => {
      const validRows = [
        {
          rowNumber: 2,
          data: {
            date: "2025-06-15",
            project_name: "P1",
            task: "Task",
            hours: "1",
            notes: "",
            user_email: "",
            _resolved_project_id: "proj-1",
            _resolved_user_id: "user-1",
          },
        },
      ];

      mockTimeLogsService.createForImport.mockResolvedValue(undefined);

      await processor.execute(validRows, ctx);

      expect(mockTimeLogsService.createForImport).toHaveBeenCalledWith(
        "user-1",
        orgId,
        userId,
        expect.objectContaining({ notes: undefined }),
      );
    });
  });
});
