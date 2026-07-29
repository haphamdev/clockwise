import { useQuery } from "@tanstack/react-query";
import { authKeys } from "./auth-keys";
import { fetchDemoConfig } from "./demo-api";

export function useDemoConfig() {
  return useQuery({
    queryKey: authKeys.demoConfig,
    queryFn: fetchDemoConfig,
    staleTime: Infinity,
  });
}
