import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/ui/page-header';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { UserInfoCard } from '@/components/admin/users/user-info-card';
import { UserMembershipsTable } from '@/components/admin/users/user-memberships-table';
import { AddToTeamSheet } from '@/components/admin/users/add-to-team-sheet';
import { AuditTimeline } from '@/components/audit-logs/audit-timeline';
import { queryClient } from '@/lib/query-client';
import { useUserDetail } from '@/lib/users/use-user-detail';
import { useUpdateUser } from '@/lib/users/use-update-user';
import { useDeactivateUser } from '@/lib/users/use-deactivate-user';
import { useReactivateUser } from '@/lib/users/use-reactivate-user';
import { useUpdateTeamMember } from '@/lib/teams/use-update-team-member';
import { useRemoveTeamMember } from '@/lib/teams/use-remove-team-member';
import { usersKeys } from '@/lib/users/users-keys';
import type { TeamRole } from '@/lib/teams/types';

export function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: user, isLoading } = useUserDetail(id!);
  const updateUser = useUpdateUser();
  const deactivateUser = useDeactivateUser();
  const reactivateUser = useReactivateUser();
  const updateMember = useUpdateTeamMember();
  const removeMember = useRemoveTeamMember();

  const [isAdmin, setIsAdmin] = useState(false);
  const [addTeamOpen, setAddTeamOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'deactivate' | 'reactivate' | null>(null);

  useEffect(() => {
    if (user) setIsAdmin(user.isAdmin);
  }, [user]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-60 w-full" />
      </div>
    );
  }

  if (!user) {
    return <p className="py-12 text-center text-muted-foreground">User not found.</p>;
  }

  const isDirty = isAdmin !== user.isAdmin;
  const isDeactivated = user.status === 'deactivated';

  const handleSave = () => {
    updateUser.mutate({ id: user.id, payload: { isAdmin } });
  };

  const handleRestore = () => setIsAdmin(user.isAdmin);

  const handleChangeRole = (teamId: string, role: TeamRole) => {
    updateMember.mutate(
      { teamId, userId: user.id, payload: { role } },
      { onSuccess: () => queryClient.invalidateQueries({ queryKey: usersKeys.all }) },
    );
  };

  const handleRemove = (teamId: string) => {
    removeMember.mutate({ teamId, userId: user.id });
  };

  const handleConfirm = () => {
    if (confirmAction === 'deactivate') {
      deactivateUser.mutate(user.id, { onSuccess: () => setConfirmAction(null) });
    } else if (confirmAction === 'reactivate') {
      reactivateUser.mutate(user.id, { onSuccess: () => setConfirmAction(null) });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={user.name}
        breadcrumbs={[
          { label: 'Users', href: '/admin/users' },
          { label: user.name },
        ]}
      />

      <UserInfoCard
        user={user}
        isAdmin={isAdmin}
        onIsAdminChange={setIsAdmin}
        onSave={handleSave}
        onRestore={handleRestore}
        onDeactivate={() => setConfirmAction('deactivate')}
        onReactivate={() => setConfirmAction('reactivate')}
        isSaving={updateUser.isPending}
        isDirty={isDirty}
      />

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Team Memberships</h2>
        {!isDeactivated && (
          <Button size="sm" onClick={() => setAddTeamOpen(true)}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Add to Team
          </Button>
        )}
      </div>

      <UserMembershipsTable
        memberships={user.teamMemberships}
        onChangeRole={handleChangeRole}
        onRemove={handleRemove}
        readOnly={isDeactivated}
        removePending={removeMember.isPending}
      />

      <AuditTimeline entityType="user" entityId={user.id} />

      <AddToTeamSheet
        userId={user.id}
        existingTeamIds={user.teamMemberships.map((t) => t.teamId)}
        open={addTeamOpen}
        onOpenChange={setAddTeamOpen}
      />

      <ConfirmDialog
        open={confirmAction !== null}
        onOpenChange={(open) => !open && setConfirmAction(null)}
        title={confirmAction === 'deactivate' ? 'Deactivate User' : 'Reactivate User'}
        description={
          confirmAction === 'deactivate'
            ? `Are you sure you want to deactivate ${user.name}? They will lose access to the organization.`
            : `Are you sure you want to reactivate ${user.name}? They will regain access to the organization.`
        }
        confirmLabel={confirmAction === 'deactivate' ? 'Deactivate' : 'Reactivate'}
        variant={confirmAction === 'deactivate' ? 'destructive' : 'default'}
        onConfirm={handleConfirm}
        isPending={deactivateUser.isPending || reactivateUser.isPending}
      />
    </div>
  );
}
