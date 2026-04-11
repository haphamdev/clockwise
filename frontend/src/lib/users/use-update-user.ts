import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { showErrorToast } from "@/lib/api-error-toast";
import { auditLogsKeys } from "@/lib/audit-logs/audit-logs-keys";
import { queryClient } from "@/lib/query-client";
import { teamsKeys } from "@/lib/teams/teams-keys";
import type { UpdateUserPayload } from "./types";
import { updateUser } from "./users-api";
import { usersKeys } from "./users-keys";

export function useUpdateUser() {
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateUserPayload }) =>
      updateUser(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: usersKeys.all });
      queryClient.invalidateQueries({ queryKey: teamsKeys.all });
      queryClient.invalidateQueries({ queryKey: auditLogsKeys.all });
      toast.success("User updated");
    },
    onError: (err) => {
      showErrorToast(err, "Failed to update user");
    },
  });
}
