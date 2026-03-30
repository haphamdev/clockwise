import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '@/lib/auth/use-auth';
import { AdminNavDropdown } from '@/components/layout/admin-nav-dropdown';
import { UserNav } from '@/components/layout/user-nav';

const navLinks = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Time Logs', href: '/time-logs' },
  { label: 'Projects', href: '/projects' },
  { label: 'Reports', href: '/reports' },
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
              className={({ isActive }) =>
                `rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-bg-light text-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-bg-light'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
          {user?.isAdmin && <AdminNavDropdown />}
        </nav>

        <div className="ml-auto">
          <UserNav />
        </div>
      </div>
    </header>
  );
}
