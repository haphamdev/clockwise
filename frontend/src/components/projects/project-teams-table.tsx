import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { ProjectTeam } from '@/lib/projects/types';

interface ProjectTeamsTableProps {
  teams: ProjectTeam[];
  onRemove: (teamId: string) => void;
  canRemove: boolean;
  removePending?: boolean;
  isLastTeam: boolean;
  isAdmin?: boolean;
}

export function ProjectTeamsTable({
  teams,
  onRemove,
  canRemove,
  removePending,
  isLastTeam,
  isAdmin,
}: ProjectTeamsTableProps) {
  const [removingTeamId, setRemovingTeamId] = useState<string | null>(null);
  const removingTeam = teams.find((t) => t.teamId === removingTeamId);

  useEffect(() => {
    if (removingTeamId && !removingTeam) setRemovingTeamId(null);
  }, [removingTeamId, removingTeam]);

  if (teams.length === 0) {
    return <p className="py-6 text-center text-sm text-muted-foreground">No teams assigned.</p>;
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Team</TableHead>
              <TableHead>Members</TableHead>
              <TableHead>Status</TableHead>
              {canRemove && <TableHead className="w-[80px]" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {teams.map((team) => (
              <TableRow key={team.teamId}>
                <TableCell>
                  {isAdmin ? (
                    <Link
                      to={`/teams/${team.teamId}`}
                      className="font-medium hover:underline"
                    >
                      {team.teamName}
                    </Link>
                  ) : (
                    <span className="font-medium">{team.teamName}</span>
                  )}
                </TableCell>
                <TableCell>{team.memberCount}</TableCell>
                <TableCell>
                  <Badge variant={team.isArchived ? 'secondary' : 'outline'}>
                    {team.isArchived ? 'Archived' : 'Active'}
                  </Badge>
                </TableCell>
                {canRemove && (
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      onClick={() => setRemovingTeamId(team.teamId)}
                      disabled={isLastTeam}
                      title={isLastTeam ? 'Cannot remove the last team' : 'Remove team'}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
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
        title="Remove Team"
        description={
          removingTeam
            ? `Are you sure you want to remove "${removingTeam.teamName}" from this project?`
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
