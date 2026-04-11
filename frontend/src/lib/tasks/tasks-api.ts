import { apiClient } from "@/lib/api-client";
import type { PaginatedResponse } from "@/lib/types";
import type { Task } from "./types";

export function searchTasks(projectId: string, query: string) {
  const searchParams = new URLSearchParams();
  if (query) searchParams.set("q", query);
  searchParams.set("limit", "10");
  const qs = searchParams.toString();
  return apiClient<PaginatedResponse<Task>>(
    `/projects/${projectId}/tasks${qs ? `?${qs}` : ""}`,
  );
}
