import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { TaskEntity } from "./entities/task.entity";

@Injectable()
export class TasksRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByLabel(
    projectId: string,
    labelNormalized: string,
  ): Promise<TaskEntity | null> {
    const task = await this.prisma.task.findUnique({
      where: { projectId_labelNormalized: { projectId, labelNormalized } },
    });
    return task ? this.toEntity(task) : null;
  }

  async create(data: {
    projectId: string;
    label: string;
    labelNormalized: string;
    createdBy: string;
  }): Promise<TaskEntity> {
    const task = await this.prisma.task.create({ data });
    return this.toEntity(task);
  }

  async search(
    projectId: string,
    options: { q?: string; page: number; limit: number },
  ): Promise<{ data: TaskEntity[]; total: number }> {
    const where: Prisma.TaskWhereInput = {
      projectId,
      ...(options.q && {
        label: { contains: options.q, mode: "insensitive" as const },
      }),
    };

    const [tasks, total] = await Promise.all([
      this.prisma.task.findMany({
        where,
        orderBy: [{ createdAt: "desc" }],
        skip: (options.page - 1) * options.limit,
        take: options.limit,
      }),
      this.prisma.task.count({ where }),
    ]);

    return {
      data: tasks.map((t) => this.toEntity(t)),
      total,
    };
  }

  private toEntity(task: {
    id: string;
    projectId: string;
    label: string;
    labelNormalized: string;
    description: string | null;
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
  }): TaskEntity {
    return {
      id: task.id,
      projectId: task.projectId,
      label: task.label,
      labelNormalized: task.labelNormalized,
      description: task.description,
      createdBy: task.createdBy,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
    };
  }
}
