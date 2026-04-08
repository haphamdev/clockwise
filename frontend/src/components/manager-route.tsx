import { useAuth } from '@/lib/auth/use-auth';
import { ForbiddenPage } from '@/pages/forbidden-page';

export function ManagerRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  const isAdminOrManager = user?.isAdmin || user?.teams.some((t) => t.role === 'manager');
  if (!isAdminOrManager) {
    return <ForbiddenPage />;
  }

  return <>{children}</>;
}
