import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogEntity, AuditLogPerformer } from './entities/audit-log.entity';

export interface CreateAuditLogInput {
  orgId: string;
  entityType: string;
  entityId: string;
  action: string;
  performedBy: string;
  metadata?: Record<string, unknown>;
  reason?: string;
}

@Injectable()
export class AuditLogRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateAuditLogInput): Promise<void> {
    await this.prisma.auditLog.create({
      data: { ...input, metadata: input.metadata as Prisma.InputJsonValue },
    });
  }

  async createMany(inputs: CreateAuditLogInput[]): Promise<void> {
    await this.prisma.auditLog.createMany({
      data: inputs.map((i) => ({ ...i, metadata: i.metadata as Prisma.InputJsonValue })),
    });
  }

  async createInTransaction(
    tx: Prisma.TransactionClient,
    inputs: CreateAuditLogInput[],
  ): Promise<void> {
    await tx.auditLog.createMany({
      data: inputs.map((i) => ({ ...i, metadata: i.metadata as Prisma.InputJsonValue })),
    });
  }

  async findByEntity(
    orgId: string,
    entityType: string,
    entityId: string,
    options: { page: number; limit: number },
  ): Promise<{ data: AuditLogEntity[]; total: number }> {
    const where = { orgId, entityType, entityId };

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (options.page - 1) * options.limit,
        take: options.limit,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    const performerIds = [
      ...new Set(logs.map((l) => l.performedBy).filter((id) => id !== 'system')),
    ];

    const performers = performerIds.length
      ? await this.prisma.user.findMany({
          where: { id: { in: performerIds } },
          select: { id: true, name: true },
        })
      : [];

    const performerMap = new Map<string, AuditLogPerformer>(
      performers.map((p) => [p.id, { id: p.id, name: p.name }]),
    );

    return {
      data: logs.map((log) => ({
        id: log.id,
        orgId: log.orgId,
        entityType: log.entityType,
        entityId: log.entityId,
        action: log.action,
        performedBy: log.performedBy === 'system'
          ? { id: 'system', name: 'System' }
          : performerMap.get(log.performedBy) ?? { id: log.performedBy, name: 'Unknown' },
        metadata: log.metadata as Record<string, unknown>,
        reason: log.reason,
        createdAt: log.createdAt,
      })),
      total,
    };
  }
}
