import { AlertTriangle, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { Warning } from '@/lib/time-logs/types';

interface WarningAlertProps {
  warnings: Warning[];
}

export function WarningAlert({ warnings }: WarningAlertProps) {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setDismissed(false);
  }, [warnings]);

  if (dismissed || warnings.length === 0) return null;

  return (
    <Alert variant="destructive" className="border-yellow-500/50 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400">
      <AlertTriangle className="h-4 w-4 !text-yellow-600 dark:!text-yellow-400" />
      <AlertDescription className="flex items-start justify-between">
        <div className="space-y-1">
          {warnings.map((w) => (
            <p key={w.type}>{w.message}</p>
          ))}
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="ml-2 shrink-0 rounded p-0.5 hover:bg-yellow-500/20"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </AlertDescription>
    </Alert>
  );
}
