import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

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
      throw new ForbiddenException('Not authenticated');
    }

    if (user.isAdmin) {
      return true;
    }

    const projectId = request.params.projectId ?? request.params.id;
    if (!projectId) {
      throw new ForbiddenException(
        'Project context required for this endpoint',
      );
    }

    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { ownerId: true },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (project.ownerId !== user.id) {
      throw new ForbiddenException(
        'Only the project owner can perform this action',
      );
    }

    return true;
  }
}
