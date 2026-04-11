import {
  differenceInDays,
  format,
  formatDistanceToNow,
  parseISO,
} from "date-fns";
import type { DateFormat, TimeFormat } from "./types";

export const DATE_TOKENS: Record<DateFormat, string> = {
  "YYYY-MM-DD": "yyyy-MM-dd",
  "DD/MM/YYYY": "dd/MM/yyyy",
  "MM/DD/YYYY": "MM/dd/yyyy",
};

export const TIME_TOKENS: Record<TimeFormat, string> = {
  "12h": "h:mm a",
  "24h": "HH:mm",
};

export function toDate(input: string | Date): Date {
  return typeof input === "string" ? parseISO(input) : input;
}

interface FormatOptions {
  relative?: boolean;
}

export function formatDate(
  input: string | Date,
  dateFormat: DateFormat,
  options: FormatOptions = {},
): string {
  const { relative = true } = options;
  const date = toDate(input);

  if (relative && Math.abs(differenceInDays(new Date(), date)) < 7) {
    return formatDistanceToNow(date, { addSuffix: true });
  }

  return format(date, DATE_TOKENS[dateFormat]);
}

export function formatDateTime(
  input: string | Date,
  dateFormat: DateFormat,
  timeFormat: TimeFormat,
  options: FormatOptions = {},
): string {
  const { relative = true } = options;
  const date = toDate(input);

  if (relative && Math.abs(differenceInDays(new Date(), date)) < 7) {
    return formatDistanceToNow(date, { addSuffix: true });
  }

  return format(date, `${DATE_TOKENS[dateFormat]} ${TIME_TOKENS[timeFormat]}`);
}
