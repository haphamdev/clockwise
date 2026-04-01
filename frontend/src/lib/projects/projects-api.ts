import { apiClient } from '@/lib/api-client';
import type { PaginatedResponse } from '@/lib/types';
import type {
  Project,
  ProjectDetail,
  ProjectTeam,
  CreateProjectPayload,
  UpdateProjectPayload,
  AssignTeamPayload,
  ListProjectsParams,
} from './types';

export function fetchProjects(params: ListProjectsParams = {}) {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set('page', String(params.page));
  if (params.limit) searchParams.set('limit', String(params.limit));
  if (params.includeArchived) searchParams.set('includeArchived', 'true');
  if (params.teamId) searchParams.set('teamId', params.teamId);
  const qs = searchParams.toString();
  return apiClient<PaginatedResponse<Project>>(`/projects${qs ? `?${qs}` : ''}`);
}

export function fetchProjectDetail(id: string) {
  return apiClient<ProjectDetail>(`/projects/${id}`);
}

export function createProject(payload: CreateProjectPayload) {
  return apiClient<ProjectDetail>('/projects', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateProject(id: string, payload: UpdateProjectPayload) {
  return apiClient<Project>(`/projects/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function archiveProject(id: string) {
  return apiClient<Project>(`/projects/${id}/archive`, { method: 'PATCH' });
}

export function unarchiveProject(id: string) {
  return apiClient<Project>(`/projects/${id}/unarchive`, { method: 'PATCH' });
}

export function assignProjectTeam(projectId: string, payload: AssignTeamPayload) {
  return apiClient<ProjectTeam>(`/projects/${projectId}/teams`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function removeProjectTeam(projectId: string, teamId: string) {
  return apiClient<{ message: string }>(`/projects/${projectId}/teams/${teamId}`, {
    method: 'DELETE',
  });
}
