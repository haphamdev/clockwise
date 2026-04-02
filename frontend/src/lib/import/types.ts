export interface ImportValidationError {
  row: number;
  field: string;
  message: string;
  data?: Record<string, string>;
}

export interface ImportRow {
  rowNumber: number;
  data: Record<string, string>;
}

export interface ImportPreviewResponse {
  validRows: ImportRow[];
  errors: ImportValidationError[];
  totalRows: number;
  previewToken?: string;
}

export interface ImportPreviewPayload {
  type: string;
  csvContent: string;
}

export interface ImportExecutePayload {
  type: string;
  previewToken: string;
}

export interface ImportExecuteResponse {
  jobId: string;
  totalRows: number;
}

export type ImportJobStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface ImportJobResponse {
  jobId: string;
  status: ImportJobStatus;
  totalRows: number;
  imported: number;
  errors: ImportValidationError[];
  completedAt?: string;
}
