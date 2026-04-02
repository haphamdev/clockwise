export interface TimeLogEntity {
  id: string;
  userId: string;
  projectId: string;
  date: Date;
  hours: number;
  notes: string | null;
  status: 'active' | 'archived';
  createdAt: Date;
  updatedAt: Date;
}

export interface TimeLogTaskEntity {
  id: string;
  label: string;
  description: string | null;
}

export interface TimeLogListItem extends TimeLogEntity {
  user: { id: string; name: string };
  project: { id: string; name: string };
  tasks: TimeLogTaskEntity[];
}

export interface Warning {
  type: 'daily_limit' | 'weekly_limit';
  message: string;
  currentHours: number;
  threshold: number;
}
