import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/ui/page-header';
import { TeamInfoCard } from '@/components/admin/teams/team-info-card';
import { TeamMembersTable } from '@/components/admin/teams/team-members-table';
import { AddMemberSheet } from '@/components/admin/teams/add-member-sheet';
import { EditTeamSheet } from '@/components/admin/teams/edit-team-sheet';
import { useTeamDetail } from '@/lib/teams/use-team-detail';
import { useArchiveTeam } from '@/lib/teams/use-archive-team';
import { useUnarchiveTeam } from '@/lib/teams/use-unarchive-team';
import { useUpdateTeamMember } from '@/lib/teams/use-update-team-member';
import { useRemoveTeamMember } from '@/lib/teams/use-remove-team-member';
import type { TeamRole } from '@/lib/teams/types';

export function TeamDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: team, isLoading } = useTeamDetail(id!);
  const archiveTeam = useArchiveTeam();
  const unarchiveTeam = useUnarchiveTeam();
  const updateMember = useUpdateTeamMember();
  const removeMember = useRemoveTeamMember();

  const [editOpen, setEditOpen] = useState(false);
  const [addMemberOpen, setAddMemberOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-60 w-full" />
      </div>
    );
  }

  if (!team) {
    return <p className="py-12 text-center text-muted-foreground">Team not found.</p>;
  }

  const handleChangeRole = (userId: string, role: TeamRole) => {
    updateMember.mutate({ teamId: team.id, userId, payload: { role } });
  };

  const handleRemove = (userId: string) => {
    removeMember.mutate({ teamId: team.id, userId });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={team.name}
        breadcrumbs={[
          { label: 'Teams', href: '/admin/teams' },
          { label: team.name },
        ]}
      />

      <TeamInfoCard
        team={team}
        onEdit={() => setEditOpen(true)}
        onArchive={() => archiveTeam.mutate(team.id)}
        onUnarchive={() => unarchiveTeam.mutate(team.id)}
      />

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Members</h2>
        {!team.isArchived && (
          <Button size="sm" onClick={() => setAddMemberOpen(true)}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Add Member
          </Button>
        )}
      </div>

      <TeamMembersTable
        members={team.members}
        onChangeRole={handleChangeRole}
        onRemove={handleRemove}
        readOnly={team.isArchived}
      />

      <EditTeamSheet
        team={team}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
      <AddMemberSheet
        teamId={team.id}
        existingMembers={team.members}
        open={addMemberOpen}
        onOpenChange={setAddMemberOpen}
      />
    </div>
  );
}
