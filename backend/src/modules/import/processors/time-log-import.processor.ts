import { Injectable } from "@nestjs/common";
import { ProjectsService } from "../../projects/projects.service";
import { TimeLogsService } from "../../time-logs/time-logs.service";
import { UsersService } from "../../users/users.service";
import {
  ImportCallerContext,
  ImportPreviewResult,
  ImportProcessor,
  ImportProgressCallback,
  ImportResult,
  ImportRow,
  ImportValidationError,
} from "../interfaces/import-processor.interface";
import { parseCsv, validateHeaders } from "../utils/csv-parser";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const EXPECTED_HEADERS = [
  "date",
  "project_name",
  "task",
  "hours",
  "notes",
  "user_email",
];

@Injectable()
export class TimeLogImportProcessor implements ImportProcessor {
  readonly type = "time-log";

  constructor(
    private readonly projectsService: ProjectsService,
    private readonly usersService: UsersService,
    private readonly timeLogsService: TimeLogsService,
  ) {}

  async parseAndValidate(
    csvContent: string,
    ctx: ImportCallerContext,
  ): Promise<ImportPreviewResult> {
    const rows = parseCsv(csvContent);
    if (rows.length < 2) {
      return { validRows: [], executableRows: [], errors: [], totalRows: 0 };
    }

    const headerResult = validateHeaders(rows[0], EXPECTED_HEADERS);
    if ("error" in headerResult) {
      return {
        validRows: [],
        executableRows: [],
        errors: [headerResult.error],
        totalRows: 0,
      };
    }
    const columnMap = headerResult.columnMap;

    const dataRows = rows.slice(1);
    const executableRows: ImportRow[] = [];
    const errors: ImportValidationError[] = [];

    // Caches to avoid repeated lookups
    const projectCache = new Map<string, { id: string } | null>();
    const userCache = new Map<
      string,
      { id: string; orgId: string; status: string } | null
    >();
    const accessCache = new Map<string, boolean>();
    const onBehalfCache = new Map<string, boolean>();
    const duplicateCache = new Map<string, boolean>();

    // Highest expected column index + 1 → minimum fields a row must have.
    // Handles CSVs where expected headers aren't the first columns.
    const minFieldCount = Math.max(...columnMap.values()) + 1;
    let dataRowCount = 0;

    for (let i = 0; i < dataRows.length; i++) {
      const rowNumber = i + 2; // 1-indexed, header is row 1
      const fields = dataRows[i];

      if (fields.length === 1 && fields[0].trim() === "") {
        continue; // skip empty rows
      }

      dataRowCount++;

      if (fields.length < minFieldCount) {
        errors.push({
          row: rowNumber,
          field: "",
          message: "Row has too few columns",
        });
        continue;
      }

      const data: Record<string, string> = {};
      for (const header of EXPECTED_HEADERS) {
        const idx = columnMap.get(header) as number;
        data[header] = (fields[idx] ?? "").trim();
      }

      const rowErrors = await this.validateRow(
        data,
        rowNumber,
        ctx,
        projectCache,
        userCache,
        accessCache,
        onBehalfCache,
        duplicateCache,
      );

      // Build clean data (without internal resolved fields) for the response
      const cleanData: Record<string, string> = {};
      for (const key of EXPECTED_HEADERS) {
        cleanData[key] = data[key] ?? "";
      }

      if (rowErrors.length > 0) {
        for (const err of rowErrors) {
          err.data = cleanData;
        }
        errors.push(...rowErrors);
      } else {
        executableRows.push({ rowNumber, data });
      }
    }

    // Build clean response rows (strip internal resolved fields)
    const validRows = executableRows.map((r) => {
      const cleanData: Record<string, string> = {};
      for (const key of EXPECTED_HEADERS) {
        cleanData[key] = r.data[key] ?? "";
      }
      return { rowNumber: r.rowNumber, data: cleanData };
    });

    return { validRows, executableRows, errors, totalRows: dataRowCount };
  }

  async execute(
    validRows: ImportRow[],
    ctx: ImportCallerContext,
    onProgress?: ImportProgressCallback,
  ): Promise<ImportResult> {
    let imported = 0;
    const errors: ImportValidationError[] = [];

    for (const row of validRows) {
      try {
        const projectId = row.data._resolved_project_id;
        const targetUserId = row.data._resolved_user_id;
        const taskLabel = row.data.task;
        const hours = parseFloat(row.data.hours);
        const notes = row.data.notes || undefined;

        await this.timeLogsService.createForImport(
          targetUserId,
          ctx.orgId,
          ctx.userId,
          {
            projectId,
            taskLabel,
            date: row.data.date,
            hours,
            notes,
          },
        );

        imported++;
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Unknown error";
        errors.push({ row: row.rowNumber, field: "", message });
      }
      onProgress?.(imported, errors.length);
    }

    return { totalRows: validRows.length, imported, errors };
  }

