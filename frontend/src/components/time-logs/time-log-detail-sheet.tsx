import { StatusBadge } from '@/components/ui/status-badge';
import { TaskDisplay } from '@/components/ui/task-display';
import { TimeDisplay } from '@/components/ui/time-display';
import { ProjectLink } from '@/components/projects/project-link';
import { UserLink } from '@/components/users/user-link';
import { AuditTimeline } from '@/components/audit-logs/audit-timeline';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import type { TimeLog } from '@/lib/time-logs/types';

interface TimeLogDetailSheetProps {
  timeLog: TimeLog | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TimeLogDetailSheet({ timeLog, open, onOpenChange }: TimeLogDetailSheetProps) {
  if (!timeLog) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Time Log Details</SheetTitle>
          <SheetDescription>
            {timeLog.project.name} — {timeLog.date.slice(0, 10)}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          <DetailRow label="Date">
            <TimeDisplay value={timeLog.date} mode="date" />
          </DetailRow>
          <DetailRow label="Project">
            <ProjectLink
              id={timeLog.project.id}
              name={timeLog.project.name}
              description={timeLog.project.description}
              status={timeLog.project.status}
            />
          </DetailRow>
          <DetailRow label="User">
            <UserLink
              id={timeLog.user.id}
              name={timeLog.user.name}
              email={timeLog.user.email}
              status={timeLog.user.status}
            />
          </DetailRow>
          <DetailRow label="Hours">
            <span className="font-mono">{timeLog.hours}h</span>
          </DetailRow>
          <DetailRow label="Tasks">
            <div className="flex flex-wrap gap-1">
              {timeLog.tasks.map((t) => (
                <TaskDisplay key={t.id} task={t} variant="inline" />
              ))}
            </div>
          </DetailRow>
          <DetailRow label="Notes">
            {timeLog.notes || '\u2014'}
          </DetailRow>
          <DetailRow label="Status">
            <StatusBadge status={timeLog.status} />
          </DetailRow>
          <DetailRow label="Created">
            <TimeDisplay value={timeLog.createdAt} mode="datetime" />
          </DetailRow>
        </div>

        <div className="mt-8">
          <AuditTimeline entityType="time_log" entityId={timeLog.id} />
        </div>
      </SheetContent>
    </Sheet>
  );
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-sm text-muted-foreground shrink-0">{label}</span>
      <div className="text-sm text-right">{children}</div>
    </div>
  );
}
