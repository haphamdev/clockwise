import { apiClient } from '@/lib/api-client';
import type { PaginatedResponse } from '@/lib/types';
import type {
  Team,
  TeamDetail,
  TeamMember,
  CreateTeamPayload,
  UpdateTeamPayload,
  AddTeamMemberPayload,
  UpdateTeamMemberPayload,
  ListTeamsParams,
} from './types';

export function fetchTeams(params: ListTeamsParams = {}) {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set('page', String(params.page));
  if (params.limit) searchParams.set('limit', String(params.limit));
  if (params.includeArchived) searchParams.set('includeArchived', 'true');
  const qs = searchParams.toString();
  return apiClient<PaginatedResponse<Team>>(`/teams${qs ? `?${qs}` : ''}`);
}

export function fetchTeamDetail(id: string) {
  return apiClient<TeamDetail>(`/teams/${id}`);
}

export function createTeam(payload: CreateTeamPayload) {
  return apiClient<Team>('/teams', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateTeam(id: string, payload: UpdateTeamPayload) {
  return apiClient<Team>(`/teams/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function archiveTeam(id: string) {
  return apiClient<Team>(`/teams/${id}/archive`, { method: 'PATCH' });
}

export function addTeamMember(teamId: string, payload: AddTeamMemberPayload) {
  return apiClient<TeamMember>(`/teams/${teamId}/members`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateTeamMember(teamId: string, userId: string, payload: UpdateTeamMemberPayload) {
  return apiClient<TeamMember>(`/teams/${teamId}/members/${userId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function removeTeamMember(teamId: string, userId: string) {
  return apiClient<{ message: string }>(`/teams/${teamId}/members/${userId}`, {
    method: 'DELETE',
  });
}
