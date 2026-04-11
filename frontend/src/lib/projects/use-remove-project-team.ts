import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { showErrorToast } from "@/lib/api-error-toast";
import { auditLogsKeys } from "@/lib/audit-logs/audit-logs-keys";
import { queryClient } from "@/lib/query-client";
import { removeProjectTeam } from "./projects-api";
import { projectsKeys } from "./projects-keys";

export function useRemoveProjectTeam() {
  return useMutation({
    mutationFn: ({
      projectId,
      teamId,
    }: {
      projectId: string;
      teamId: string;
    }) => removeProjectTeam(projectId, teamId),
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({
        queryKey: projectsKeys.detail(projectId),
      });
      queryClient.invalidateQueries({ queryKey: projectsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: auditLogsKeys.all });
      toast.success("Team removed from project");
    },
    onError: (err) => {
      showErrorToast(err, "Failed to remove team");
    },
  });
}
