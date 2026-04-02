import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  TimeLogEntity,
  TimeLogListItem,
  TimeLogTaskEntity,
} from './entities/time-log.entity';

@Injectable()
export class TimeLogsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    userId: string;
    projectId: string;
    date: Date;
    hours: number;
    notes?: string;
    taskIds: string[];
  }): Promise<TimeLogEntity> {
    const timeLog = await this.prisma.timeLog.create({
      data: {
        userId: data.userId,
        projectId: data.projectId,
        date: data.date,
        hours: data.hours,
        notes: data.notes,
        timeLogTasks: {
          create: data.taskIds.map((taskId) => ({ taskId })),
        },
      },
    });
    return this.toEntity(timeLog);
  }

  async findById(id: string): Promise<TimeLogEntity | null> {
    const timeLog = await this.prisma.timeLog.findUnique({ where: { id } });
    return timeLog ? this.toEntity(timeLog) : null;
  }

  async findListItemById(id: string, orgId: string): Promise<TimeLogListItem | null> {
    const timeLog = await this.prisma.timeLog.findFirst({
      where: { id, user: { orgId } },
      include: {
        user: { select: { id: true, name: true } },
        project: { select: { id: true, name: true } },
        timeLogTasks: {
          include: {
            task: { select: { id: true, label: true, description: true } },
          },
        },
      },
    });

    if (!timeLog) return null;

    return {
      ...this.toEntity(timeLog),
      user: { id: timeLog.user.id, name: timeLog.user.name },
      project: { id: timeLog.project.id, name: timeLog.project.name },
      tasks: timeLog.timeLogTasks.map((tlt) => this.toTaskEntity(tlt.task)),
    };
  }

  async update(
    id: string,
    data: { date?: Date; hours?: number; notes?: string },
  ): Promise<TimeLogEntity> {
    const timeLog = await this.prisma.timeLog.update({
      where: { id },
      data,
    });
    return this.toEntity(timeLog);
  }

  async replaceTimeLogTasks(timeLogId: string, taskIds: string[]): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.timeLogTask.deleteMany({ where: { timeLogId } }),
      this.prisma.timeLogTask.createMany({
        data: taskIds.map((taskId) => ({ timeLogId, taskId })),
      }),
    ]);
  }

  async archive(id: string): Promise<TimeLogEntity> {
    const timeLog = await this.prisma.timeLog.update({
      where: { id },
      data: { status: 'archived' },
    });
    return this.toEntity(timeLog);
  }

  async unarchive(id: string): Promise<TimeLogEntity> {
    const timeLog = await this.prisma.timeLog.update({
      where: { id },
      data: { status: 'active' },
    });
    return this.toEntity(timeLog);
  }

  async findAll(
    orgId: string,
    options: {
      page: number;
      limit: number;
      dateFrom?: string;
      dateTo?: string;
      projectId?: string;
      userId?: string;
      teamId?: string;
      scopedUserIds?: string[];
    },
  ): Promise<{ data: TimeLogListItem[]; total: number; totalHours: number }> {
    const where: Prisma.TimeLogWhereInput = {
      user: { orgId },
      status: 'active',
      ...(options.dateFrom && { date: { gte: new Date(options.dateFrom) } }),
      ...(options.dateTo && {
        date: {
          ...(options.dateFrom && { gte: new Date(options.dateFrom) }),
          lte: new Date(options.dateTo),
        },
      }),
      ...(options.projectId && { projectId: options.projectId }),
      ...(options.userId && { userId: options.userId }),
      ...(options.teamId && {
        project: {
          projectTeams: {
            some: { teamId: options.teamId, isDeleted: false },
          },
        },
      }),
      ...(options.scopedUserIds && {
        userId: { in: options.scopedUserIds },
      }),
    };

    const [timeLogs, total, hoursAgg] = await Promise.all([
      this.prisma.timeLog.findMany({
        where,
        include: {
          user: { select: { id: true, name: true } },
          project: { select: { id: true, name: true } },
          timeLogTasks: {
            include: {
              task: { select: { id: true, label: true, description: true } },
            },
          },
        },
        orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
        skip: (options.page - 1) * options.limit,
        take: options.limit,
      }),
      this.prisma.timeLog.count({ where }),
      this.prisma.timeLog.aggregate({
        where,
        _sum: { hours: true },
      }),
    ]);

    return {
      data: timeLogs.map((tl) => ({
        ...this.toEntity(tl),
        user: { id: tl.user.id, name: tl.user.name },
        project: { id: tl.project.id, name: tl.project.name },
        tasks: tl.timeLogTasks.map((tlt) => this.toTaskEntity(tlt.task)),
      })),
      total,
      totalHours: Number(hoursAgg._sum.hours ?? 0),
    };
  }

  async sumHoursForDate(userId: string, date: Date): Promise<number> {
    const result = await this.prisma.timeLog.aggregate({
      where: { userId, date, status: 'active' },
      _sum: { hours: true },
    });
    return Number(result._sum.hours ?? 0);
  }

  async sumHoursForWeek(userId: string, date: Date): Promise<number> {
    const d = new Date(date);
    const day = d.getDay();
    const monday = new Date(d);
    monday.setDate(d.getDate() - ((day + 6) % 7));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    const result = await this.prisma.timeLog.aggregate({
      where: {
        userId,
        status: 'active',
        date: { gte: monday, lte: sunday },
      },
      _sum: { hours: true },
    });
    return Number(result._sum.hours ?? 0);
  }

  async findManagedUserIds(managerId: string): Promise<string[]> {
    const memberships = await this.prisma.teamMember.findMany({
      where: { userId: managerId, role: 'manager', team: { isArchived: false } },
      select: { teamId: true },
    });

    const teamIds = memberships.map((m) => m.teamId);
    if (teamIds.length === 0) return [];

    const members = await this.prisma.teamMember.findMany({
      where: { teamId: { in: teamIds } },
      select: { userId: true },
      distinct: ['userId'],
    });

    return members.map((m) => m.userId);
  }

  private toEntity(timeLog: {
    id: string;
    userId: string;
    projectId: string;
    date: Date;
    hours: Prisma.Decimal | number;
    notes: string | null;
    status: string;
    createdAt: Date;
    updatedAt: Date;
  }): TimeLogEntity {
    return {
      id: timeLog.id,
      userId: timeLog.userId,
      projectId: timeLog.projectId,
      date: timeLog.date,
      hours: Number(timeLog.hours),
      notes: timeLog.notes,
      status: timeLog.status as 'active' | 'archived',
      createdAt: timeLog.createdAt,
      updatedAt: timeLog.updatedAt,
    };
  }

  private toTaskEntity(task: {
    id: string;
    label: string;
    description: string | null;
  }): TimeLogTaskEntity {
    return {
      id: task.id,
      label: task.label,
      description: task.description,
    };
  }
}
