import { useQuery } from '@tanstack/react-query';
import { userPreferencesKeys } from './user-preferences-keys';
import { fetchUserPreferences } from './user-preferences-api';

export function useUserPreferences() {
  return useQuery({
    queryKey: userPreferencesKeys.mine(),
    queryFn: fetchUserPreferences,
  });
}
