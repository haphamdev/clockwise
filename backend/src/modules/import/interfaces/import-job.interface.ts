import { ImportRow, ImportValidationError } from './import-processor.interface';

export interface ImportJobData {
  type: string;
  executableRows: ImportRow[];
  userId: string;
  orgId: string;
  isAdmin: boolean;
  importJobId: string;
}

export type ImportJobStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface ImportJobResult {
  status: ImportJobStatus;
  totalRows: number;
  imported: number;
  errors: ImportValidationError[];
  completedAt?: string;
}
