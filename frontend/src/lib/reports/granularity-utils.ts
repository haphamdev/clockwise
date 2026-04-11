import type { ReportGranularity } from "./types";

export const GRANULARITY_OPTIONS: {
  value: ReportGranularity;
  label: string;
}[] = [
  { value: "day", label: "Daily" },
  { value: "week", label: "Weekly" },
  { value: "month", label: "Monthly" },
  { value: "quarter", label: "Quarterly" },
];

/** Pick a sensible default granularity based on the date range width. */
export function autoGranularity(
  dateFrom: string,
  dateTo: string,
): ReportGranularity {
  const from = new Date(`${dateFrom}T00:00:00`);
  const to = new Date(`${dateTo}T00:00:00`);
  const days = Math.round(
    (to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (days <= 14) return "day";
  if (days <= 90) return "week";
  if (days <= 365) return "month";
  return "quarter";
}

/** Format a period start date for chart x-axis labels. */
export function formatPeriodLabel(
  start: string,
  end: string,
  granularity: ReportGranularity,
): string {
  const dStart = new Date(`${start}T00:00:00`);
  const monthStart = dStart.toLocaleString("en", { month: "short" });
  const dayStart = dStart.getDate();

  switch (granularity) {
    case "day":
      return `${monthStart} ${dayStart}`;
    case "week": {
      const dEnd = new Date(`${end}T00:00:00`);
      const dayEnd = dEnd.getDate();
      const sameMonth =
        dStart.getMonth() === dEnd.getMonth() &&
        dStart.getFullYear() === dEnd.getFullYear();
      if (sameMonth) {
        return `${monthStart}\n${dayStart}–${dayEnd}`;
      }
      const monthEnd = dEnd.toLocaleString("en", { month: "short" });
      return `${monthStart} ${dayStart}\n${monthEnd} ${dayEnd}`;
    }
    case "month":
      return `${monthStart} ${dStart.getFullYear().toString().slice(2)}`;
    case "quarter": {
      const q = Math.floor(dStart.getMonth() / 3) + 1;
      return `Q${q} ${dStart.getFullYear().toString().slice(2)}`;
    }
  }
}
