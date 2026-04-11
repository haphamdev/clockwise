import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { showErrorToast } from "@/lib/api-error-toast";
import { auditLogsKeys } from "@/lib/audit-logs/audit-logs-keys";
import { queryClient } from "@/lib/query-client";
import { unarchiveTimeLog } from "./time-logs-api";
import { timeLogsKeys } from "./time-logs-keys";

export function useUnarchiveTimeLog() {
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      unarchiveTimeLog(id, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: timeLogsKeys.all });
      queryClient.invalidateQueries({ queryKey: auditLogsKeys.all });
      toast.success("Time log unarchived");
    },
    onError: (err) => {
      showErrorToast(err, "Failed to unarchive time log");
    },
  });
}
