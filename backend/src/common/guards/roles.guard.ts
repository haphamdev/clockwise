import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Guard that checks if the current user has one of the required roles
 * within the team specified by the `:teamId` route parameter.
 *
 * Admins bypass the check entirely.
 * Must be used after JwtAuthGuard so that req.user is populated.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<string[] | undefined>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Not authenticated');
    }

    // Admins bypass team-scoped role checks
    if (user.isAdmin) {
      return true;
    }

    const teamId = request.params.teamId;
    if (!teamId) {
      throw new ForbiddenException(
        'Team context required for this endpoint',
      );
    }

    const membership = await this.prisma.teamMember.findUnique({
      where: {
        teamId_userId: { teamId, userId: user.id },
      },
      select: { role: true },
    });

    if (!membership || !requiredRoles.includes(membership.role)) {
      throw new ForbiddenException(
        'You do not have the required role in this team',
      );
    }

    return true;
  }
}
