import { apiClient } from '@/lib/api-client';
import type { MySummaryResponse, TeamBreakdownResponse, OrgOverviewResponse } from './types';

export function fetchMySummary() {
  return apiClient<MySummaryResponse>('/dashboard/my-summary');
}

export function fetchTeamBreakdown() {
  return apiClient<TeamBreakdownResponse>('/dashboard/team-breakdown');
}

export function fetchOrgOverview() {
  return apiClient<OrgOverviewResponse>('/dashboard/org-overview');
}
