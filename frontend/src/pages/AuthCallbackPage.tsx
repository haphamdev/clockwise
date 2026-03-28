import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { setAccessToken } from '@/lib/api-client';

export function AuthCallbackPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');

    if (token) {
      setAccessToken(token);
      window.history.replaceState({}, '', '/auth/callback');
      navigate('/dashboard', { replace: true });
    } else {
      navigate('/login', { replace: true });
    }
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-sm text-muted-foreground">Signing in...</div>
    </div>
  );
}
