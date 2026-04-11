import { useQuery } from "@tanstack/react-query";
import { fetchOrgSettings } from "./org-api";
import { orgKeys } from "./org-keys";

export function useOrgSettings() {
  return useQuery({
    queryKey: orgKeys.settings(),
    queryFn: fetchOrgSettings,
  });
}
