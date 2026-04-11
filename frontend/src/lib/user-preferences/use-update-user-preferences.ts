import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { showErrorToast } from "@/lib/api-error-toast";
import { queryClient } from "@/lib/query-client";
import { updateUserPreferences } from "./user-preferences-api";
import { userPreferencesKeys } from "./user-preferences-keys";

export function useUpdateUserPreferences() {
  return useMutation({
    mutationFn: updateUserPreferences,
    onSuccess: (data) => {
      queryClient.setQueryData(userPreferencesKeys.mine(), data);
      toast.success("Preferences updated");
    },
    onError: (err) => {
      showErrorToast(err, "Failed to update preferences");
    },
  });
}
