import { Injectable } from '@nestjs/common';
import {
  ImportProcessor,
  ImportRow,
  ImportValidationError,
  ImportPreviewResult,
  ImportResult,
  ImportCallerContext,
} from '../interfaces/import-processor.interface';
import { parseCsv, validateHeaders, parseCommaSeparated } from '../utils/csv-parser';
import { ProjectsService } from '../../projects/projects.service';
import { TeamsService } from '../../teams/teams.service';

const EXPECTED_HEADERS = [
  'name',
  'description',
  'status',
  'teams',
  'daily_hour_limit',
  'weekly_hour_limit',
];
const VALID_STATUSES = ['active', 'archived'];

@Injectable()
export class ProjectImportProcessor implements ImportProcessor {
  readonly type = 'project';
  readonly adminOnly = true;

  constructor(
    private readonly projectsService: ProjectsService,
    private readonly teamsService: TeamsService,
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
    if ('error' in headerResult) {
      return { validRows: [], executableRows: [], errors: [headerResult.error], totalRows: 0 };
    }
    const columnMap = headerResult.columnMap;

    const dataRows = rows.slice(1);
    const executableRows: ImportRow[] = [];
    const errors: ImportValidationError[] = [];

    const projectNameCache = new Map<string, { exists: boolean; isArchived: boolean }>();
    const teamCache = new Map<string, { id: string; isArchived: boolean } | null>();
    const seenNames = new Set<string>();

    const minFieldCount = Math.max(...columnMap.values()) + 1;
    let dataRowCount = 0;

    for (let i = 0; i < dataRows.length; i++) {
      const rowNumber = i + 2;
      const fields = dataRows[i];

      if (fields.length === 1 && fields[0].trim() === '') {
        continue;
      }

      dataRowCount++;

      if (fields.length < minFieldCount) {
        errors.push({ row: rowNumber, field: '', message: 'Row has too few columns' });
        continue;
      }

      const data: Record<string, string> = {};
      for (const header of EXPECTED_HEADERS) {
        const idx = columnMap.get(header)!;
        data[header] = (fields[idx] ?? '').trim();
      }

      // Default empty status to 'active'
      if (!data.status) {
        data.status = 'active';
      }

      const rowErrors = await this.validateRow(
        data,
        rowNumber,
        ctx,
        projectNameCache,
        teamCache,
        seenNames,
      );

      const cleanData: Record<string, string> = {};
      for (const key of EXPECTED_HEADERS) {
        cleanData[key] = data[key] ?? '';
      }

      if (rowErrors.length > 0) {
        for (const err of rowErrors) {
          err.data = cleanData;
        }
        errors.push(...rowErrors);
      } else {
        const resolvedTeamIds = this.resolveTeamIds(data, teamCache);
        const execData = { ...data, _resolved_team_ids: JSON.stringify(resolvedTeamIds) };
        executableRows.push({ rowNumber, data: execData });
      }
    }

    const validRows = executableRows.map((r) => {
      const cleanData: Record<string, string> = {};
      for (const key of EXPECTED_HEADERS) {
        cleanData[key] = r.data[key] ?? '';
      }
      return { rowNumber: r.rowNumber, data: cleanData };
    });

    return { validRows, executableRows, errors, totalRows: dataRowCount };
  }

  async execute(validRows: ImportRow[], ctx: ImportCallerContext): Promise<ImportResult> {
    let imported = 0;
    const errors: ImportValidationError[] = [];

    for (const row of validRows) {
      try {
        const teamIds: string[] = JSON.parse(row.data._resolved_team_ids);
        const dailyHourLimit =
          row.data.daily_hour_limit !== '' ? parseFloat(row.data.daily_hour_limit) : undefined;
        const weeklyHourLimit =
          row.data.weekly_hour_limit !== '' ? parseFloat(row.data.weekly_hour_limit) : undefined;

        await this.projectsService.createForImport(
          ctx.orgId,
          {
            name: row.data.name,
            description: row.data.description || undefined,
            status: (row.data.status as 'active' | 'archived') || undefined,
            teamIds,
            settings: { dailyHourLimit, weeklyHourLimit },
          },
          ctx.userId,
        );

        imported++;
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        errors.push({ row: row.rowNumber, field: '', message });
      }
    }

    return { totalRows: validRows.length, imported, errors };
  }

