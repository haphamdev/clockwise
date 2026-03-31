import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AUDIT_LOG_PAGE_SIZE } from '@/lib/audit-logs/constants';
import { useAuditLogs } from '@/lib/audit-logs/use-audit-logs';
import { useMyAuditLogs } from '@/lib/audit-logs/use-my-audit-logs';
import { AuditTimelineEntry } from './audit-timeline-entry';

interface AdminTimelineProps {
  entityType: string;
  entityId: string;
  selfService?: false;
}

interface SelfServiceTimelineProps {
  selfService: true;
  entityType?: never;
  entityId?: never;
}

type AuditTimelineProps = AdminTimelineProps | SelfServiceTimelineProps;

export function AuditTimeline(props: AuditTimelineProps) {
  const [page, setPage] = useState(1);

  const isSelfService = !!props.selfService;
  const adminQuery = useAuditLogs(
    isSelfService ? '' : props.entityType!,
    isSelfService ? '' : props.entityId!,
    page,
    !isSelfService,
  );
  const selfServiceQuery = useMyAuditLogs(page, isSelfService);

  const { data, isLoading } = props.selfService ? selfServiceQuery : adminQuery;

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Activity History</h2>

      {isLoading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="h-4 w-4 rounded-full shrink-0" />
              <div className="space-y-1 flex-1">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      )}

      {data && data.data.length === 0 && (
        <p className="text-sm text-muted-foreground">No activity recorded yet.</p>
      )}

      {data && data.data.length > 0 && (
        <>
          <div>
            {data.data.map((entry) => (
              <AuditTimelineEntry key={entry.id} entry={entry} />
            ))}
          </div>

          {data.total > AUDIT_LOG_PAGE_SIZE && (
            <div className="mt-4 flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p - 1)}
                disabled={page <= 1}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {Math.ceil(data.total / AUDIT_LOG_PAGE_SIZE)}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= Math.ceil(data.total / AUDIT_LOG_PAGE_SIZE)}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
