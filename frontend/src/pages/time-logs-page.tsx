import { useMemo, useState } from 'react';
import { Plus, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { ServerDataTable } from '@/components/ui/server-data-table';
import { EmptyState } from '@/components/ui/empty-state';
import { getTimeLogsColumns } from '@/components/time-logs/time-logs-columns';
import { TimeLogsFilterBar } from '@/components/time-logs/time-logs-filter-bar';
import { TimeLogsSummary } from '@/components/time-logs/time-logs-summary';
import { LogTimeSheet } from '@/components/time-logs/log-time-sheet';
import { EditTimeLogSheet } from '@/components/time-logs/edit-time-log-sheet';
import { TimeLogDetailSheet } from '@/components/time-logs/time-log-detail-sheet';
import { ArchiveTimeLogDialog } from '@/components/time-logs/archive-time-log-dialog';
import { useTimeLogs } from '@/lib/time-logs/use-time-logs';
import { usePaginationParams } from '@/hooks/use-pagination-params';
import { useAuth } from '@/lib/auth/use-auth';
import type { TimeLog } from '@/lib/time-logs/types';

export function TimeLogsPage() {
  const { user } = useAuth();
  const { page, limit, setPage, getParam, setParam } = usePaginationParams();

  const isAdmin = user?.isAdmin ?? false;
  const isManager = user?.teams.some((t) => t.role === 'manager') ?? false;
  const showUserFilter = isAdmin || isManager;
  const showTeamFilter = isAdmin || isManager;

  const dateFrom = getParam('dateFrom');
  const dateTo = getParam('dateTo');
  const projectId = getParam('projectId');
  const userId = getParam('userId');
  const teamId = getParam('teamId');

  const { data, isLoading } = useTimeLogs({
    page,
    limit,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    projectId: projectId || undefined,
    userId: userId || undefined,
    teamId: teamId || undefined,
  });

  const [logOpen, setLogOpen] = useState(false);
  const [editTimeLog, setEditTimeLog] = useState<TimeLog | null>(null);
  const [viewTimeLog, setViewTimeLog] = useState<TimeLog | null>(null);
  const [archiveState, setArchiveState] = useState<{
    id: string;
    action: 'archive' | 'unarchive';
  } | null>(null);

  const columns = useMemo(
    () =>
      getTimeLogsColumns({
        onView: (tl) => setViewTimeLog(tl),
        onEdit: (tl) => setEditTimeLog(tl),
        onArchive: (tl) => setArchiveState({ id: tl.id, action: 'archive' }),
        onUnarchive: (tl) => setArchiveState({ id: tl.id, action: 'unarchive' }),
        showUser: showUserFilter,
      }),
    [showUserFilter],
  );

  const totalPages = data ? Math.ceil(data.total / limit) : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Time Logs"
        description="Track and manage time entries."
        actions={
          <Button onClick={() => setLogOpen(true)}>
            <Plus className="mr-1.5 h-4 w-4" />
            Log Time
          </Button>
        }
      />

      <TimeLogsFilterBar
        dateFrom={dateFrom}
        dateTo={dateTo}
        projectId={projectId}
        userId={userId}
        teamId={teamId}
        showUserFilter={showUserFilter}
        showTeamFilter={showTeamFilter}
        onDateFromChange={(v) => setParam('dateFrom', v)}
        onDateToChange={(v) => setParam('dateTo', v)}
        onProjectIdChange={(v) => setParam('projectId', v === 'all' ? '' : v)}
        onUserIdChange={(v) => setParam('userId', v === 'all' ? '' : v)}
        onTeamIdChange={(v) => setParam('teamId', v === 'all' ? '' : v)}
      />

      {data && data.total > 0 && (
        <TimeLogsSummary totalHours={data.totalHours} total={data.total} />
      )}

      {!isLoading && data?.total === 0 ? (
        <EmptyState
          icon={Clock}
          title="No time logs yet"
          description="Start by logging your first time entry."
          action={
            <Button onClick={() => setLogOpen(true)}>
              <Plus className="mr-1.5 h-4 w-4" />
              Log Time
            </Button>
          }
        />
      ) : (
        <ServerDataTable
          columns={columns}
          data={data?.data ?? []}
          page={page}
          totalPages={totalPages}
          total={data?.total ?? 0}
          onPageChange={setPage}
          isLoading={isLoading}
        />
      )}

      <LogTimeSheet open={logOpen} onOpenChange={setLogOpen} />
      <EditTimeLogSheet
        timeLog={editTimeLog}
        open={!!editTimeLog}
        onOpenChange={(open) => !open && setEditTimeLog(null)}
      />
      <TimeLogDetailSheet
        timeLog={viewTimeLog}
        open={!!viewTimeLog}
        onOpenChange={(open) => !open && setViewTimeLog(null)}
      />
      <ArchiveTimeLogDialog
        timeLogId={archiveState?.id ?? null}
        action={archiveState?.action ?? null}
        open={archiveState !== null}
        onOpenChange={(open) => !open && setArchiveState(null)}
      />
    </div>
  );
}
