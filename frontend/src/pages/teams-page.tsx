import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { PageHeader } from '@/components/ui/page-header';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { ServerDataTable } from '@/components/ui/server-data-table';
import { getTeamsColumns } from '@/components/admin/teams/teams-columns';
import { CreateTeamSheet } from '@/components/admin/teams/create-team-sheet';
import { EditTeamSheet } from '@/components/admin/teams/edit-team-sheet';
import { useTeams } from '@/lib/teams/use-teams';
import { useArchiveTeam } from '@/lib/teams/use-archive-team';
import { useUnarchiveTeam } from '@/lib/teams/use-unarchive-team';
import { usePaginationParams } from '@/hooks/use-pagination-params';
import { useAuth } from '@/lib/auth/use-auth';
import { useDocumentTitle } from '@/hooks/use-document-title';
import type { Team } from '@/lib/teams/types';

export function TeamsPage() {
  useDocumentTitle('Clockwise - Teams');
  const { user } = useAuth();
  const isAdmin = user?.isAdmin ?? false;
  const { page, limit, setPage } = usePaginationParams();
  const [showArchived, setShowArchived] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [editTeam, setEditTeam] = useState<Team | null>(null);
  const [confirmTeam, setConfirmTeam] = useState<{ team: Team; action: 'archive' | 'unarchive' } | null>(null);

  const { data, isLoading } = useTeams({ page, limit, includeArchived: showArchived });
  const archiveTeam = useArchiveTeam();
  const unarchiveTeam = useUnarchiveTeam();

  const actionPendingId = archiveTeam.isPending
    ? archiveTeam.variables
    : unarchiveTeam.isPending
      ? unarchiveTeam.variables
      : undefined;

  const columns = useMemo(
    () =>
      isAdmin
        ? getTeamsColumns(
            (team) => setEditTeam(team),
            (team) => setConfirmTeam({ team, action: 'archive' }),
            (team) => setConfirmTeam({ team, action: 'unarchive' }),
            actionPendingId,
          )
        : getTeamsColumns(
            () => {},
            () => {},
            () => {},
            undefined,
            true,
          ),
    [actionPendingId, isAdmin],
  );

  const handleConfirm = () => {
    if (!confirmTeam) return;
    const { team, action } = confirmTeam;
    if (action === 'archive') {
      archiveTeam.mutate(team.id, { onSuccess: () => setConfirmTeam(null) });
    } else {
      unarchiveTeam.mutate(team.id, { onSuccess: () => setConfirmTeam(null) });
    }
  };

  const totalPages = data ? Math.ceil(data.total / data.limit) : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Teams"
        description={isAdmin ? "Manage your organization's teams." : "View your organization's teams."}
        actions={
          isAdmin ? (
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <Link to="/import?type=team">
                  <Upload className="mr-1.5 h-4 w-4" />
                  Import CSV
                </Link>
              </Button>
              <Button onClick={() => setCreateOpen(true)}>
                <Plus className="mr-1.5 h-4 w-4" />
                Create Team
              </Button>
            </div>
          ) : undefined
        }
      />

      <div className="flex items-center gap-2">
        <Checkbox
          id="show-archived"
          checked={showArchived}
          onCheckedChange={(v) => setShowArchived(v === true)}
        />
        <Label htmlFor="show-archived" className="text-sm">
          Show archived teams
        </Label>
      </div>

      <ServerDataTable
        columns={columns}
        data={data?.data ?? []}
        page={page}
        totalPages={totalPages}
        total={data?.total ?? 0}
        onPageChange={setPage}
        isLoading={isLoading}
      />

      {isAdmin && (
        <>
          <CreateTeamSheet open={createOpen} onOpenChange={setCreateOpen} />
          <EditTeamSheet
            team={editTeam}
            open={!!editTeam}
            onOpenChange={(open) => !open && setEditTeam(null)}
          />

          <ConfirmDialog
            open={confirmTeam !== null}
            onOpenChange={(open) => !open && setConfirmTeam(null)}
            title={confirmTeam?.action === 'archive' ? 'Archive Team' : 'Unarchive Team'}
            description={
              confirmTeam?.action === 'archive'
                ? `Are you sure you want to archive ${confirmTeam.team.name}? Members will lose access to this team.`
                : `Are you sure you want to unarchive ${confirmTeam?.team.name}? Members will regain access to this team.`
            }
            confirmLabel={confirmTeam?.action === 'archive' ? 'Archive' : 'Unarchive'}
            variant={confirmTeam?.action === 'archive' ? 'destructive' : 'default'}
            onConfirm={handleConfirm}
            isPending={archiveTeam.isPending || unarchiveTeam.isPending}
          />
        </>
      )}
    </div>
  );
}
