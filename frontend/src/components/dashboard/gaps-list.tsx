import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { TimeDisplay } from '@/components/ui/time-display';
import type { Gap } from '@/lib/dashboard/types';

interface GapsListProps {
  gaps: Gap[] | undefined;
  isLoading: boolean;
  isError: boolean;
}

export function GapsList({ gaps, isLoading, isError }: GapsListProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Gaps This Month</CardTitle>
      </CardHeader>
      <CardContent>
        {isError ? (
          <p className="text-sm text-destructive">Failed to load gaps.</p>
        ) : isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-5 w-full" />
            ))}
          </div>
        ) : !gaps || gaps.length === 0 ? (
          <p className="text-sm text-green-500">No gaps found</p>
        ) : (
          <ul className="space-y-1">
            {gaps.map((gap) => (
              <li key={gap.date} className="flex items-center justify-between text-sm">
                <TimeDisplay value={gap.date} absolute className="text-muted-foreground" />
                <span className="font-medium">{gap.hours}h</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
