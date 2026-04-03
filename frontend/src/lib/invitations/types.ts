import type { PaginationParams } from '@/lib/types';

export type InvitationStatus = 'initiated' | 'sending' | 'sent' | 'accepted' | 'revoked' | 'failed';

export interface InvitationTeamAssignment {
  teamId: string;
  teamName: string;
  role: 'manager' | 'member';
}

export interface Invitation {
  id: string;
  email: string;
  invitedByName: string;
  status: InvitationStatus;
  expiresAt: string;
  isExpired: boolean;
  createdAt: string;
  teamAssignments: InvitationTeamAssignment[];
}

export interface CreateInvitationPayload {
  email: string;
  teamAssignments: {
    teamId: string;
    role: 'manager' | 'member';
  }[];
}

export interface UpdateInvitationTeamAssignmentsPayload {
  teamAssignments: {
    teamId: string;
    role: 'manager' | 'member';
  }[];
}

export interface ListInvitationsParams extends PaginationParams {
  status?: InvitationStatus;
}

export interface ValidateInvitationResponse {
  email: string;
  orgName: string;
  expiresAt: string;
  teamAssignments: InvitationTeamAssignment[];
}
