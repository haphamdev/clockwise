import type { ChartMode } from "@/lib/reports/chart-utils";
import type { ReportGranularity } from "./types";

/**
 * Granularity ↔ single-char URL codes.
 * URL uses compact codes (d, w, m, q) to keep params short.
 */
const GRAN_TO_CODE: Record<ReportGranularity, string> = {
  day: "d",
  week: "w",
  month: "m",
  quarter: "q",
};

const CODE_TO_GRAN: Record<string, ReportGranularity> = {
  d: "day",
  w: "week",
  m: "month",
  q: "quarter",
};

export function granularityToCode(gran: ReportGranularity): string {
  return GRAN_TO_CODE[gran];
}

export function codeToGranularity(code: string): ReportGranularity | undefined {
  return CODE_TO_GRAN[code];
}

/**
 * Chart mode ↔ single-char URL codes.
 * Modes are stored as comma-separated values, positional per chart index.
 * e.g. "g,s" → chart 0 = grouped, chart 1 = stacked.
 */
const MODE_TO_CODE: Record<ChartMode, string> = {
  stacked: "s",
  grouped: "g",
};

const CODE_TO_MODE: Record<string, ChartMode> = {
  s: "stacked",
  g: "grouped",
};

/**
 * Parse a comma-separated chart mode param into an array of ChartMode values.
 * Missing or invalid positions fall back to the corresponding default.
 */
export function parseChartModes(
  param: string,
  defaults: ChartMode[],
): ChartMode[] {
  if (!param) return [...defaults];
  const codes = param.split(",");
  return defaults.map((def, i) => CODE_TO_MODE[codes[i]] ?? def);
}

/**
 * Serialize an array of ChartMode values into a comma-separated URL param.
 */
export function serializeChartModes(modes: ChartMode[]): string {
  return modes.map((m) => MODE_TO_CODE[m]).join(",");
}

/**
 * Parse a comma-separated list of IDs from a URL param.
 * Returns empty array for empty/falsy input.
 */
export function parseIds(value: string): string[] {
  return value ? value.split(",").filter(Boolean) : [];
}
