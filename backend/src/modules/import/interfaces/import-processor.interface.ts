export interface ImportRow {
  rowNumber: number;
  data: Record<string, string>;
}

export interface ImportValidationError {
  row: number;
  field: string;
  message: string;
}

export interface ImportPreviewResult {
  validRows: ImportRow[];
  errors: ImportValidationError[];
  totalRows: number;
}

export interface ImportResult {
  totalRows: number;
  imported: number;
  errors: ImportValidationError[];
}

export interface ImportProcessor {
  readonly type: string;
  parseAndValidate(
    csvContent: string,
    userId: string,
    orgId: string,
  ): Promise<ImportPreviewResult>;
  execute(
    validRows: ImportRow[],
    userId: string,
    orgId: string,
  ): Promise<ImportResult>;
}
