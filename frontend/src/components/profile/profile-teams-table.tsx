import { Badge } from '@/components/ui/badge';
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
      <p className="py-6 text-center text-sm text-muted-foreground">
        No team memberships.
      </p>
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
                  <span className="text-sm font-medium">{membership.teamName}</span>
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
