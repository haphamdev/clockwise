import { useQuery } from '@tanstack/react-query';
import { usersKeys } from './users-keys';
import { fetchMyProfile } from './users-api';

export function useMyProfile() {
  return useQuery({
    queryKey: usersKeys.me(),
    queryFn: fetchMyProfile,
  });
}
