import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { IMPORT_TYPE_CONFIG } from "@/lib/import/import-type-config";
import type {
  ImportRow,
  ImportType,
  ImportValidationError,
} from "@/lib/import/types";
import { ImportCellValue } from "./import-cell-value";

interface ImportPreviewTableProps {
  type: ImportType;
  validRows: ImportRow[];
  errors: ImportValidationError[];
}

export function ImportPreviewTable({
  type,
  validRows,
  errors,
}: ImportPreviewTableProps) {
  const config = IMPORT_TYPE_CONFIG[type];

  const errorsByRow = new Map<number, ImportValidationError[]>();
  for (const err of errors) {
    const list = errorsByRow.get(err.row) || [];
    list.push(err);
    errorsByRow.set(err.row, list);
  }

  const allRowNumbers = new Set([
    ...validRows.map((r) => r.rowNumber),
    ...errors.map((e) => e.row),
  ]);
  const sortedRowNumbers = [...allRowNumbers].sort((a, b) => a - b);

  const validRowMap = new Map(validRows.map((r) => [r.rowNumber, r]));

  const errorDataMap = new Map<number, Record<string, string>>();
  for (const err of errors) {
    if (err.data && !errorDataMap.has(err.row)) {
      errorDataMap.set(err.row, err.data);
    }
  }

  return (
    <div className="max-h-[32rem] overflow-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-14">Row</TableHead>
            <TableHead>Status</TableHead>
            {config.columns.map((col) => (
              <TableHead key={col.dataKey}>{col.header}</TableHead>
            ))}
            <TableHead>Details</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedRowNumbers.map((rowNum) => {
            const validRow = validRowMap.get(rowNum);
            const rowErrors = errorsByRow.get(rowNum);
            const isValid = validRow && !rowErrors;
            const rowData = validRow?.data ?? errorDataMap.get(rowNum);

            return (
              <TableRow
                key={rowNum}
                className={
                  isValid
                    ? "bg-green-50 dark:bg-green-950/20"
                    : "bg-red-50 dark:bg-red-950/20"
                }
              >
                <TableCell className="font-mono text-xs">{rowNum}</TableCell>
                <TableCell>
                  {isValid ? (
                    <Badge
                      variant="secondary"
                      className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                    >
                      Valid
                    </Badge>
                  ) : (
                    <Badge variant="destructive">Invalid</Badge>
                  )}
                </TableCell>
                {config.columns.map((col) => (
                  <TableCell key={col.dataKey}>
                    <ImportCellValue
                      value={rowData?.[col.dataKey]}
                      isList={col.isList}
                    />
                  </TableCell>
                ))}
                <TableCell>
                  {rowErrors ? (
                    <ul className="list-disc pl-4 text-xs text-destructive">
                      {rowErrors.map((e) => (
                        <li key={`${e.field ?? ""}-${e.message}`}>
                          {e.field ? `${e.field}: ${e.message}` : e.message}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    (config.detailsKey && rowData?.[config.detailsKey]) || "-"
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
