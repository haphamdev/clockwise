import { useQuery } from "@tanstack/react-query";
import { fetchMyProfile } from "./users-api";
import { usersKeys } from "./users-keys";

export function useMyProfile() {
  return useQuery({
    queryKey: usersKeys.me(),
    queryFn: fetchMyProfile,
  });
}
