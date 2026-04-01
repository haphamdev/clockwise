export interface ProjectEntity {
  id: string;
  orgId: string;
  name: string;
  description: string | null;
  status: 'active' | 'archived';
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectTeamEntity {
  id: string;
  teamId: string;
  teamName: string;
  memberCount: number;
  isArchived: boolean;
  createdAt: Date;
}

export interface ProjectListItem extends ProjectEntity {
  teamCount: number;
}

export interface ProjectWithTeams extends ProjectEntity {
  teams: ProjectTeamEntity[];
}
