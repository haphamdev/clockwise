import { useQuery } from "@tanstack/react-query";
import type { ListUsersParams } from "./types";
import { fetchUsers } from "./users-api";
import { usersKeys } from "./users-keys";

export function useUsers(
  params: ListUsersParams = {},
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: usersKeys.list(params),
    queryFn: () => fetchUsers(params),
    enabled: options?.enabled,
  });
}
