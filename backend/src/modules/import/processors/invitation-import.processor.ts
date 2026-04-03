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
import { InvitationsService } from '../../invitations/invitations.service';
import { TeamsService } from '../../teams/teams.service';
import { UsersService } from '../../users/users.service';

const EXPECTED_HEADERS = ['email', 'teams', 'manager_teams'];
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface ValidateRowResult {
  errors: ImportValidationError[];
  warnings: ImportValidationError[];
  resolvedAssignments?: Array<{ teamId: string; role: 'manager' | 'member' }>;
}

@Injectable()
export class InvitationImportProcessor implements ImportProcessor {
  readonly type = 'invitation';

  constructor(
    private readonly invitationsService: InvitationsService,
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

    const teamCache = new Map<string, { id: string; isArchived: boolean } | null>();
    const emailCache = new Map<string, { isActiveUser: boolean; hasActiveInvitation: boolean }>();
    const seenEmails = new Set<string>();

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
        data, rowNumber, ctx, teamCache, emailCache, seenEmails,
      );

      const cleanData: Record<string, string> = {};
      for (const key of EXPECTED_HEADERS) {
        cleanData[key] = data[key] ?? '';
      }

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
        const execData = {
          ...data,
          _resolved_team_assignments: JSON.stringify(result.resolvedAssignments),
        };
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
        const teamAssignments: Array<{ teamId: string; role: 'manager' | 'member' }> =
          JSON.parse(row.data._resolved_team_assignments);

        const invitation = await this.invitationsService.createForImport(
          ctx.orgId,
          ctx.userId,
          { email: row.data.email, teamAssignments },
        );

        await this.invitationsService.queueInvitationEmail(invitation.id);
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
    teamCache: Map<string, { id: string; isArchived: boolean } | null>,
    emailCache: Map<string, { isActiveUser: boolean; hasActiveInvitation: boolean }>,
    seenEmails: Set<string>,
  ): Promise<ValidateRowResult> {
    const errors: ImportValidationError[] = [];
    const warnings: ImportValidationError[] = [];

    // Email
    if (!data.email) {
      errors.push({ row: rowNumber, field: 'email', message: 'Email is required' });
      return { errors, warnings };
    }
    if (!EMAIL_REGEX.test(data.email)) {
      errors.push({ row: rowNumber, field: 'email', message: 'Must be a valid email address' });
      return { errors, warnings };
    }

    const emailLower = data.email.toLowerCase();

    // Check user/invitation status (cached)
    if (!emailCache.has(emailLower)) {
      const [user, activeInvitation] = await Promise.all([
        this.usersService.findByEmail(data.email),
        this.invitationsService.findActiveByEmail(ctx.orgId, data.email),
      ]);
      emailCache.set(emailLower, {
        isActiveUser: user?.status === 'active' && user?.orgId === ctx.orgId,
        hasActiveInvitation: activeInvitation !== null,
      });
    }

    const cached = emailCache.get(emailLower)!;
    if (cached.isActiveUser) {
      errors.push({
        row: rowNumber,
        field: 'email',
        message: `"${data.email}" is already registered as an active user`,
      });
      return { errors, warnings };
    }
    if (cached.hasActiveInvitation) {
      errors.push({
        row: rowNumber,
        field: 'email',
        message: `"${data.email}" already has an active invitation`,
      });
      return { errors, warnings };
    }

    // Intra-CSV duplicate
    if (seenEmails.has(emailLower)) {
      errors.push({
        row: rowNumber,
        field: 'email',
        message: `Duplicate email "${data.email}" in CSV`,
      });
      return { errors, warnings };
    }

    // Resolve teams
    const memberTeamNames = parseCommaSeparated(data.teams);
    const managerTeamNames = parseCommaSeparated(data.manager_teams);

    const resolvedAssignments: Array<{ teamId: string; role: 'manager' | 'member' }> = [];
    const resolvedTeamIds = new Set<string>();

    // Manager teams first (manager role wins if in both columns)
    for (const name of managerTeamNames) {
      const team = await this.resolveTeam(name, ctx.orgId, teamCache);
      if (!team) {
        warnings.push({
          row: rowNumber,
          field: 'manager_teams',
          message: `Team "${name}" not found, skipped`,
        });
      } else if (team.isArchived) {
        warnings.push({
          row: rowNumber,
          field: 'manager_teams',
          message: `Team "${name}" is archived, skipped`,
        });
      } else if (!resolvedTeamIds.has(team.id)) {
        resolvedTeamIds.add(team.id);
        resolvedAssignments.push({ teamId: team.id, role: 'manager' });
      }
    }

    // Member teams
    for (const name of memberTeamNames) {
      const team = await this.resolveTeam(name, ctx.orgId, teamCache);
      if (!team) {
        warnings.push({
          row: rowNumber,
          field: 'teams',
          message: `Team "${name}" not found, skipped`,
        });
      } else if (team.isArchived) {
        warnings.push({
          row: rowNumber,
          field: 'teams',
          message: `Team "${name}" is archived, skipped`,
        });
      } else if (!resolvedTeamIds.has(team.id)) {
        resolvedTeamIds.add(team.id);
        resolvedAssignments.push({ teamId: team.id, role: 'member' });
      }
    }

    // Need at least one valid team
    if (resolvedAssignments.length === 0) {
      errors.push({
        row: rowNumber,
        field: 'teams',
        message: 'At least one valid team is required',
      });
      return { errors, warnings };
    }

    seenEmails.add(emailLower);
    return { errors, warnings, resolvedAssignments };
  }

  private async resolveTeam(
    name: string,
    orgId: string,
    cache: Map<string, { id: string; isArchived: boolean } | null>,
  ): Promise<{ id: string; isArchived: boolean } | null> {
    const key = name.toLowerCase();
    if (!cache.has(key)) {
      const team = await this.teamsService.findByNameInOrg(name, orgId);
      cache.set(key, team ? { id: team.id, isArchived: team.isArchived } : null);
    }
    return cache.get(key) ?? null;
  }
}
