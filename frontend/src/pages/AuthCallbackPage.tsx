import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth/use-auth";

export function AuthCallbackPage() {
  const navigate = useNavigate();
  const { handleOAuthCallback } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.slice(1));
    const token = params.get("token");

    if (token) {
      window.history.replaceState({}, "", "/auth/callback");
      handleOAuthCallback(token)
        .then(() => navigate("/dashboard", { replace: true }))
        .catch(() => {
          setError("Sign in failed. Please try again.");
        });
    } else {
      navigate("/login", { replace: true });
    }
  }, [navigate, handleOAuthCallback]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-sm text-destructive">{error}</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-sm text-muted-foreground">Signing in...</div>
    </div>
  );
}
