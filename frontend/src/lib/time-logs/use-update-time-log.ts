import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { showErrorToast } from "@/lib/api-error-toast";
import { auditLogsKeys } from "@/lib/audit-logs/audit-logs-keys";
import { queryClient } from "@/lib/query-client";
import { updateTimeLog } from "./time-logs-api";
import { timeLogsKeys } from "./time-logs-keys";
import type { TimeLogWithWarnings, UpdateTimeLogPayload } from "./types";

export function useUpdateTimeLog() {
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateTimeLogPayload;
    }) => updateTimeLog(id, payload),
    onSuccess: (data: TimeLogWithWarnings) => {
      queryClient.invalidateQueries({ queryKey: timeLogsKeys.all });
      queryClient.invalidateQueries({ queryKey: auditLogsKeys.all });
      if (data.warnings.length > 0) {
        for (const w of data.warnings) toast.warning(w.message);
      } else {
        toast.success("Time log updated");
      }
    },
    onError: (err) => {
      showErrorToast(err, "Failed to update time log");
    },
  });
}
