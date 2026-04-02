import { Injectable } from '@nestjs/common';
import { TasksRepository } from './tasks.repository';
import { ProjectsService } from '../projects/projects.service';
import { TaskEntity } from './entities/task.entity';
import { TaskInvalidLabelException, TaskNotFoundException } from '../../common/exceptions/task.exceptions';

@Injectable()
export class TasksService {
  constructor(
    private readonly tasksRepository: TasksRepository,
    private readonly projectsService: ProjectsService,
  ) {}

  async findOrCreate(projectId: string, label: string, userId: string): Promise<TaskEntity> {
    const labelNormalized = label.trim().toLowerCase();

    if (!labelNormalized) {
      throw new TaskInvalidLabelException();
    }

    const existing = await this.tasksRepository.findByLabel(projectId, labelNormalized);
    if (existing) {
      return existing;
    }

    try {
      return await this.tasksRepository.create({
        projectId,
        label: label.trim(),
        labelNormalized,
        createdBy: userId,
      });
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
        const task = await this.tasksRepository.findByLabel(projectId, labelNormalized);
        if (task) return task;
        throw new TaskNotFoundException();
      }
      throw error;
    }
  }

  async search(
    projectId: string,
    orgId: string,
    userId: string,
    isAdmin: boolean,
    options: { q?: string; page: number; limit: number },
  ): Promise<{ data: TaskEntity[]; total: number }> {
    await this.projectsService.validateProjectAccess(projectId, orgId, userId, isAdmin);
    return this.tasksRepository.search(projectId, options);
  }
}
