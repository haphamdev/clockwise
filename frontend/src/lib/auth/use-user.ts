import { useQuery } from "@tanstack/react-query";
import { fetchCurrentUser } from "./auth-api";
import { authKeys } from "./auth-keys";

export function useUser() {
  return useQuery({
    queryKey: authKeys.user,
    queryFn: fetchCurrentUser,
  });
}
