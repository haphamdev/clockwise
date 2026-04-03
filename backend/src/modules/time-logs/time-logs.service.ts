import { Injectable } from '@nestjs/common';
import { TimeLogsRepository } from './time-logs.repository';
import { TasksService } from '../tasks/tasks.service';
import { ProjectsService } from '../projects/projects.service';
import { OrgService } from '../org/org.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { TimeLogListItem, Warning } from './entities/time-log.entity';
import {
  TimeLogNotFoundException,
  TimeLogArchivedException,
  TimeLogNotArchivedException,
  TimeLogInsufficientPermissionException,
  TimeLogFutureDateException,
} from '../../common/exceptions/time-log.exceptions';

@Injectable()
export class TimeLogsService {
  constructor(
    private readonly timeLogsRepository: TimeLogsRepository,
    private readonly tasksService: TasksService,
    private readonly projectsService: ProjectsService,
    private readonly orgService: OrgService,
    private readonly auditLogService: AuditLogService,
  ) {}

  async create(
    userId: string,
    orgId: string,
    isAdmin: boolean,
    dto: {
      projectId: string;
      taskLabels: string[];
      date: string;
      hours: number;
      notes?: string;
    },
  ): Promise<{ timeLog: TimeLogListItem; warnings: Warning[] }> {
    await this.projectsService.validateProjectAccess(
      dto.projectId,
      orgId,
      userId,
      isAdmin,
      { requireActive: true },
    );

    if (dto.date.slice(0, 10) > new Date().toISOString().slice(0, 10)) {
      throw new TimeLogFutureDateException();
    }

    const logDate = new Date(dto.date);

    const uniqueLabels = [...new Set(dto.taskLabels)];
    const tasks = await Promise.all(
      uniqueLabels.map((label) =>
        this.tasksService.findOrCreate(dto.projectId, label, userId),
      ),
    );

    const timeLog = await this.timeLogsRepository.create({
      userId,
      projectId: dto.projectId,
      date: logDate,
      hours: dto.hours,
      notes: dto.notes,
      taskIds: tasks.map((t) => t.id),
    });

    await this.auditLogService.log({
      orgId,
      entityType: 'time_log',
      entityId: timeLog.id,
      action: 'created',
      performedBy: userId,
      metadata: {
        after: {
          projectId: dto.projectId,
          date: dto.date,
          hours: dto.hours,
          tasks: tasks.map((t) => t.label),
        },
      },
    });

    const listItem = await this.timeLogsRepository.findListItemById(timeLog.id, orgId);
    const warnings = await this.computeWarnings(userId, logDate, orgId, dto.projectId);

    return { timeLog: listItem!, warnings };
  }

  async createForImport(
    targetUserId: string,
    orgId: string,
    performedBy: string,
    dto: {
      projectId: string;
      taskLabel: string;
      date: string;
      hours: number;
      notes?: string;
    },
  ): Promise<void> {
    const task = await this.tasksService.findOrCreate(dto.projectId, dto.taskLabel, targetUserId);
    const logDate = new Date(dto.date + 'T00:00:00');

    const timeLog = await this.timeLogsRepository.create({
      userId: targetUserId,
      projectId: dto.projectId,
      date: logDate,
      hours: dto.hours,
      notes: dto.notes,
      taskIds: [task.id],
    });

    await this.auditLogService.log({
      orgId,
      entityType: 'time_log',
      entityId: timeLog.id,
      action: 'created',
      performedBy,
      metadata: {
        after: {
          projectId: dto.projectId,
          date: dto.date,
          hours: dto.hours,
          tasks: [task.label],
        },
        source: 'import',
        ...(targetUserId !== performedBy && { onBehalfOf: targetUserId }),
      },
    });
  }

  async existsByUserDateProjectTask(
    userId: string,
    date: string,
    projectId: string,
    taskLabel: string,
  ): Promise<boolean> {
    return this.timeLogsRepository.existsByUserDateProjectTask(
      userId,
      new Date(date + 'T00:00:00'),
      projectId,
      taskLabel,
    );
  }

  async canLogOnBehalf(callerUserId: string, callerIsAdmin: boolean, targetUserId: string): Promise<boolean> {
    if (callerIsAdmin) return true;
    if (callerUserId === targetUserId) return true;
    const managedIds = await this.timeLogsRepository.findManagedUserIds(callerUserId);
    return managedIds.includes(targetUserId);
  }

  async findById(
    id: string,
    orgId: string,
    userId: string,
    isAdmin: boolean,
  ): Promise<TimeLogListItem> {
    const timeLog = await this.timeLogsRepository.findListItemById(id, orgId);
    if (!timeLog) {
      throw new TimeLogNotFoundException();
    }

    await this.assertPermission(timeLog.userId, userId, isAdmin);
    return timeLog;
  }

