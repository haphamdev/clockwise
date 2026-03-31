import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Trash2 } from 'lucide-react';
import type { UserTeamMembership } from '@/lib/users/types';
import type { TeamRole } from '@/lib/teams/types';

interface UserMembershipsTableProps {
  memberships: UserTeamMembership[];
  onChangeRole: (teamId: string, role: TeamRole) => void;
  onRemove: (teamId: string) => void;
  readOnly?: boolean;
  removePending?: boolean;
}

export function UserMembershipsTable({
  memberships,
  onChangeRole,
  onRemove,
  readOnly,
  removePending,
}: UserMembershipsTableProps) {
  const [removingTeamId, setRemovingTeamId] = useState<string | null>(null);
  const removingTeam = memberships.find((m) => m.teamId === removingTeamId);

  useEffect(() => {
    if (removingTeamId && !removingTeam) setRemovingTeamId(null);
  }, [removingTeamId, removingTeam]);

  if (memberships.length === 0) {
    return <p className="py-6 text-center text-sm text-muted-foreground">No team memberships.</p>;
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Team</TableHead>
              <TableHead>Role</TableHead>
              {!readOnly && <TableHead className="w-[80px]" />}
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
                  {readOnly || membership.isArchived ? (
                    <Badge variant="outline" className="capitalize">{membership.role}</Badge>
                  ) : (
                    <Select
                      value={membership.role}
                      onValueChange={(value) => onChangeRole(membership.teamId, value as TeamRole)}
                    >
                      <SelectTrigger className="h-8 w-[120px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manager">
                          <Badge variant="outline" className="border-0">Manager</Badge>
                        </SelectItem>
                        <SelectItem value="member">
                          <Badge variant="outline" className="border-0">Member</Badge>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </TableCell>
                {!readOnly && (
                  <TableCell>
                    {!membership.isArchived && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        onClick={() => setRemovingTeamId(membership.teamId)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <ConfirmDialog
        open={removingTeamId !== null}
        onOpenChange={(open) => !open && setRemovingTeamId(null)}
        title="Remove from Team"
        description={
          removingTeam
            ? `Are you sure you want to remove this user from ${removingTeam.teamName}?`
            : ''
        }
        confirmLabel="Remove"
        variant="destructive"
        onConfirm={() => {
          if (removingTeamId) onRemove(removingTeamId);
        }}
        isPending={removePending}
      />
    </>
  );
}
