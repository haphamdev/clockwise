import { Link } from 'react-router-dom';
import { Shield, Users, Building2, Mail, Settings } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const adminLinks = [
  { label: 'Users', href: '/admin/users', icon: Users },
  { label: 'Teams', href: '/admin/teams', icon: Building2 },
  { label: 'Invitations', href: '/admin/invitations', icon: Mail },
  { label: 'Settings', href: '/admin/settings', icon: Settings },
];

export function AdminNavDropdown() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-bg-light transition-colors outline-none">
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
