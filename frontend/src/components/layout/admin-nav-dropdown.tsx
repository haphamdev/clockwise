import { Link } from 'react-router-dom';
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
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={`outline-none ${navLinkClasses(false)}`}
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
