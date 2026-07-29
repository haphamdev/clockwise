import { Fragment, useMemo } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { UserLink } from "@/components/users/user-link";
import type { AnomalyEntry } from "@/lib/reports/types";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

interface CellData {
  warnings: number;
  criticals: number;
  weight: number;
}

interface AnomalyHeatmapProps {
  entries: AnomalyEntry[];
}

const COLOR_STEPS = [
  "oklch(0.76 0.01 33)",
  "oklch(0.76 0.03 33)",
  "oklch(0.76 0.05 33)",
  "oklch(0.76 0.08 33)",
  "oklch(0.76 0.11 33)",
  "oklch(0.76 0.14 33)",
  "oklch(0.76 0.17 33)",
  "oklch(0.76 0.20 33)",
  "oklch(0.76 0.23 33)",
  "oklch(0.76 0.26 33)",
];

function getStepIndex(percentage: number): number {
  if (percentage <= 5) return 0;
  if (percentage <= 10) return 1;
  if (percentage <= 15) return 2;
  if (percentage <= 20) return 3;
  if (percentage <= 25) return 4;
  if (percentage <= 30) return 5;
  if (percentage <= 35) return 6;
  if (percentage <= 40) return 7;
  if (percentage <= 45) return 8;
  return 9;
}

function formatTooltip(cell: CellData): string {
  const parts: string[] = [];
  if (cell.warnings > 0)
    parts.push(`${cell.warnings} warning${cell.warnings > 1 ? "s" : ""}`);
  if (cell.criticals > 0)
    parts.push(`${cell.criticals} critical${cell.criticals > 1 ? "s" : ""}`);
  return parts.join(", ");
}

export function AnomalyHeatmap({ entries }: AnomalyHeatmapProps) {
  const { users, grid, maxWeight } = useMemo(() => {
    const cellMap = new Map<string, CellData>();
    const userMap = new Map<string, string>();

    for (const e of entries) {
      userMap.set(e.userId, e.userName);
      const key = `${e.userId}:${e.weekday}`;
      const existing = cellMap.get(key);
      if (existing) {
        if (e.severity === "critical") existing.criticals++;
        else existing.warnings++;
        existing.weight = existing.warnings * 2 + existing.criticals * 3;
      } else {
        const w = e.severity === "warning" ? 1 : 0;
        const c = e.severity === "critical" ? 1 : 0;
        cellMap.set(key, { warnings: w, criticals: c, weight: w * 2 + c * 3 });
      }
    }

    let mw = 0;
    for (const cell of cellMap.values()) {
      if (cell.weight > mw) mw = cell.weight;
    }

    const sortedUsers = Array.from(userMap.entries()).sort((a, b) =>
      a[1].localeCompare(b[1]),
    );

    return { users: sortedUsers, grid: cellMap, maxWeight: mw };
  }, [entries]);

  if (entries.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4 text-center">
        No overtime detected in this period.
      </p>
    );
  }

  return (
    <div className="flex justify-end overflow-x-auto">
      <div
        className="grid gap-1 text-xs"
        style={{ gridTemplateColumns: "auto repeat(7, 40px)" }}
      >
        {/* Header row */}
        <div />
        {WEEKDAYS.map((d) => (
          <div
            key={d}
            className="text-center font-medium text-muted-foreground"
          >
            {d}
          </div>
        ))}

        {/* User rows */}
        {users.map(([userId, userName]) => (
          <Fragment key={userId}>
            <div className="truncate pr-2 leading-[28px]">
              <UserLink id={userId} name={userName} />
            </div>
            {WEEKDAYS.map((dayName, wi) => {
              const cell = grid.get(`${userId}:${wi}`);
              const bg = cell
                ? COLOR_STEPS[getStepIndex((cell.weight / maxWeight) * 100)]
                : undefined;
              return (
                <Tooltip key={`${userId}:${dayName}`}>
                  <TooltipTrigger asChild>
                    <div
                      className={`h-7 w-10 rounded ${!cell ? "bg-muted" : ""}`}
                      style={cell ? { backgroundColor: bg } : undefined}
                    />
                  </TooltipTrigger>
                  {cell && (
                    <TooltipContent>
                      <p>{formatTooltip(cell)}</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              );
            })}
          </Fragment>
        ))}
      </div>
    </div>
  );
}
