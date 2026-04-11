import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { showErrorToast } from "@/lib/api-error-toast";
import { auditLogsKeys } from "@/lib/audit-logs/audit-logs-keys";
import { queryClient } from "@/lib/query-client";
import { usersKeys } from "@/lib/users/users-keys";
import { removeTeamMember } from "./teams-api";
import { teamsKeys } from "./teams-keys";

export function useRemoveTeamMember() {
  return useMutation({
    mutationFn: ({ teamId, userId }: { teamId: string; userId: string }) =>
      removeTeamMember(teamId, userId),
    onSuccess: (_, { teamId }) => {
      queryClient.invalidateQueries({ queryKey: teamsKeys.detail(teamId) });
      queryClient.invalidateQueries({ queryKey: teamsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: usersKeys.all });
      queryClient.invalidateQueries({ queryKey: auditLogsKeys.all });
      toast.success("Member removed");
    },
    onError: (err) => {
      showErrorToast(err, "Failed to remove member");
    },
  });
}
