import { useQuery } from "@tanstack/react-query";
import { fetchUserDetail } from "./users-api";
import { usersKeys } from "./users-keys";

export function useUserDetail(id: string | null) {
  return useQuery({
    queryKey: usersKeys.detail(id ?? ""),
    queryFn: () => fetchUserDetail(id ?? ""),
    enabled: !!id,
  });
}
