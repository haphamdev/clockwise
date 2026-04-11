import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { showErrorToast } from "@/lib/api-error-toast";
import { queryClient } from "@/lib/query-client";
import { revokeInvitation } from "./invitations-api";
import { invitationsKeys } from "./invitations-keys";

export function useRevokeInvitation() {
  return useMutation({
    mutationFn: revokeInvitation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invitationsKeys.lists() });
      toast.success("Invitation revoked");
    },
    onError: (err) => {
      showErrorToast(err, "Failed to revoke invitation");
    },
  });
}
