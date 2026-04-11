import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { showErrorToast } from "@/lib/api-error-toast";
import { queryClient } from "@/lib/query-client";
import { createInvitation } from "./invitations-api";
import { invitationsKeys } from "./invitations-keys";

export function useCreateInvitation() {
  return useMutation({
    mutationFn: createInvitation,
    onSuccess: () => {
      toast.success("Invitation sent");
    },
    onError: (err) => {
      showErrorToast(err, "Failed to send invitation");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: invitationsKeys.lists() });
    },
  });
}
