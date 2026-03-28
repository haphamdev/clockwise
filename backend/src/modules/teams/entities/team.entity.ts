export interface TeamMemberEntity {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  role: 'manager' | 'member';
  createdAt: Date;
}

export interface TeamEntity {
  id: string;
  orgId: string;
  name: string;
  description: string | null;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TeamListItem extends TeamEntity {
  memberCount: number;
}

export interface TeamWithMembers extends TeamEntity {
  members: TeamMemberEntity[];
}