  async findAll(
    orgId: string,
    userId: string,
    isAdmin: boolean,
    options: {
      page: number;
      limit: number;
      dateFrom?: string;
      dateTo?: string;
      projectIds?: string[];
      userIds?: string[];
      teamIds?: string[];
      includeArchived?: boolean;
    },
  ): Promise<{ data: TimeLogListItem[]; total: number; totalHours: number }> {
    let scopedUserIds: string[] | undefined;

    if (!isAdmin) {
      const managedIds = await this.timeLogsRepository.findManagedUserIds(userId);
      const scope =
        managedIds.length > 0
          ? [...new Set([userId, ...managedIds])]
          : [userId];

      if (options.userIds?.length) {
        // Intersect requested userIds with permitted scope
        scopedUserIds = options.userIds.filter((id) => scope.includes(id));
      } else {
        scopedUserIds = scope;
      }
    }

    // Default date range: last 4 weeks
    const dateFrom = options.dateFrom ?? this.defaultDateFrom();
    const dateTo = options.dateTo ?? this.defaultDateTo();

    return this.timeLogsRepository.findAll(orgId, {
      page: options.page,
      limit: options.limit,
      dateFrom,
      dateTo,
      projectIds: options.projectIds,
      userIds: isAdmin ? options.userIds : undefined,
      teamIds: options.teamIds,
      scopedUserIds,
      includeArchived: options.includeArchived,
    });
  }

  async update(
    id: string,
    orgId: string,
    userId: string,
    isAdmin: boolean,
    dto: {
      taskLabels?: string[];
      date?: string;
      hours?: number;
      notes?: string;
      reason: string;
    },
  ): Promise<{ timeLog: TimeLogListItem; warnings: Warning[] }> {
    const existing = await this.timeLogsRepository.findListItemById(id, orgId);
    if (!existing) {
      throw new TimeLogNotFoundException();
    }

    if (existing.status === 'archived') {
      throw new TimeLogArchivedException();
    }

    await this.assertPermission(existing.userId, userId, isAdmin);

    if (dto.date) {
      if (dto.date.slice(0, 10) > new Date().toISOString().slice(0, 10)) {
        throw new TimeLogFutureDateException();
      }
    }

    const before: Record<string, unknown> = {};
    const after: Record<string, unknown> = {};
    if (dto.hours !== undefined && dto.hours !== existing.hours) {
      before.hours = existing.hours;
      after.hours = dto.hours;
    }
    if (dto.date !== undefined && dto.date !== existing.date.toISOString().slice(0, 10)) {
      before.date = existing.date;
      after.date = dto.date;
    }
    if (dto.notes !== undefined && dto.notes !== (existing.notes ?? '')) {
      before.notes = existing.notes ?? '';
      after.notes = dto.notes;
    }

    const updateData: { date?: Date; hours?: number; notes?: string } = {};
    if (after.hours !== undefined) updateData.hours = dto.hours;
    if (after.date !== undefined) updateData.date = new Date(dto.date!);
    if (after.notes !== undefined) updateData.notes = dto.notes;

    if (Object.keys(updateData).length > 0) {
      await this.timeLogsRepository.update(id, updateData);
    }

    if (dto.taskLabels !== undefined) {
      const existingLabels = existing.tasks.map((t) => t.label).sort();
      const newLabels = [...new Set(dto.taskLabels)].sort();
      if (JSON.stringify(existingLabels) !== JSON.stringify(newLabels)) {
        before.tasks = existingLabels;
        after.tasks = newLabels;
        const tasks = await Promise.all(
          newLabels.map((label) =>
            this.tasksService.findOrCreate(existing.projectId, label, userId),
          ),
        );
        await this.timeLogsRepository.replaceTimeLogTasks(
          id,
          tasks.map((t) => t.id),
        );
      }
    }

    const hasChanges = Object.keys(after).length > 0;

    if (hasChanges) {
      await this.auditLogService.log({
        orgId,
        entityType: 'time_log',
        entityId: id,
        action: 'updated',
        performedBy: userId,
        metadata: { before, after },
        reason: dto.reason,
      });
    }

    const updated = await this.timeLogsRepository.findListItemById(id, orgId);
    const effectiveDate = dto.date ? new Date(dto.date) : existing.date;
    const warnings = await this.computeWarnings(existing.userId, effectiveDate, orgId, existing.projectId);

    return { timeLog: updated!, warnings };
  }

