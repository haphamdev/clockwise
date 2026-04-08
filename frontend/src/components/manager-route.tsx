import { useAuth } from '@/lib/auth/use-auth';
import { isAdminOrManager } from '@/lib/auth/role-utils';
import { ForbiddenPage } from '@/pages/forbidden-page';

export function ManagerRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  if (!user) return null;

  if (!isAdminOrManager(user)) {
    return <ForbiddenPage />;
  }

  return <>{children}</>;
}
