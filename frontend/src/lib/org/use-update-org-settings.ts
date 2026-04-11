import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { showErrorToast } from "@/lib/api-error-toast";
import { queryClient } from "@/lib/query-client";
import { updateOrgSettings } from "./org-api";
import { orgKeys } from "./org-keys";

export function useUpdateOrgSettings() {
  return useMutation({
    mutationFn: updateOrgSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orgKeys.settings() });
      toast.success("Settings updated");
    },
    onError: (err) => {
      showErrorToast(err, "Failed to update settings");
    },
  });
}
