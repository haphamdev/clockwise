import type { PaginationParams } from '@/lib/types';

export interface TimeLogTask {
  id: string;
  label: string;
  description: string | null;
}

export interface TimeLogUser {
  id: string;
  name: string;
}

export interface TimeLogProject {
  id: string;
  name: string;
}

export type TimeLogStatus = 'active' | 'archived';

export interface TimeLog {
  id: string;
  userId: string;
  projectId: string;
  date: string;
  hours: number;
  notes: string | null;
  status: TimeLogStatus;
  user: TimeLogUser;
  project: TimeLogProject;
  tasks: TimeLogTask[];
  createdAt: string;
  updatedAt: string;
}

export interface Warning {
  type: 'daily_limit' | 'weekly_limit';
  message: string;
  currentHours: number;
  threshold: number;
}

export interface TimeLogWithWarnings {
  timeLog: TimeLog;
  warnings: Warning[];
}

export interface TimeLogListResponse {
  data: TimeLog[];
  total: number;
  totalHours: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateTimeLogPayload {
  projectId: string;
  taskLabels: string[];
  date: string;
  hours: number;
  notes?: string;
}

export interface UpdateTimeLogPayload {
  taskLabels?: string[];
  date?: string;
  hours?: number;
  notes?: string;
  reason: string;
}

export interface ArchiveTimeLogPayload {
  reason: string;
}

export interface WarningsPreviewParams {
  date: string;
  projectId?: string;
  hours?: number;
}

export interface ListTimeLogsParams extends PaginationParams {
  dateFrom?: string;
  dateTo?: string;
  projectId?: string;
  userId?: string;
  teamId?: string;
  includeArchived?: boolean;
}
