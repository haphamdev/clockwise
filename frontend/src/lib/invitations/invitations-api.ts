import { apiClient } from '@/lib/api-client';
import type { PaginatedResponse } from '@/lib/types';
import type {
  Invitation,
  CreateInvitationPayload,
  UpdateInvitationTeamAssignmentsPayload,
  ListInvitationsParams,
  ValidateInvitationResponse,
} from './types';

export function fetchInvitations(params: ListInvitationsParams = {}) {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set('page', String(params.page));
  if (params.limit) searchParams.set('limit', String(params.limit));
  if (params.status) searchParams.set('status', params.status);
  const qs = searchParams.toString();
  return apiClient<PaginatedResponse<Invitation>>(`/invitations${qs ? `?${qs}` : ''}`);
}

export function createInvitation(payload: CreateInvitationPayload) {
  return apiClient<Invitation>('/invitations', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateInvitationTeamAssignments(
  id: string,
  payload: UpdateInvitationTeamAssignmentsPayload,
) {
  return apiClient<Invitation>(`/invitations/${id}/team-assignments`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function revokeInvitation(id: string) {
  return apiClient<{ message: string }>(`/invitations/${id}`, { method: 'DELETE' });
}

export function resendInvitation(id: string) {
  return apiClient<Invitation>(`/invitations/${id}/resend`, { method: 'POST' });
}

export function validateInvitationToken(token: string) {
  return apiClient<ValidateInvitationResponse>(`/invitations/validate/${token}`);
}
