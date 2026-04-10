import { useCallback, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { PageHeader } from '@/components/ui/page-header';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
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
import { useDocumentTitle } from '@/hooks/use-document-title';
import type { Invitation, InvitationStatus } from '@/lib/invitations/types';

export function InvitationsPage() {
  useDocumentTitle('Clockwise - Invitations');
  const { page, limit, setPage, getParam, setParam } = usePaginationParams();
  const status = getParam('status');
  const [inviteOpen, setInviteOpen] = useState(false);
  const [editingInvitation, setEditingInvitation] = useState<Invitation | null>(null);
  const [revokingInvitation, setRevokingInvitation] = useState<Invitation | null>(null);

  const { data, isLoading } = useInvitations({
    page,
    limit,
    status: (status as InvitationStatus) || undefined,
  });

  const revokeInvitation = useRevokeInvitation();
  const resendInvitation = useResendInvitation();

  const handleStatusChange = useCallback(
    (value: string) => setParam('status', value === 'all' ? '' : value),
    [setParam],
  );

  const resendingId = resendInvitation.isPending ? resendInvitation.variables : undefined;
  const revokingId = revokeInvitation.isPending ? revokeInvitation.variables : undefined;

  const columns = useMemo(
    () =>
      getInvitationsColumns(
        (inv) => resendInvitation.mutate(inv.id),
        (inv) => setRevokingInvitation(inv),
        (inv) => setEditingInvitation(inv),
        resendingId,
        revokingId,
      ),
    [resendInvitation, resendingId, revokingId],
  );

  const totalPages = data ? Math.ceil(data.total / data.limit) : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Invitations"
        description="Manage invitations."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link to="/import?type=invitation">
                <Upload className="mr-1.5 h-4 w-4" />
                Import CSV
              </Link>
            </Button>
            <Button onClick={() => setInviteOpen(true)}>
              <Mail className="mr-1.5 h-4 w-4" />
              Invite User
            </Button>
          </div>
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
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="initiated">Initiated</SelectItem>
              <SelectItem value="sending">Sending</SelectItem>
              <SelectItem value="accepted">Accepted</SelectItem>
              <SelectItem value="revoked">Revoked</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
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

      <ConfirmDialog
        open={revokingInvitation !== null}
        onOpenChange={(open) => !open && setRevokingInvitation(null)}
        title="Revoke Invitation"
        description={`Are you sure you want to revoke the invitation for ${revokingInvitation?.email}?`}
        confirmLabel="Revoke"
        variant="destructive"
        onConfirm={() => {
          if (revokingInvitation) {
            revokeInvitation.mutate(revokingInvitation.id, {
              onSuccess: () => setRevokingInvitation(null),
            });
          }
        }}
        isPending={revokeInvitation.isPending}
      />
    </div>
  );
}
