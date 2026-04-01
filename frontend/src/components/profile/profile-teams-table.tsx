import { Link } from 'react-router-dom';
import { Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { UserTeamMembership } from '@/lib/users/types';

interface ProfileTeamsTableProps {
  memberships: UserTeamMembership[];
}

export function ProfileTeamsTable({ memberships }: ProfileTeamsTableProps) {
  if (memberships.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="No team memberships"
        description="You haven't been added to any teams yet. Contact your admin to get assigned to a team."
      />
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Team</TableHead>
            <TableHead>Role</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {memberships.map((membership) => (
            <TableRow key={membership.teamId}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Link
                    to={`/admin/teams/${membership.teamId}`}
                    className="text-sm font-medium hover:underline"
                  >
                    {membership.teamName}
                  </Link>
                  {membership.isArchived && <StatusBadge status="archived" />}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="capitalize">
                  {membership.role}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
