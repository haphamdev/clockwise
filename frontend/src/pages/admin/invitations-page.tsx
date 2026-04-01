import { useCallback, useMemo, useState } from 'react';
import { Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { PageHeader } from '@/components/ui/page-header';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ServerDataTable } from '@/components/ui/server-data-table';
import { getInvitationsColumns } from '@/components/admin/invitations/invitations-columns';
import { InviteUserSheet } from '@/components/admin/invitations/invite-user-sheet';
import { EditInvitationTeamsSheet } from '@/components/admin/invitations/edit-invitation-teams-sheet';
import { useInvitations } from '@/lib/invitations/use-invitations';
import { useRevokeInvitation } from '@/lib/invitations/use-revoke-invitation';
import { useResendInvitation } from '@/lib/invitations/use-resend-invitation';
import { usePaginationParams } from '@/hooks/use-pagination-params';
import { useFormatDate } from '@/lib/org/use-format-date';
import type { Invitation, InvitationStatus } from '@/lib/invitations/types';

export function InvitationsPage() {
  const { page, limit, setPage, getParam, setParam } = usePaginationParams();
  const status = getParam('status');
  const [inviteOpen, setInviteOpen] = useState(false);
  const [editingInvitation, setEditingInvitation] = useState<Invitation | null>(null);

  const { data, isLoading } = useInvitations({
    page,
    limit,
    status: (status as InvitationStatus) || undefined,
  });

  const revokeInvitation = useRevokeInvitation();
  const resendInvitation = useResendInvitation();
  const { formatDate } = useFormatDate();

  const handleStatusChange = useCallback(
    (value: string) => setParam('status', value === 'all' ? '' : value),
    [setParam],
  );

  const columns = useMemo(
    () =>
      getInvitationsColumns(
        (inv) => resendInvitation.mutate(inv.id),
        (inv) => revokeInvitation.mutate(inv.id),
        (inv) => setEditingInvitation(inv),
        formatDate,
      ),
    [resendInvitation, revokeInvitation, formatDate],
  );

  const totalPages = data ? Math.ceil(data.total / data.limit) : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Invitations"
        description="Manage pending invitations."
        actions={
          <Button onClick={() => setInviteOpen(true)}>
            <Mail className="mr-1.5 h-4 w-4" />
            Invite User
          </Button>
        }
      />

      <div className="flex items-end gap-4">
        <div className="space-y-1.5">
          <Label className="text-xs">Status</Label>
          <Select value={status || 'all'} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="accepted">Accepted</SelectItem>
              <SelectItem value="revoked">Revoked</SelectItem>
            </SelectContent>
          </Select>
        </div>
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

      <InviteUserSheet open={inviteOpen} onOpenChange={setInviteOpen} />
      <EditInvitationTeamsSheet
        invitation={editingInvitation}
        onOpenChange={(open) => { if (!open) setEditingInvitation(null); }}
      />
    </div>
  );
}
