import {
  CanActivate,
  ExecutionContext,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { AppException } from '../exceptions/app.exception';
import { ErrorCode } from '../exceptions/error-codes';
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
      throw new AppException(
        ErrorCode.AUTH.NOT_AUTHENTICATED,
        'Not authenticated',
        HttpStatus.FORBIDDEN,
      );
    }

    if (user.isAdmin) {
      return true;
    }

    const projectId = request.params.projectId ?? request.params.id;
    if (!projectId) {
      throw new AppException(
        ErrorCode.PROJECT.CONTEXT_REQUIRED,
        'Project context required for this endpoint',
        HttpStatus.FORBIDDEN,
      );
    }

    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { ownerId: true },
    });

    if (!project) {
      throw new AppException(
        ErrorCode.PROJECT.NOT_FOUND,
        'Project not found',
        HttpStatus.NOT_FOUND,
      );
    }

    if (project.ownerId !== user.id) {
      throw new AppException(
        ErrorCode.PROJECT.NOT_OWNER,
        'Only the project owner can perform this action',
        HttpStatus.FORBIDDEN,
      );
    }

    return true;
  }
}
