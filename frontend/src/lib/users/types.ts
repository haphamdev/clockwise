import type { PaginationParams } from '@/lib/types';

export type UserStatus = 'pending' | 'active' | 'deactivated';

export interface UserTeamMembership {
  teamId: string;
  teamName: string;
  role: 'manager' | 'member';
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  isAdmin: boolean;
  status: UserStatus;
  lastLoginAt: string | null;
  createdAt: string;
  teamMemberships: UserTeamMembership[];
}

export interface TeamAssignment {
  teamId: string;
  role: 'manager' | 'member';
}

export interface UpdateUserPayload {
  isAdmin?: boolean;
  teamAssignments?: TeamAssignment[];
}

export interface ListUsersParams extends PaginationParams {
  search?: string;
  status?: UserStatus;
  teamId?: string;
}
