export interface TaskEntity {
  id: string;
  projectId: string;
  label: string;
  labelNormalized: string;
  description: string | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}
