import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

/**
 * Guard that restricts access to admin users only.
 * Must be used after JwtAuthGuard so that req.user is populated.
 */
@Injectable()
export class IsAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user?.isAdmin) {
      throw new ForbiddenException('Admin access required');
    }

    return true;
  }
}
