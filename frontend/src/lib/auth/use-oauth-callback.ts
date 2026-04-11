import { useMutation } from "@tanstack/react-query";
import { setAccessToken } from "@/lib/api-client";
import { queryClient } from "@/lib/query-client";
import { fetchCurrentUser } from "./auth-api";
import { authKeys } from "./auth-keys";

export function useOAuthCallback() {
  return useMutation({
    mutationFn: async (token: string) => {
      setAccessToken(token);
      return fetchCurrentUser();
    },
    onSuccess: (user) => {
      queryClient.setQueryData(authKeys.user, user);
    },
    onError: () => {
      setAccessToken(null);
      queryClient.setQueryData(authKeys.user, null);
    },
  });
}
