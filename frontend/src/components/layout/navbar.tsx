import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '@/lib/auth/use-auth';
import { AdminNavDropdown } from '@/components/layout/admin-nav-dropdown';
import { ReportsNavDropdown } from '@/components/layout/reports-nav-dropdown';
import { navLinkClasses } from '@/components/layout/nav-link-classes';
import { UserNav } from '@/components/layout/user-nav';

const navLinks = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Time Logs', href: '/time-logs' },
  { label: 'Import', href: '/import' },
  { label: 'Projects', href: '/projects' },
];

export function Navbar() {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b bg-bg-dark/80 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-6 px-4 sm:px-6">
        <Link to="/dashboard" className="text-lg font-bold tracking-tight text-foreground">
          Clockwise
        </Link>

        <nav className="flex items-center gap-1">
          {navLinks.map((link) => (
            <NavLink
              key={link.href}
              to={link.href}
              className={({ isActive }) => navLinkClasses(isActive)}
            >
              {link.label}
            </NavLink>
          ))}
          <ReportsNavDropdown />
          {user?.isAdmin && <AdminNavDropdown />}
        </nav>

        <div className="ml-auto">
          <UserNav />
        </div>
      </div>
    </header>
  );
}
