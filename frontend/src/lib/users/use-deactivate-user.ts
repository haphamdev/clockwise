import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { showErrorToast } from "@/lib/api-error-toast";
import { auditLogsKeys } from "@/lib/audit-logs/audit-logs-keys";
import { queryClient } from "@/lib/query-client";
import { timeLogsKeys } from "@/lib/time-logs/time-logs-keys";
import { deactivateUser } from "./users-api";
import { usersKeys } from "./users-keys";

export function useDeactivateUser() {
  return useMutation({
    mutationFn: deactivateUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: usersKeys.all });
      queryClient.invalidateQueries({ queryKey: auditLogsKeys.all });
      queryClient.invalidateQueries({ queryKey: timeLogsKeys.all });
      toast.success("User deactivated");
    },
    onError: (err) => {
      showErrorToast(err, "Failed to deactivate user");
    },
  });
}
