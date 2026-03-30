import { useCallback, useMemo, useState } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { ServerDataTable } from '@/components/ui/server-data-table';
import { getUsersColumns } from '@/components/admin/users/users-columns';
import { UsersFilterBar } from '@/components/admin/users/users-filter-bar';
import { UserDetailSheet } from '@/components/admin/users/user-detail-sheet';
import { useUsers } from '@/lib/users/use-users';
import { usePaginationParams } from '@/hooks/use-pagination-params';
import type { User, UserStatus } from '@/lib/users/types';

export function UsersPage() {
  const { page, limit, setPage, getParam, setParam } = usePaginationParams();
  const search = getParam('search');
  const status = getParam('status');
  const teamId = getParam('teamId');

  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const { data, isLoading } = useUsers({
    page,
    limit,
    search: search || undefined,
    status: (status as UserStatus) || undefined,
    teamId: teamId || undefined,
  });

  const handleSearchChange = useCallback(
    (value: string) => setParam('search', value),
    [setParam],
  );
  const handleStatusChange = useCallback(
    (value: string) => setParam('status', value),
    [setParam],
  );
  const handleTeamChange = useCallback(
    (value: string) => setParam('teamId', value),
    [setParam],
  );

  const columns = useMemo(
    () => getUsersColumns((user: User) => setSelectedUserId(user.id)),
    [],
  );

  const totalPages = data ? Math.ceil(data.total / data.limit) : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users"
        description="Manage organization members."
      />

      <UsersFilterBar
        search={search}
        status={status}
        teamId={teamId}
        onSearchChange={handleSearchChange}
        onStatusChange={handleStatusChange}
        onTeamChange={handleTeamChange}
      />

      <ServerDataTable
        columns={columns}
        data={data?.data ?? []}
        page={page}
        totalPages={totalPages}
        total={data?.total ?? 0}
        onPageChange={setPage}
        isLoading={isLoading}
      />

      <UserDetailSheet
        userId={selectedUserId}
        open={!!selectedUserId}
        onOpenChange={(open) => !open && setSelectedUserId(null)}
      />
    </div>
  );
}
