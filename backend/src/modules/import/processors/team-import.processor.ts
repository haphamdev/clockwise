import { Injectable } from '@nestjs/common';
import {
  ImportProcessor,
  ImportRow,
  ImportValidationError,
  ImportPreviewResult,
  ImportResult,
  ImportCallerContext,
} from '../interfaces/import-processor.interface';
import { parseCsv, validateHeaders } from '../utils/csv-parser';
import { TeamsService } from '../../teams/teams.service';
import { UsersService } from '../../users/users.service';

const EXPECTED_HEADERS = ['name', 'description', 'members', 'managers'];
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface ValidateRowResult {
  errors: ImportValidationError[];
  warnings: ImportValidationError[];
  resolvedMembers?: Array<{ userId: string; role: 'manager' | 'member' }>;
}

@Injectable()
export class TeamImportProcessor implements ImportProcessor {
  readonly type = 'team';

  constructor(
    private readonly teamsService: TeamsService,
    private readonly usersService: UsersService,
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

    const teamNameCache = new Map<string, { exists: boolean; isArchived: boolean }>();
    const userCache = new Map<string, { id: string; orgId: string; status: string } | null>();
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

      const result = await this.validateRow(
        data, rowNumber, ctx, teamNameCache, userCache, seenNames,
      );

      const cleanData: Record<string, string> = {};
      for (const key of EXPECTED_HEADERS) {
        cleanData[key] = data[key] ?? '';
      }

      // Warnings are non-fatal: row is still valid but user is informed
      for (const w of result.warnings) {
        w.data = cleanData;
      }
      errors.push(...result.warnings);

      if (result.errors.length > 0) {
        for (const err of result.errors) {
          err.data = cleanData;
        }
        errors.push(...result.errors);
      } else {
        const execData = { ...data, _resolved_members: JSON.stringify(result.resolvedMembers) };
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

  async execute(
    validRows: ImportRow[],
    ctx: ImportCallerContext,
  ): Promise<ImportResult> {
    let imported = 0;
    const errors: ImportValidationError[] = [];

    for (const row of validRows) {
      try {
        const members: Array<{ userId: string; role: 'manager' | 'member' }> =
          JSON.parse(row.data._resolved_members);

        await this.teamsService.createForImport(
          ctx.orgId,
          {
            name: row.data.name,
            description: row.data.description || undefined,
            members,
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
    teamNameCache: Map<string, { exists: boolean; isArchived: boolean }>,
    userCache: Map<string, { id: string; orgId: string; status: string } | null>,
    seenNames: Set<string>,
  ): Promise<ValidateRowResult> {
    const errors: ImportValidationError[] = [];
    const warnings: ImportValidationError[] = [];

    // Name
    if (!data.name) {
      errors.push({ row: rowNumber, field: 'name', message: 'Name is required' });
      return { errors, warnings };
    }
    if (data.name.length > 255) {
      errors.push({ row: rowNumber, field: 'name', message: 'Name must be 255 characters or less' });
      return { errors, warnings };
    }

    // Duplicate: DB
    const nameLower = data.name.toLowerCase();
    if (!teamNameCache.has(nameLower)) {
      const existing = await this.teamsService.findByNameInOrg(data.name, ctx.orgId);
      teamNameCache.set(nameLower, {
        exists: existing !== null,
        isArchived: existing?.isArchived ?? false,
      });
    }
    const cached = teamNameCache.get(nameLower)!;
    if (cached.exists) {
      const suffix = cached.isArchived ? ' (archived)' : '';
      errors.push({ row: rowNumber, field: 'name', message: `Team "${data.name}" already exists${suffix}` });
      return { errors, warnings };
    }

    // Duplicate: intra-CSV
    if (seenNames.has(nameLower)) {
      errors.push({ row: rowNumber, field: 'name', message: `Duplicate team name "${data.name}" in CSV` });
      return { errors, warnings };
    }

    // Resolve members
    const memberEmails = this.parseCommaSeparated(data.members);
    const managerEmails = this.parseCommaSeparated(data.managers);

    const resolvedMembers: Array<{ userId: string; role: 'manager' | 'member' }> = [];

    for (const email of managerEmails) {
      if (!EMAIL_REGEX.test(email)) {
        warnings.push({ row: rowNumber, field: 'managers', message: `"${email}" is not a valid email, skipped` });
        continue;
      }
      const user = await this.resolveUser(email, ctx.orgId, userCache);
      if (!user) {
        warnings.push({ row: rowNumber, field: 'managers', message: `User "${email}" not found, skipped` });
      } else {
        resolvedMembers.push({ userId: user.id, role: 'manager' });
      }
    }

    for (const email of memberEmails) {
      if (!EMAIL_REGEX.test(email)) {
        warnings.push({ row: rowNumber, field: 'members', message: `"${email}" is not a valid email, skipped` });
        continue;
      }
      const user = await this.resolveUser(email, ctx.orgId, userCache);
      if (!user) {
        warnings.push({ row: rowNumber, field: 'members', message: `User "${email}" not found, skipped` });
      } else {
        // Don't add if already in managers list
        if (!resolvedMembers.some((m) => m.userId === user.id)) {
          resolvedMembers.push({ userId: user.id, role: 'member' });
        }
      }
    }

    const managerCount = resolvedMembers.filter((m) => m.role === 'manager').length;
    if (managerCount === 0) {
      errors.push({ row: rowNumber, field: 'managers', message: 'At least one valid manager is required' });
      return { errors, warnings };
    }

    seenNames.add(nameLower);

    return { errors, warnings, resolvedMembers };
  }

  private parseCommaSeparated(value: string): string[] {
    if (!value) return [];
    return value.split(',').map((s) => s.trim()).filter((s) => s.length > 0);
  }

  private async resolveUser(
    email: string,
    orgId: string,
    cache: Map<string, { id: string; orgId: string; status: string } | null>,
  ): Promise<{ id: string } | null> {
    if (!cache.has(email)) {
      const user = await this.usersService.findByEmail(email);
      cache.set(email, user ? { id: user.id, orgId: user.orgId, status: user.status } : null);
    }
    const user = cache.get(email);
    if (!user || user.orgId !== orgId || user.status !== 'active') {
      return null;
    }
    return { id: user.id };
  }
}
