import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { showErrorToast } from "@/lib/api-error-toast";
import { auditLogsKeys } from "@/lib/audit-logs/audit-logs-keys";
import { queryClient } from "@/lib/query-client";
import { tasksKeys } from "@/lib/tasks/tasks-keys";
import { createTimeLog } from "./time-logs-api";
import { timeLogsKeys } from "./time-logs-keys";
import type { CreateTimeLogPayload, TimeLogWithWarnings } from "./types";

export function useCreateTimeLog() {
  return useMutation({
    mutationFn: (payload: CreateTimeLogPayload) => createTimeLog(payload),
    onSuccess: (data: TimeLogWithWarnings) => {
      queryClient.invalidateQueries({ queryKey: timeLogsKeys.all });
      queryClient.invalidateQueries({ queryKey: auditLogsKeys.all });
      queryClient.invalidateQueries({ queryKey: tasksKeys.all });
      toast.success("Time logged");
      for (const w of data.warnings) toast.warning(w.message);
    },
    onError: (err) => {
      showErrorToast(err, "Failed to log time");
    },
  });
}
