export interface InvitationTeamAssignmentEntity {
  teamId: string;
  teamName: string;
  role: 'manager' | 'member';
}

export interface InvitationEntity {
  id: string;
  orgId: string;
  email: string;
  invitedBy: string;
  invitedByName: string;
  token: string;
  expiresAt: Date;
  status: 'initiated' | 'sending' | 'sent' | 'accepted' | 'revoked' | 'failed';
  createdAt: Date;
  teamAssignments: InvitationTeamAssignmentEntity[];
}
