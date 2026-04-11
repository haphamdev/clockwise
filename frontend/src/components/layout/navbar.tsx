import type { LucideIcon } from "lucide-react";
import {
  Building2,
  Clock,
  FolderKanban,
  LayoutDashboard,
  Upload,
} from "lucide-react";
import { Link, NavLink } from "react-router-dom";
import { AdminNavDropdown } from "@/components/layout/admin-nav-dropdown";
import { navLinkClasses } from "@/components/layout/nav-link-classes";
import { ReportsNavDropdown } from "@/components/layout/reports-nav-dropdown";
import { UserNav } from "@/components/layout/user-nav";
import { isAdminOrManager } from "@/lib/auth/role-utils";
import { useAuth } from "@/lib/auth/use-auth";

const navLinks: Array<{ label: string; href: string; icon: LucideIcon }> = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Time Logs", href: "/time-logs", icon: Clock },
  { label: "Projects", href: "/projects", icon: FolderKanban },
];

export function Navbar() {
  const { user } = useAuth();
  const showTeams = user ? isAdminOrManager(user) : false;

  return (
    <header className="sticky top-0 z-40 border-b bg-bg-dark/80 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-6 px-4 sm:px-6">
        <Link
          to="/dashboard"
          className="text-lg font-bold tracking-tight text-foreground"
        >
          Clockwise
        </Link>

        <nav className="flex items-center gap-1">
          {navLinks.map((link) => (
            <NavLink
              key={link.href}
              to={link.href}
              className={({ isActive }) => navLinkClasses(isActive)}
            >
              <link.icon className="h-4 w-4" />
              {link.label}
            </NavLink>
          ))}
          {showTeams && (
            <NavLink
              to="/teams"
              className={({ isActive }) => navLinkClasses(isActive)}
            >
              <Building2 className="h-4 w-4" />
              Teams
            </NavLink>
          )}
          <ReportsNavDropdown />
          <NavLink
            to="/import"
            className={({ isActive }) => navLinkClasses(isActive)}
          >
            <Upload className="h-4 w-4" />
            Import
          </NavLink>
          {user?.isAdmin && <AdminNavDropdown />}
        </nav>

        <div className="ml-auto">
          <UserNav />
        </div>
      </div>
    </header>
  );
}
