export interface UserEntity {
  id: string;
  orgId: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  isAdmin: boolean;
  status: 'pending' | 'active' | 'deactivated';
  lastLoginAt: Date | null;
  refreshToken: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface TeamMembershipInfo {
  teamId: string;
  teamName: string;
  role: 'manager' | 'member';
}

export interface UserWithTeams extends UserEntity {
  teamMemberships: TeamMembershipInfo[];
}
