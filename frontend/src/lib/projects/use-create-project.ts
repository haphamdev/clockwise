import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { showErrorToast } from "@/lib/api-error-toast";
import { auditLogsKeys } from "@/lib/audit-logs/audit-logs-keys";
import { queryClient } from "@/lib/query-client";
import { createProject } from "./projects-api";
import { projectsKeys } from "./projects-keys";

export function useCreateProject() {
  return useMutation({
    mutationFn: createProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: auditLogsKeys.all });
      toast.success("Project created");
    },
    onError: (err) => {
      showErrorToast(err, "Failed to create project");
    },
  });
}
