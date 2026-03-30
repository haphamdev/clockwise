import type { ListInvitationsParams } from './types';

export const invitationsKeys = {
  all: ['invitations'] as const,
  lists: () => [...invitationsKeys.all, 'list'] as const,
  list: (params: ListInvitationsParams) => [...invitationsKeys.lists(), params] as const,
  validate: (token: string) => [...invitationsKeys.all, 'validate', token] as const,
};
