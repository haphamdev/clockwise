import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Guard that verifies the current user is a member of the team
 * specified by the `:teamId` route parameter, with an optional role check.
 *
 * Unlike RolesGuard (which checks specific roles from @Roles() metadata),
 * this guard simply verifies team membership. It can also be paired with
 * @Roles() for role-specific checks.
 *
 * Admins bypass the check entirely.
 * Must be used after JwtAuthGuard so that req.user is populated.
 */
@Injectable()
export class TeamMemberGuard implements CanActivate {
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
      select: { id: true },
    });

    if (!membership) {
      throw new ForbiddenException('You are not a member of this team');
    }

    return true;
  }
}
