import { apiClient } from '@/lib/api-client';
import type {
  TimeLog,
  TimeLogWithWarnings,
  TimeLogListResponse,
  CreateTimeLogPayload,
  UpdateTimeLogPayload,
  ArchiveTimeLogPayload,
  ListTimeLogsParams,
} from './types';

export function fetchTimeLogs(params: ListTimeLogsParams = {}) {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set('page', String(params.page));
  if (params.limit) searchParams.set('limit', String(params.limit));
  if (params.dateFrom) searchParams.set('dateFrom', params.dateFrom);
  if (params.dateTo) searchParams.set('dateTo', params.dateTo);
  if (params.projectId) searchParams.set('projectId', params.projectId);
  if (params.userId) searchParams.set('userId', params.userId);
  if (params.teamId) searchParams.set('teamId', params.teamId);
  const qs = searchParams.toString();
  return apiClient<TimeLogListResponse>(`/time-logs${qs ? `?${qs}` : ''}`);
}

export function fetchTimeLog(id: string) {
  return apiClient<TimeLog>(`/time-logs/${id}`);
}

export function createTimeLog(payload: CreateTimeLogPayload) {
  return apiClient<TimeLogWithWarnings>('/time-logs', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateTimeLog(id: string, payload: UpdateTimeLogPayload) {
  return apiClient<TimeLogWithWarnings>(`/time-logs/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function archiveTimeLog(id: string, payload: ArchiveTimeLogPayload) {
  return apiClient<void>(`/time-logs/${id}/archive`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function unarchiveTimeLog(id: string, payload: ArchiveTimeLogPayload) {
  return apiClient<void>(`/time-logs/${id}/unarchive`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}
