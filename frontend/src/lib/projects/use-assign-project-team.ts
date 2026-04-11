import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { showErrorToast } from "@/lib/api-error-toast";
import { auditLogsKeys } from "@/lib/audit-logs/audit-logs-keys";
import { queryClient } from "@/lib/query-client";
import { assignProjectTeam } from "./projects-api";
import { projectsKeys } from "./projects-keys";
import type { AssignTeamPayload } from "./types";

export function useAssignProjectTeam() {
  return useMutation({
    mutationFn: ({
      projectId,
      payload,
    }: {
      projectId: string;
      payload: AssignTeamPayload;
    }) => assignProjectTeam(projectId, payload),
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({
        queryKey: projectsKeys.detail(projectId),
      });
      queryClient.invalidateQueries({ queryKey: projectsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: auditLogsKeys.all });
      toast.success("Team assigned to project");
    },
    onError: (err) => {
      showErrorToast(err, "Failed to assign team");
    },
  });
}
