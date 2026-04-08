import { Fragment, useMemo } from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { UserLink } from '@/components/users/user-link';
import type { DelayHeatmapCell } from '@/lib/reports/types';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const COLOR_BANDS = [
  { max: 1, color: 'oklch(0.82 0.15 145)', label: '0d' },
  { max: 2, color: 'oklch(0.84 0.12 128)', label: '1d' },
  { max: 4, color: 'oklch(0.86 0.10 95)', label: '2-3d' },
  { max: 6, color: 'oklch(0.78 0.14 65)', label: '4-5d' },
  { max: 8, color: 'oklch(0.70 0.16 40)', label: '6-7d' },
  { max: Infinity, color: 'oklch(0.58 0.18 25)', label: '8d+' },
] as const;

function getDelayColor(p75: number): string {
  for (const band of COLOR_BANDS) {
    if (p75 < band.max) return band.color;
  }
  return COLOR_BANDS[COLOR_BANDS.length - 1].color;
}

interface DelayHeatmapProps {
  cells: DelayHeatmapCell[];
  minEntries: number;
}

export function DelayHeatmap({ cells, minEntries }: DelayHeatmapProps) {
  const { users, grid } = useMemo(() => {
    const cellMap = new Map<string, DelayHeatmapCell>();
    const userMap = new Map<string, string>();

    for (const cell of cells) {
      userMap.set(cell.userId, cell.userName);
      cellMap.set(`${cell.userId}:${cell.weekday}`, cell);
    }

    const sortedUsers = Array.from(userMap.entries()).sort((a, b) =>
      a[1].localeCompare(b[1]),
    );

    return { users: sortedUsers, grid: cellMap };
  }, [cells]);

  if (cells.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4 text-center">
        No logging delay data for this period
      </p>
    );
  }

  return (
    <TooltipProvider>
      <div className="flex justify-end overflow-x-auto">
        <div
          className="grid gap-1 text-xs"
          style={{ gridTemplateColumns: 'auto repeat(7, 40px)' }}
        >
          {/* Header row */}
          <div />
          {WEEKDAYS.map((d) => (
            <div key={d} className="text-center font-medium text-muted-foreground">
              {d}
            </div>
          ))}

          {/* User rows */}
          {users.map(([userId, userName]) => (
            <Fragment key={userId}>
              <div className="max-w-[120px] truncate pr-2 leading-[28px]">
                <UserLink id={userId} name={userName} />
              </div>
              {WEEKDAYS.map((_, wi) => {
                const cell = grid.get(`${userId}:${wi}`);
                const hasData = cell && cell.entryCount >= minEntries;
                return (
                  <Tooltip key={`${userId}:${wi}`}>
                    <TooltipTrigger asChild>
                      <div
                        role="gridcell"
                        tabIndex={0}
                        aria-label={
                          hasData
                            ? cell.p75Delay < 0.05
                              ? `${userName}, ${WEEKDAYS[wi]}: same day (${cell.entryCount} entries)`
                              : `${userName}, ${WEEKDAYS[wi]}: ${cell.p75Delay.toFixed(1)} days delay (${cell.entryCount} entries)`
                            : `${userName}, ${WEEKDAYS[wi]}: not enough data`
                        }
                        className={`h-7 w-10 rounded ${!hasData ? 'bg-muted' : ''}`}
                        style={hasData ? { backgroundColor: getDelayColor(cell.p75Delay) } : undefined}
                      />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        {hasData
                          ? cell.p75Delay < 0.05
                            ? `P75 delay: same day (${cell.entryCount} entries)`
                            : `P75 delay: ${cell.p75Delay.toFixed(1)} days (${cell.entryCount} entries)`
                          : `Not enough data (min ${minEntries} entries)`}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </Fragment>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-end gap-1 mt-3 text-xs text-muted-foreground">
        {COLOR_BANDS.map((band) => (
          <div key={band.label} className="flex items-center gap-1">
            <div
              className="h-3 w-5 rounded-sm"
              style={{ backgroundColor: band.color }}
            />
            <span>{band.label}</span>
          </div>
        ))}
      </div>
    </TooltipProvider>
  );
}
