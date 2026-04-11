import { useQuery } from "@tanstack/react-query";
import { validateInvitationToken } from "./invitations-api";
import { invitationsKeys } from "./invitations-keys";

export function useValidateInvitation(token: string) {
  return useQuery({
    queryKey: invitationsKeys.validate(token),
    queryFn: () => validateInvitationToken(token),
    enabled: !!token,
    retry: false,
  });
}
