import { Mail } from "lucide-react";
import { useCallback, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getUsersColumns } from "@/components/admin/users/users-columns";
import { UsersFilterBar } from "@/components/admin/users/users-filter-bar";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { ServerDataTable } from "@/components/ui/server-data-table";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { usePaginationParams } from "@/hooks/use-pagination-params";
import type { User, UserStatus } from "@/lib/users/types";
import { useUsers } from "@/lib/users/use-users";

export function UsersPage() {
  useDocumentTitle("Clockwise - Users");
  const navigate = useNavigate();
  const { page, limit, setPage, getParam, setParam } = usePaginationParams();
  const search = getParam("search");
  const status = getParam("status");
  const teamId = getParam("teamId");

  const { data, isLoading } = useUsers({
    page,
    limit,
    search: search || undefined,
    status: (status as UserStatus) || undefined,
    teamId: teamId || undefined,
  });

  const handleSearchChange = useCallback(
    (value: string) => setParam("search", value),
    [setParam],
  );
  const handleStatusChange = useCallback(
    (value: string) => setParam("status", value),
    [setParam],
  );
  const handleTeamChange = useCallback(
    (value: string) => setParam("teamId", value),
    [setParam],
  );

  const columns = useMemo(
    () => getUsersColumns((user: User) => navigate(`/admin/users/${user.id}`)),
    [navigate],
  );

  const totalPages = data ? Math.ceil(data.total / data.limit) : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users"
        description="Manage organization members."
        actions={
          <Button variant="outline" asChild>
            <Link to="/admin/invitations">
              <Mail className="mr-1.5 h-4 w-4" />
              Invitations
            </Link>
          </Button>
        }
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
    </div>
  );
}
