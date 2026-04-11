import { SetMetadata } from "@nestjs/common";

export const ROLES_KEY = "roles";

/**
 * Decorator to annotate endpoints with required team-scoped roles.
 * Used with RolesGuard. Expects the route to have a `:teamId` param.
 *
 * @example @Roles('manager')
 * @example @Roles('manager', 'member')
 */
export const Roles = (...roles: Array<"manager" | "member">) =>
  SetMetadata(ROLES_KEY, roles);
