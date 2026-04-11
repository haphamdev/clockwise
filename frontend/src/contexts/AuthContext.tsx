import { type ReactNode, useMemo } from "react";
import { AuthContext } from "@/lib/auth/auth-context";
import type { AuthContextType } from "@/lib/auth/types";
import { useLogout } from "@/lib/auth/use-logout";
import { useOAuthCallback } from "@/lib/auth/use-oauth-callback";
import { useUser } from "@/lib/auth/use-user";

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: user, isLoading } = useUser();
  const logoutMutation = useLogout();
  const oauthMutation = useOAuthCallback();

  const value = useMemo<AuthContextType>(
    () => ({
      user: user ?? null,
      isAuthenticated: !!user,
      isLoading,
      login: () => {
        window.location.href = "/api/v1/auth/google";
      },
      logout: () => logoutMutation.mutateAsync(),
      handleOAuthCallback: async (token: string) => {
        await oauthMutation.mutateAsync(token);
      },
    }),
    [user, isLoading, logoutMutation, oauthMutation],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
