import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotAuthenticatedException } from '../exceptions/auth.exceptions';
import {
  ProjectContextRequiredException,
  ProjectNotFoundException,
  ProjectNotOwnerException,
} from '../exceptions/project.exceptions';

/**
 * Guard that checks if the current user is the owner of the target project
 * (identified by the `:projectId` or `:id` route parameter).
 *
 * Admins bypass the check entirely.
 * Must be used after JwtAuthGuard so that req.user is populated.
 */
@Injectable()
export class IsProjectOwnerGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new NotAuthenticatedException();
    }

    if (user.isAdmin) {
      return true;
    }

    const projectId = request.params.projectId ?? request.params.id;
    if (!projectId) {
      throw new ProjectContextRequiredException();
    }

    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { ownerId: true },
    });

    if (!project) {
      throw new ProjectNotFoundException();
    }

    if (project.ownerId !== user.id) {
      throw new ProjectNotOwnerException();
    }

    return true;
  }
}
