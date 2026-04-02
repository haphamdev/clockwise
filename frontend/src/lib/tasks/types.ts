export interface Task {
  id: string;
  projectId: string;
  label: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}
