import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { buttonVariants } from '@/components/ui/button';
import { useArchiveTimeLog } from '@/lib/time-logs/use-archive-time-log';
import { useUnarchiveTimeLog } from '@/lib/time-logs/use-unarchive-time-log';

interface ArchiveTimeLogDialogProps {
  timeLogId: string | null;
  action: 'archive' | 'unarchive' | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ArchiveTimeLogDialog({
  timeLogId,
  action,
  open,
  onOpenChange,
}: ArchiveTimeLogDialogProps) {
  const [reason, setReason] = useState('');
  const archiveTimeLog = useArchiveTimeLog();
  const unarchiveTimeLog = useUnarchiveTimeLog();

  const isPending = archiveTimeLog.isPending || unarchiveTimeLog.isPending;
  const isArchive = action === 'archive';

  const handleConfirm = () => {
    if (!timeLogId || !reason.trim()) return;

    const mutation = isArchive ? archiveTimeLog : unarchiveTimeLog;
    mutation.mutate(
      { id: timeLogId, reason: reason.trim() },
      {
        onSuccess: () => {
          setReason('');
          onOpenChange(false);
        },
      },
    );
  };

  return (
    <AlertDialog
      open={open}
      onOpenChange={(o) => {
        if (!o) setReason('');
        onOpenChange(o);
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isArchive ? 'Archive Time Log' : 'Unarchive Time Log'}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isArchive
              ? 'This will mark the time log as archived. Please provide a reason.'
              : 'This will restore the time log. Please provide a reason.'}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-2">
          <Label htmlFor="reason">Reason</Label>
          <Textarea
            id="reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Why are you making this change?"
            maxLength={500}
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className={buttonVariants({ variant: isArchive ? 'destructive' : 'default' })}
            onClick={(e) => {
              e.preventDefault();
              handleConfirm();
            }}
            disabled={isPending || !reason.trim()}
          >
            {isPending ? 'Processing...' : isArchive ? 'Archive' : 'Unarchive'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
