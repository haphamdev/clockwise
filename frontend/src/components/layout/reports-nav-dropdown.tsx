import { Link, useLocation } from 'react-router-dom';
import { BarChart3, User, Users, FolderKanban } from 'lucide-react';
import { useAuth } from '@/lib/auth/use-auth';
import { isAdminOrManager } from '@/lib/auth/role-utils';
import { navLinkClasses } from '@/components/layout/nav-link-classes';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const reportLinks = [
  { label: 'Personal Insight', href: '/reports/personal', icon: User, requireManager: false },
  { label: 'Team Insight', href: '/reports/team', icon: Users, requireManager: true },
  { label: 'Project Insight', href: '/reports/project', icon: FolderKanban, requireManager: true },
];

export function ReportsNavDropdown() {
  const { user } = useAuth();
  const { pathname } = useLocation();

  const showManagerLinks = user ? isAdminOrManager(user) : false;
  const isActive = pathname.startsWith('/reports');

  const visibleLinks = reportLinks.filter(
    (link) => !link.requireManager || showManagerLinks,
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={`flex items-center gap-1.5 outline-none ${navLinkClasses(isActive)}`}
      >
        <BarChart3 className="h-4 w-4" />
        Reports
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {visibleLinks.map((link) => (
          <DropdownMenuItem key={link.href} asChild>
            <Link to={link.href} className="flex items-center gap-2">
              <link.icon className="h-4 w-4" />
              {link.label}
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
