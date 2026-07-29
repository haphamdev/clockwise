import { useMutation } from "@tanstack/react-query";
import { setAccessToken } from "@/lib/api-client";
import { queryClient } from "@/lib/query-client";
import { fetchCurrentUser } from "./auth-api";
import { authKeys } from "./auth-keys";
import { loginAsDemo } from "./demo-api";
import type { DemoRole } from "./types";

export function useDemoLogin() {
  return useMutation({
    mutationFn: async (role: DemoRole) => {
      const token = await loginAsDemo(role);
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
