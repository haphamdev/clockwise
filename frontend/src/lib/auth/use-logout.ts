import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/query-client";
import { logoutUser } from "./auth-api";
import { authKeys } from "./auth-keys";

export function useLogout() {
  return useMutation({
    mutationFn: logoutUser,
    onSuccess: () => {
      queryClient.setQueryData(authKeys.user, null);
    },
  });
}
