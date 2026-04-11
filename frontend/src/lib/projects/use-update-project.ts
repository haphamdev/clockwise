import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { showErrorToast } from "@/lib/api-error-toast";
import { auditLogsKeys } from "@/lib/audit-logs/audit-logs-keys";
import { queryClient } from "@/lib/query-client";
import { updateProject } from "./projects-api";
import { projectsKeys } from "./projects-keys";
import type { UpdateProjectPayload } from "./types";

export function useUpdateProject() {
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateProjectPayload;
    }) => updateProject(id, payload),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: projectsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: projectsKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: auditLogsKeys.all });
      toast.success("Project updated");
    },
    onError: (err) => {
      showErrorToast(err, "Failed to update project");
    },
  });
}
