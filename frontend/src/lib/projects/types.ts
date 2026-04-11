import type { PaginationParams } from "@/lib/types";

export type ProjectStatus = "active" | "archived";

export interface Project {
  id: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  teamCount: number;
  teamIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ProjectTeam {
  id: string;
  teamId: string;
  teamName: string;
  memberCount: number;
  isArchived: boolean;
  createdAt: string;
}

export interface ProjectDetail {
  id: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  teams: ProjectTeam[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectPayload {
  name: string;
  description?: string;
  teamIds: string[];
}

export interface UpdateProjectPayload {
  name?: string;
  description?: string;
}

export interface AssignTeamPayload {
  teamId: string;
}

export interface ListProjectsParams extends PaginationParams {
  includeArchived?: boolean;
  teamId?: string;
}