  private async validateRow(
    data: Record<string, string>,
    rowNumber: number,
    ctx: ImportCallerContext,
    projectCache: Map<string, { id: string } | null>,
    userCache: Map<
      string,
      { id: string; orgId: string; status: string } | null
    >,
    accessCache: Map<string, boolean>,
    onBehalfCache: Map<string, boolean>,
    duplicateCache: Map<string, boolean>,
  ): Promise<ImportValidationError[]> {
    const errors: ImportValidationError[] = [];

    // Date
    if (!DATE_RE.test(data.date)) {
      errors.push({
        row: rowNumber,
        field: "date",
        message: "Invalid date format. Use YYYY-MM-DD",
      });
      return errors;
    }
    const parsedDate = new Date(`${data.date}T00:00:00`);
    if (Number.isNaN(parsedDate.getTime())) {
      errors.push({ row: rowNumber, field: "date", message: "Invalid date" });
      return errors;
    }
    // String comparison on YYYY-MM-DD avoids timezone issues that arise
    // when comparing Date objects (midnight local vs current time, UTC shifts).
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    if (data.date > todayStr) {
      errors.push({
        row: rowNumber,
        field: "date",
        message: "Date cannot be in the future",
      });
    }

    // Hours
    const hours = parseFloat(data.hours);
    if (Number.isNaN(hours)) {
      errors.push({
        row: rowNumber,
        field: "hours",
        message: "Hours must be a number",
      });
    } else if (hours < 0.01 || hours > 24) {
      // No 0.25 increment rule — imports accept arbitrary precision from external systems
      errors.push({
        row: rowNumber,
        field: "hours",
        message: "Hours must be between 0.01 and 24",
      });
    }

    // Task
    if (!data.task) {
      errors.push({
        row: rowNumber,
        field: "task",
        message: "Task is required",
      });
    } else if (data.task.length > 100) {
      errors.push({
        row: rowNumber,
        field: "task",
        message: "Task label must be 100 characters or less",
      });
    }

    // Resolve user BEFORE project access check
    const userEmail = data.user_email;
    let targetUserId = ctx.userId;
    let userResolved = true;

    if (userEmail) {
      if (!userCache.has(userEmail)) {
        const user = await this.usersService.findByEmail(userEmail);
        userCache.set(
          userEmail,
          user ? { id: user.id, orgId: user.orgId, status: user.status } : null,
        );
      }
      const targetUser = userCache.get(userEmail);
      if (!targetUser || targetUser.orgId !== ctx.orgId) {
        errors.push({
          row: rowNumber,
          field: "user_email",
          message: `User "${userEmail}" not found in this organization`,
        });
        userResolved = false;
      } else if (targetUser.status !== "active") {
        errors.push({
          row: rowNumber,
          field: "user_email",
          message: `User "${userEmail}" is not active`,
        });
        userResolved = false;
      } else {
        targetUserId = targetUser.id;
        data._resolved_user_id = targetUser.id;

        // Authorization: check caller can log on behalf of this user
        const cacheKey = `${ctx.userId}:${targetUser.id}`;
        if (!onBehalfCache.has(cacheKey)) {
          const canLog = await this.timeLogsService.canLogOnBehalf(
            ctx.userId,
            ctx.isAdmin,
            targetUser.id,
            ctx.orgId,
          );
          onBehalfCache.set(cacheKey, canLog);
        }
        if (!onBehalfCache.get(cacheKey)) {
          errors.push({
            row: rowNumber,
            field: "user_email",
            message: `You do not have permission to log time for "${userEmail}"`,
          });
          userResolved = false;
        }
      }
    } else {
      data._resolved_user_id = ctx.userId;
    }

    // Project (now uses resolved target user for access check)
    const projectName = data.project_name;
    if (!projectName) {
      errors.push({
        row: rowNumber,
        field: "project_name",
        message: "Project name is required",
      });
    } else {
      const cacheKey = projectName.toLowerCase();
      if (!projectCache.has(cacheKey)) {
        const project = await this.projectsService.findActiveByNameInOrg(
          projectName,
          ctx.orgId,
        );
        projectCache.set(cacheKey, project ? { id: project.id } : null);
      }
      const project = projectCache.get(cacheKey);
      if (!project) {
        errors.push({
          row: rowNumber,
          field: "project_name",
          message: `Project "${projectName}" not found or archived`,
        });
      } else {
        data._resolved_project_id = project.id;

        // Only check project access if the target user was resolved successfully
        if (userResolved) {
          const accessKey = `${project.id}:${targetUserId}`;
          if (!accessCache.has(accessKey)) {
            const hasAccess = await this.projectsService.isUserLinkedToProject(
              project.id,
              targetUserId,
            );
            accessCache.set(accessKey, hasAccess);
          }
          if (!accessCache.get(accessKey)) {
            errors.push({
              row: rowNumber,
              field: "project_name",
              message: `User does not have access to project "${projectName}"`,
            });
          }
        }
      }
    }

    // Duplicate detection (DB-level and intra-CSV)
    if (
      errors.length === 0 &&
      data._resolved_project_id &&
      data._resolved_user_id &&
      data.task
    ) {
      const dupeKey = `${data._resolved_user_id}:${data.date}:${data._resolved_project_id}:${data.task.trim().toLowerCase()}`;
      if (!duplicateCache.has(dupeKey)) {
        const exists = await this.timeLogsService.existsByUserDateProjectTask(
          data._resolved_user_id,
          data.date,
          data._resolved_project_id,
          data.task,
        );
        duplicateCache.set(dupeKey, exists);
      }
      if (duplicateCache.get(dupeKey)) {
        errors.push({
          row: rowNumber,
          field: "",
          message:
            "A time log already exists for this user, date, project, and task",
        });
      } else {
        // Mark as seen so subsequent CSV rows with the same combo are caught
        duplicateCache.set(dupeKey, true);
      }
    }

    return errors;
  }
}
