import { useCallback, useMemo, useState } from 'react';
import { Plus, Clock, Upload } from 'lucide-react';
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
import { ImportCsvDialog } from '@/components/time-logs/import-csv-dialog';
import { useTimeLogs } from '@/lib/time-logs/use-time-logs';
import { usePaginationParams } from '@/hooks/use-pagination-params';
import { useAuth } from '@/lib/auth/use-auth';
import type { TimeLog } from '@/lib/time-logs/types';

function parseIds(value: string): string[] {
  return value ? value.split(',').filter(Boolean) : [];
}

export function TimeLogsPage() {
  const { user } = useAuth();
  const { page, limit, setPage, getParam, setParam } = usePaginationParams();

  const isAdmin = user?.isAdmin ?? false;
  const isManager = user?.teams.some((t) => t.role === 'manager') ?? false;
  const showUserFilter = isAdmin || isManager;
  const showTeamFilter = isAdmin || isManager;

  const dateFrom = getParam('dateFrom');
  const dateTo = getParam('dateTo');
  const projectIds = useMemo(() => parseIds(getParam('projectIds')), [getParam]);
  const userIds = useMemo(() => parseIds(getParam('userIds')), [getParam]);
  const teamIds = useMemo(() => parseIds(getParam('teamIds')), [getParam]);
  const includeArchived = getParam('includeArchived') === 'true';

  const setArrayParam = useCallback(
    (key: string, ids: string[]) => setParam(key, ids.join(',')),
    [setParam],
  );

  const { data, isLoading } = useTimeLogs({
    page,
    limit,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    projectIds: projectIds.length ? projectIds : undefined,
    userIds: userIds.length ? userIds : undefined,
    teamIds: teamIds.length ? teamIds : undefined,
    includeArchived: includeArchived || undefined,
  });

  const [logOpen, setLogOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
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
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setImportOpen(true)}>
              <Upload className="mr-1.5 h-4 w-4" />
              Import CSV
            </Button>
            <Button onClick={() => setLogOpen(true)}>
              <Plus className="mr-1.5 h-4 w-4" />
              Log Time
            </Button>
          </div>
        }
      />

      <TimeLogsFilterBar
        dateFrom={dateFrom}
        dateTo={dateTo}
        projectIds={projectIds}
        userIds={userIds}
        teamIds={teamIds}
        includeArchived={includeArchived}
        showUserFilter={showUserFilter}
        showTeamFilter={showTeamFilter}
        onDateFromChange={(v) => setParam('dateFrom', v)}
        onDateToChange={(v) => setParam('dateTo', v)}
        onProjectIdsChange={(v) => setArrayParam('projectIds', v)}
        onUserIdsChange={(v) => setArrayParam('userIds', v)}
        onTeamIdsChange={(v) => setArrayParam('teamIds', v)}
        onIncludeArchivedChange={(v) => setParam('includeArchived', v ? 'true' : '')}
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
      <ImportCsvDialog open={importOpen} onOpenChange={setImportOpen} />
    </div>
  );
}
