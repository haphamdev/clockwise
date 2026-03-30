import { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { PageHeader } from '@/components/ui/page-header';
import { ServerDataTable } from '@/components/ui/server-data-table';
import { getTeamsColumns } from '@/components/admin/teams/teams-columns';
import { CreateTeamSheet } from '@/components/admin/teams/create-team-sheet';
import { EditTeamSheet } from '@/components/admin/teams/edit-team-sheet';
import { useTeams } from '@/lib/teams/use-teams';
import { useArchiveTeam } from '@/lib/teams/use-archive-team';
import { usePaginationParams } from '@/hooks/use-pagination-params';
import type { Team } from '@/lib/teams/types';

export function TeamsPage() {
  const { page, limit, setPage } = usePaginationParams();
  const [showArchived, setShowArchived] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [editTeam, setEditTeam] = useState<Team | null>(null);

  const { data, isLoading } = useTeams({ page, limit, includeArchived: showArchived });
  const archiveTeam = useArchiveTeam();

  const columns = useMemo(
    () =>
      getTeamsColumns(
        (team) => setEditTeam(team),
        (team) => archiveTeam.mutate(team.id),
      ),
    [archiveTeam],
  );

  const totalPages = data ? Math.ceil(data.total / data.limit) : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Teams"
        description="Manage your organization's teams."
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-1.5 h-4 w-4" />
            Create Team
          </Button>
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

      <CreateTeamSheet open={createOpen} onOpenChange={setCreateOpen} />
      <EditTeamSheet
        team={editTeam}
        open={!!editTeam}
        onOpenChange={(open) => !open && setEditTeam(null)}
      />
    </div>
  );
}
