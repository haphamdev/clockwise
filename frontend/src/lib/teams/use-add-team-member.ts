import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { showErrorToast } from "@/lib/api-error-toast";
import { auditLogsKeys } from "@/lib/audit-logs/audit-logs-keys";
import { queryClient } from "@/lib/query-client";
import { usersKeys } from "@/lib/users/users-keys";
import { addTeamMember } from "./teams-api";
import { teamsKeys } from "./teams-keys";
import type { AddTeamMemberPayload } from "./types";

export function useAddTeamMember() {
  return useMutation({
    mutationFn: ({
      teamId,
      payload,
    }: {
      teamId: string;
      payload: AddTeamMemberPayload;
    }) => addTeamMember(teamId, payload),
    onSuccess: (_, { teamId }) => {
      queryClient.invalidateQueries({ queryKey: teamsKeys.detail(teamId) });
      queryClient.invalidateQueries({ queryKey: teamsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: auditLogsKeys.all });
      queryClient.invalidateQueries({ queryKey: usersKeys.all });
      toast.success("Member added");
    },
    onError: (err) => {
      showErrorToast(err, "Failed to add member");
    },
  });
}