  async archive(
    id: string,
    orgId: string,
    userId: string,
    isAdmin: boolean,
    dto: { reason: string },
  ): Promise<void> {
    const existing = await this.timeLogsRepository.findListItemById(id, orgId);
    if (!existing) {
      throw new TimeLogNotFoundException();
    }

    if (existing.status === 'archived') {
      throw new TimeLogArchivedException();
    }

    await this.assertPermission(existing.userId, userId, isAdmin);

    await this.timeLogsRepository.archive(id);

    await this.auditLogService.log({
      orgId,
      entityType: 'time_log',
      entityId: id,
      action: 'archived',
      performedBy: userId,
      metadata: {
        before: { status: 'active' },
        after: { status: 'archived' },
      },
      reason: dto.reason,
    });
  }

  async unarchive(
    id: string,
    orgId: string,
    userId: string,
    isAdmin: boolean,
    dto: { reason: string },
  ): Promise<void> {
    const existing = await this.timeLogsRepository.findListItemById(id, orgId);
    if (!existing) {
      throw new TimeLogNotFoundException();
    }

    if (existing.status !== 'archived') {
      throw new TimeLogNotArchivedException();
    }

    await this.assertPermission(existing.userId, userId, isAdmin);

    await this.timeLogsRepository.unarchive(id);

    await this.auditLogService.log({
      orgId,
      entityType: 'time_log',
      entityId: id,
      action: 'unarchived',
      performedBy: userId,
      metadata: {
        before: { status: 'archived' },
        after: { status: 'active' },
      },
      reason: dto.reason,
    });
  }

  async computeWarnings(
    userId: string,
    date: Date,
    orgId: string,
    projectId?: string,
    additionalHours: number = 0,
  ): Promise<Warning[]> {
    const orgSettings = await this.orgService.getSettings(orgId);

    let effectiveDailyLimit = orgSettings.dailyWarningThreshold;
    let effectiveWeeklyLimit = orgSettings.weeklyWarningThreshold;

    if (projectId) {
      const projectSettings = await this.projectsService.getSettingsInternal(projectId);
      if (projectSettings.dailyHourLimit !== null) {
        effectiveDailyLimit = projectSettings.dailyHourLimit;
      }
      if (projectSettings.weeklyHourLimit !== null) {
        effectiveWeeklyLimit = projectSettings.weeklyHourLimit;
      }
    }

    const [dailyTotal, weeklyTotal] = await Promise.all([
      this.timeLogsRepository.sumHoursForDate(userId, date),
      this.timeLogsRepository.sumHoursForWeek(userId, date),
    ]);

    const effectiveDaily = dailyTotal + additionalHours;
    const effectiveWeekly = weeklyTotal + additionalHours;
    const warnings: Warning[] = [];
    const fh = (n: number) => parseFloat(n.toFixed(2)).toString();

    if (effectiveDaily > effectiveDailyLimit) {
      const msg = additionalHours > 0
        ? `Already logged ${fh(dailyTotal)}h today + ${fh(additionalHours)}h = ${fh(effectiveDaily)}h (threshold: ${fh(effectiveDailyLimit)}h)`
        : `Daily hours (${fh(effectiveDaily)}h) exceed ${fh(effectiveDailyLimit)}h threshold`;
      warnings.push({
        type: 'daily_limit',
        message: msg,
        currentHours: effectiveDaily,
        threshold: effectiveDailyLimit,
      });
    }

    if (effectiveWeekly > effectiveWeeklyLimit) {
      const msg = additionalHours > 0
        ? `Already logged ${fh(weeklyTotal)}h this week + ${fh(additionalHours)}h = ${fh(effectiveWeekly)}h (threshold: ${fh(effectiveWeeklyLimit)}h)`
        : `Weekly hours (${fh(effectiveWeekly)}h) exceed ${fh(effectiveWeeklyLimit)}h threshold`;
      warnings.push({
        type: 'weekly_limit',
        message: msg,
        currentHours: effectiveWeekly,
        threshold: effectiveWeeklyLimit,
      });
    }

    return warnings;
  }

  private async assertPermission(
    timeLogUserId: string,
    currentUserId: string,
    isAdmin: boolean,
  ): Promise<void> {
    if (isAdmin) return;
    if (timeLogUserId === currentUserId) return;

    const managedUserIds = await this.timeLogsRepository.findManagedUserIds(currentUserId);
    if (managedUserIds.includes(timeLogUserId)) return;

    throw new TimeLogInsufficientPermissionException();
  }

  private defaultDateFrom(): string {
    const d = new Date();
    d.setDate(d.getDate() - 28);
    return d.toISOString().slice(0, 10);
  }

  private defaultDateTo(): string {
    return new Date().toISOString().slice(0, 10);
  }
}
