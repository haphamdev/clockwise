export interface MetadataDiffEntry {
  field: string;
  oldValue: string;
  newValue: string;
}

function camelToTitleCase(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .replace(/^./, (c) => c.toUpperCase());
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return "(none)";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) return value.join(", ") || "(none)";
  return String(value);
}

export function computeMetadataDiff(
  before?: Record<string, unknown>,
  after?: Record<string, unknown>,
): MetadataDiffEntry[] {
  if (!before && !after) return [];

  const beforeObj = before ?? {};
  const afterObj = after ?? {};
  const allKeys = new Set([
    ...Object.keys(beforeObj),
    ...Object.keys(afterObj),
  ]);
  const diffs: MetadataDiffEntry[] = [];

  for (const key of allKeys) {
    if (JSON.stringify(beforeObj[key]) === JSON.stringify(afterObj[key]))
      continue;

    diffs.push({
      field: camelToTitleCase(key),
      oldValue: key in beforeObj ? formatValue(beforeObj[key]) : "",
      newValue: key in afterObj ? formatValue(afterObj[key]) : "",
    });
  }

  return diffs;
}
