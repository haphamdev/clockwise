import { ImportJobStatus } from "@prisma/client";

export interface ImportJobEntity {
  id: string;
  orgId: string;
  userId: string;
  type: string;
  status: ImportJobStatus;
  totalRows: number;
  imported: number;
  errorCount: number;
  bullJobId: string | null;
  createdAt: Date;
  completedAt: Date | null;
}
