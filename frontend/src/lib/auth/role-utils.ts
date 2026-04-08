import type { UserProfile } from './types';

export function isAdminOrManager(user: UserProfile): boolean {
  return user.isAdmin || user.teams.some((t) => t.role === 'manager');
}
