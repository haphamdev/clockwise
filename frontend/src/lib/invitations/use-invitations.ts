import { useQuery } from '@tanstack/react-query';
import { invitationsKeys } from './invitations-keys';
import { fetchInvitations } from './invitations-api';
import type { ListInvitationsParams } from './types';

export function useInvitations(params: ListInvitationsParams = {}) {
  return useQuery({
    queryKey: invitationsKeys.list(params),
    queryFn: () => fetchInvitations(params),
  });
}
