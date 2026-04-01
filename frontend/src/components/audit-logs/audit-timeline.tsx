import { Clock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
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
  const isSelfService = !!props.selfService;
  const adminQuery = useAuditLogs(
    isSelfService ? '' : props.entityType!,
    isSelfService ? '' : props.entityId!,
    !isSelfService,
  );
  const selfServiceQuery = useMyAuditLogs(isSelfService);

  const { data, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage } = props.selfService
    ? selfServiceQuery
    : adminQuery;

  const entries = data?.pages.flatMap((p) => p.data) ?? [];
  const total = data?.pages[0]?.total ?? 0;

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

      {!isLoading && entries.length === 0 && (
        <EmptyState
          icon={Clock}
          title="No activity yet"
          description="Actions like role changes, team updates, and status changes will appear here."
        />
      )}

      {entries.length > 0 && (
        <>
          <div>
            {entries.map((entry) => (
              <AuditTimelineEntry key={entry.id} entry={entry} />
            ))}
          </div>

          <div className="mt-4 flex flex-col items-start ">
            <span className="text-sm text-muted-foreground">
              Showing {entries.length} of {total}
            </span>
            {hasNextPage && (
              <Button
                variant="link"
                size="sm"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className='px-0'
              >
                {isFetchingNextPage && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Load more
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
