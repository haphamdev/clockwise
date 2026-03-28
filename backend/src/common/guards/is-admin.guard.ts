import {
  CanActivate,
  ExecutionContext,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { AppException, ErrorCode } from '../exceptions';

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
      throw new AppException(
        ErrorCode.ADMIN.ACCESS_REQUIRED,
        'Admin access required',
        HttpStatus.FORBIDDEN,
      );
    }

    return true;
  }
}
