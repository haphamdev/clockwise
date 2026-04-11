import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { showErrorToast } from "@/lib/api-error-toast";
import { auditLogsKeys } from "@/lib/audit-logs/audit-logs-keys";
import { projectsKeys } from "@/lib/projects/projects-keys";
import { queryClient } from "@/lib/query-client";
import { unarchiveTeam } from "./teams-api";
import { teamsKeys } from "./teams-keys";

export function useUnarchiveTeam() {
  return useMutation({
    mutationFn: unarchiveTeam,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: teamsKeys.all });
      queryClient.invalidateQueries({ queryKey: projectsKeys.all });
      queryClient.invalidateQueries({ queryKey: auditLogsKeys.all });
      toast.success("Team unarchived");
    },
    onError: (err) => {
      showErrorToast(err, "Failed to unarchive team");
    },
  });
}
