import { useAuth } from '@/lib/auth/use-auth';
import { ForbiddenPage } from '@/pages/forbidden-page';

export function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  if (!user?.isAdmin) {
    return <ForbiddenPage />;
  }

  return <>{children}</>;
}
