import { useQuery } from '@tanstack/react-query';
import { orgKeys } from './org-keys';
import { fetchOrgSettings } from './org-api';

export function useOrgSettings() {
  return useQuery({
    queryKey: orgKeys.settings(),
    queryFn: fetchOrgSettings,
  });
}
