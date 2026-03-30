import { useQuery } from '@tanstack/react-query';
import { invitationsKeys } from './invitations-keys';
import { validateInvitationToken } from './invitations-api';

export function useValidateInvitation(token: string) {
  return useQuery({
    queryKey: invitationsKeys.validate(token),
    queryFn: () => validateInvitationToken(token),
    enabled: !!token,
    retry: false,
  });
}
