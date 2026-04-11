import type { PaginationParams } from "@/lib/types";

export type TeamRole = "manager" | "member";

export interface Team {
  id: string;
  name: string;
  description: string | null;
  isArchived: boolean;
  memberCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface TeamMember {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userStatus: "pending" | "active" | "deactivated";
  role: TeamRole;
  createdAt: string;
}

export interface TeamDetail {
  id: string;
  name: string;
  description: string | null;
  isArchived: boolean;
  members: TeamMember[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateTeamPayload {
  name: string;
  description?: string;
}

export interface UpdateTeamPayload {
  name?: string;
  description?: string;
}

export interface AddTeamMemberPayload {
  userId: string;
  role: TeamRole;
}

export interface UpdateTeamMemberPayload {
  role: TeamRole;
}

export interface ListTeamsParams extends PaginationParams {
  includeArchived?: boolean;
}
