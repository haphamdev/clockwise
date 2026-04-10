import { Link, useLocation } from 'react-router-dom';
import { Shield, Users, Mail, Settings } from 'lucide-react';
import { navLinkClasses } from '@/components/layout/nav-link-classes';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const adminLinks = [
  { label: 'Users', href: '/admin/users', icon: Users },
  { label: 'Invitations', href: '/admin/invitations', icon: Mail },
  { label: 'Settings', href: '/admin/settings', icon: Settings },
];

export function AdminNavDropdown() {
  const { pathname } = useLocation();
  const isActive = pathname.startsWith('/admin');

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={`outline-none ${navLinkClasses(isActive)}`}
      >
        <Shield className="h-4 w-4" />
        Admin
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {adminLinks.map((link) => (
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
