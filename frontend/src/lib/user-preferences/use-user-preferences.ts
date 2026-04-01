import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth/use-auth';
import { userPreferencesKeys } from './user-preferences-keys';
import { fetchUserPreferences } from './user-preferences-api';

export function useUserPreferences() {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: userPreferencesKeys.mine(),
    queryFn: fetchUserPreferences,
    enabled: isAuthenticated,
  });
}
