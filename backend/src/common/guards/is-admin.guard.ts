import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { AdminAccessRequiredException } from "../exceptions/admin.exceptions";

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
      throw new AdminAccessRequiredException();
    }

    return true;
  }
}
