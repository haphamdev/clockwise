export interface ImportRow {
  rowNumber: number;
  data: Record<string, string>;
}

export interface ImportValidationError {
  row: number;
  field: string;
  message: string;
  data?: Record<string, string>;
}

export interface ImportPreviewResult {
  /** Clean rows for the API response (no internal fields) */
  validRows: ImportRow[];
  /** Full rows with resolved IDs for caching/execution */
  executableRows: ImportRow[];
  errors: ImportValidationError[];
  totalRows: number;
}

export interface ImportResult {
  totalRows: number;
  imported: number;
  errors: ImportValidationError[];
}

export interface ImportCallerContext {
  userId: string;
  orgId: string;
  isAdmin: boolean;
}

export interface ImportProcessor {
  readonly type: string;
  parseAndValidate(
    csvContent: string,
    ctx: ImportCallerContext,
  ): Promise<ImportPreviewResult>;
  execute(
    validRows: ImportRow[],
    ctx: ImportCallerContext,
  ): Promise<ImportResult>;
}
