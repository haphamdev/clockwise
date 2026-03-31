import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AuditLogRepository, CreateAuditLogInput } from './audit-log.repository';
import { AuditLogEntity } from './entities/audit-log.entity';

@Injectable()
export class AuditLogService {
  constructor(private readonly auditLogRepository: AuditLogRepository) {}

  async log(input: CreateAuditLogInput): Promise<void> {
    await this.auditLogRepository.create(input);
  }

  async logMany(inputs: CreateAuditLogInput[]): Promise<void> {
    if (inputs.length === 0) return;
    await this.auditLogRepository.createMany(inputs);
  }

  async logInTransaction(
    tx: Prisma.TransactionClient,
    inputs: CreateAuditLogInput[],
  ): Promise<void> {
    if (inputs.length === 0) return;
    await this.auditLogRepository.createInTransaction(tx, inputs);
  }

  async findByEntity(
    orgId: string,
    entityType: string,
    entityId: string,
    options: { page: number; limit: number },
  ): Promise<{ data: AuditLogEntity[]; total: number }> {
    return this.auditLogRepository.findByEntity(orgId, entityType, entityId, options);
  }
}