  private async validateRow(
    data: Record<string, string>,
    rowNumber: number,
    ctx: ImportCallerContext,
    projectNameCache: Map<string, { exists: boolean; isArchived: boolean }>,
    teamCache: Map<string, { id: string; isArchived: boolean } | null>,
    seenNames: Set<string>,
  ): Promise<ImportValidationError[]> {
    const errors: ImportValidationError[] = [];

    // Name
    if (!data.name) {
      errors.push({ row: rowNumber, field: 'name', message: 'Name is required' });
      return errors;
    }
    if (data.name.length > 255) {
      errors.push({
        row: rowNumber,
        field: 'name',
        message: 'Name must be 255 characters or less',
      });
      return errors;
    }

    // Status
    if (!VALID_STATUSES.includes(data.status)) {
      errors.push({
        row: rowNumber,
        field: 'status',
        message: `Status must be "active" or "archived"`,
      });
      return errors;
    }

    // Duplicate: DB
    const nameLower = data.name.toLowerCase();
    if (!projectNameCache.has(nameLower)) {
      const existing = await this.projectsService.findByNameInOrg(data.name, ctx.orgId);
      projectNameCache.set(nameLower, {
        exists: existing !== null,
        isArchived: existing?.status === 'archived',
      });
    }
    const cached = projectNameCache.get(nameLower)!;
    if (cached.exists) {
      const suffix = cached.isArchived ? ' (archived)' : '';
      errors.push({
        row: rowNumber,
        field: 'name',
        message: `Project "${data.name}" already exists${suffix}`,
      });
      return errors;
    }

    // Duplicate: intra-CSV
    if (seenNames.has(nameLower)) {
      errors.push({
        row: rowNumber,
        field: 'name',
        message: `Duplicate project name "${data.name}" in CSV`,
      });
      return errors;
    }

    // Teams (required, all must exist)
    const teamNames = parseCommaSeparated(data.teams);
    if (teamNames.length === 0) {
      errors.push({
        row: rowNumber,
        field: 'teams',
        message: 'At least one team is required',
      });
      return errors;
    }

    const uniqueTeamNames = [...new Set(teamNames.map((n) => n.toLowerCase()))];
    for (const teamName of uniqueTeamNames) {
      const originalName = teamNames.find((n) => n.toLowerCase() === teamName) ?? teamName;
      if (!teamCache.has(teamName)) {
        const team = await this.teamsService.findByNameInOrg(originalName, ctx.orgId);
        teamCache.set(teamName, team ? { id: team.id, isArchived: team.isArchived } : null);
      }
      const team = teamCache.get(teamName);
      if (!team) {
        errors.push({
          row: rowNumber,
          field: 'teams',
          message: `Team "${originalName}" not found`,
        });
      } else if (team.isArchived) {
        errors.push({
          row: rowNumber,
          field: 'teams',
          message: `Team "${originalName}" is archived`,
        });
      }
    }

    if (errors.length > 0) {
      return errors;
    }

    // Hour limits
    if (data.daily_hour_limit) {
      const val = parseFloat(data.daily_hour_limit);
      if (isNaN(val) || val < 0.01 || val > 24) {
        errors.push({
          row: rowNumber,
          field: 'daily_hour_limit',
          message: 'Daily hour limit must be between 0.01 and 24',
        });
      }
    }

    if (data.weekly_hour_limit) {
      const val = parseFloat(data.weekly_hour_limit);
      if (isNaN(val) || val < 0.01 || val > 168) {
        errors.push({
          row: rowNumber,
          field: 'weekly_hour_limit',
          message: 'Weekly hour limit must be between 0.01 and 168',
        });
      }
    }

    if (errors.length > 0) {
      return errors;
    }

    seenNames.add(nameLower);
    return errors;
  }

  private resolveTeamIds(
    data: Record<string, string>,
    teamCache: Map<string, { id: string; isArchived: boolean } | null>,
  ): string[] {
    const teamNames = parseCommaSeparated(data.teams);
    const seen = new Set<string>();
    const ids: string[] = [];

    for (const name of teamNames) {
      const team = teamCache.get(name.toLowerCase());
      if (team && !seen.has(team.id)) {
        seen.add(team.id);
        ids.push(team.id);
      }
    }

    return ids;
  }
}
