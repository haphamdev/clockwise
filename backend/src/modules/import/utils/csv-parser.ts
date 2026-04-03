import { ImportValidationError } from '../interfaces/import-processor.interface';

/** Parse CSV content handling quoted fields with commas, escaped quotes, and newlines per RFC 4180. */
export function parseCsv(content: string): string[][] {
  const rows: string[][] = [];
  let current = '';
  let inQuotes = false;
  let fields: string[] = [];
  let i = 0;

  while (i < content.length) {
    const ch = content[i];

    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < content.length && content[i + 1] === '"') {
          current += '"';
          i += 2;
        } else {
          inQuotes = false;
          i++;
        }
      } else {
        current += ch;
        i++;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
        i++;
      } else if (ch === ',') {
        fields.push(current);
        current = '';
        i++;
      } else if (ch === '\r' || ch === '\n') {
        fields.push(current);
        current = '';
        rows.push(fields);
        fields = [];
        if (ch === '\r' && i + 1 < content.length && content[i + 1] === '\n') {
          i += 2;
        } else {
          i++;
        }
      } else {
        current += ch;
        i++;
      }
    }
  }

  // Push last field/row if content doesn't end with newline
  if (fields.length > 0 || current.length > 0) {
    fields.push(current);
    rows.push(fields);
  }

  // Filter out completely empty trailing rows
  while (rows.length > 0) {
    const last = rows[rows.length - 1];
    if (last.length === 1 && last[0].trim() === '') {
      rows.pop();
    } else {
      break;
    }
  }

  return rows;
}

export function validateHeaders(
  headerRow: string[],
  expectedHeaders: string[],
): { columnMap: Map<string, number> } | { error: ImportValidationError } {
  const normalized = headerRow.map((h) => h.trim().toLowerCase());
  const missing = expectedHeaders.filter((h) => !normalized.includes(h));
  if (missing.length > 0) {
    return {
      error: {
        row: 1,
        field: '',
        message: `CSV headers must include: ${expectedHeaders.join(', ')}. Missing: ${missing.join(', ')}`,
      },
    };
  }
  const columnMap = new Map<string, number>();
  for (const header of expectedHeaders) {
    columnMap.set(header, normalized.indexOf(header));
  }
  return { columnMap };
}

/** Split a comma-separated string into trimmed, non-empty values. */
export function parseCommaSeparated(value: string): string[] {
  if (!value) return [];
  return value.split(',').map((s) => s.trim()).filter((s) => s.length > 0);
}
