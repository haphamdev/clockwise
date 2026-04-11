import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { showErrorToast } from "@/lib/api-error-toast";
import { queryClient } from "@/lib/query-client";
import { updateInvitationTeamAssignments } from "./invitations-api";
import { invitationsKeys } from "./invitations-keys";
import type { UpdateInvitationTeamAssignmentsPayload } from "./types";

export function useUpdateInvitationTeamAssignments() {
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateInvitationTeamAssignmentsPayload;
    }) => updateInvitationTeamAssignments(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invitationsKeys.lists() });
      toast.success("Team assignments updated");
    },
    onError: (err) => {
      showErrorToast(err, "Failed to update team assignments");
    },
  });
}
