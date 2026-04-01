import { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { formatAuditAction } from '@/lib/audit-logs/format-audit-action';
import { computeMetadataDiff } from '@/lib/audit-logs/compute-metadata-diff';
import { useFormatDate } from '@/lib/org/use-format-date';
import type { AuditLogEntry } from '@/lib/audit-logs/types';

interface AuditTimelineEntryProps {
  entry: AuditLogEntry;
}

export function AuditTimelineEntry({ entry }: AuditTimelineEntryProps) {
  const [expanded, setExpanded] = useState(false);
  const { formatDateTime } = useFormatDate();
  const description = formatAuditAction(entry);
  const diff = useMemo(
    () => computeMetadataDiff(entry.metadata.before, entry.metadata.after),
    [entry.metadata.before, entry.metadata.after],
  );
  const hasDiff = entry.metadata.before && entry.metadata.after && diff.length > 0;

  return (
    <div className="group/entry relative flex gap-3 pb-6 last:pb-0">
      {/* Timeline line */}
      <div className="absolute left-[7px] top-4 bottom-0 w-px bg-border group-last/entry:hidden" />

      {/* Timeline dot */}
      <div className="relative mt-1.5 h-[15px] w-[15px] shrink-0 rounded-full border-2 border-primary bg-background" />

      <div className="min-w-0 flex-1">
        <p className="text-sm">{description}</p>
        <p className="text-xs text-muted-foreground">
          {entry.performedBy.name} &middot; {formatDateTime(entry.createdAt)}
        </p>

        {hasDiff && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="mt-1 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            {expanded ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
            Details
          </button>
        )}

        {expanded && hasDiff && (
          <div className="mt-2 rounded-md bg-muted p-3 text-xs font-mono space-y-1">
            {diff.map((d) => (
              <div key={d.field}>
                <span className="text-muted-foreground">{d.field}: </span>
                {d.oldValue && d.newValue ? (
                  <>
                    <span className="text-red-600">{d.oldValue}</span>
                    <span className="text-muted-foreground"> → </span>
                    <span className="text-green-600">{d.newValue}</span>
                  </>
                ) : d.oldValue ? (
                  <span className="text-red-600 line-through">{d.oldValue}</span>
                ) : (
                  <span className="text-green-600">{d.newValue}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
