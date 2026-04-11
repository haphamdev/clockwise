import { Injectable } from "@nestjs/common";
import { ImportJobStatus } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { ImportJobEntity } from "./entities/import-job.entity";

export interface CreateImportJobInput {
  orgId: string;
  userId: string;
  type: string;
  totalRows: number;
  bullJobId?: string;
}

export interface UpdateImportJobInput {
  status?: ImportJobStatus;
  imported?: number;
  errorCount?: number;
  completedAt?: Date;
  bullJobId?: string;
}

@Injectable()
export class ImportJobRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateImportJobInput): Promise<ImportJobEntity> {
    return this.prisma.importJob.create({ data: input });
  }

  async updateStatus(id: string, update: UpdateImportJobInput): Promise<void> {
    await this.prisma.importJob.update({ where: { id }, data: update });
  }

  async findByUser(
    userId: string,
    orgId: string,
    isAdmin: boolean,
    options: { page: number; limit: number; type?: string },
  ): Promise<{ data: ImportJobEntity[]; total: number }> {
    const where = {
      ...(isAdmin ? { orgId } : { userId, orgId }),
      ...(options.type ? { type: options.type } : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.importJob.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (options.page - 1) * options.limit,
        take: options.limit,
      }),
      this.prisma.importJob.count({ where }),
    ]);

    return { data, total };
  }
}
