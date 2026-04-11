import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { showErrorToast } from "@/lib/api-error-toast";
import { auditLogsKeys } from "@/lib/audit-logs/audit-logs-keys";
import { queryClient } from "@/lib/query-client";
import { timeLogsKeys } from "@/lib/time-logs/time-logs-keys";
import { archiveProject } from "./projects-api";
import { projectsKeys } from "./projects-keys";

export function useArchiveProject() {
  return useMutation({
    mutationFn: archiveProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectsKeys.all });
      queryClient.invalidateQueries({ queryKey: auditLogsKeys.all });
      queryClient.invalidateQueries({ queryKey: timeLogsKeys.all });
      toast.success("Project archived");
    },
    onError: (err) => {
      showErrorToast(err, "Failed to archive project");
    },
  });
}
