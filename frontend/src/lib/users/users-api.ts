import { apiClient } from "@/lib/api-client";
import type { PaginatedResponse } from "@/lib/types";
import type { ListUsersParams, UpdateUserPayload, User } from "./types";

export function fetchUsers(params: ListUsersParams = {}) {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set("page", String(params.page));
  if (params.limit) searchParams.set("limit", String(params.limit));
  if (params.search) searchParams.set("search", params.search);
  if (params.status) searchParams.set("status", params.status);
  if (params.teamId) searchParams.set("teamId", params.teamId);
  if (params.projectId) searchParams.set("projectId", params.projectId);
  const qs = searchParams.toString();
  return apiClient<PaginatedResponse<User>>(`/users${qs ? `?${qs}` : ""}`);
}

export function fetchMyProfile() {
  return apiClient<User>("/users/me");
}

export function fetchUserDetail(id: string) {
  return apiClient<User>(`/users/${id}`);
}

export function updateUser(id: string, payload: UpdateUserPayload) {
  return apiClient<User>(`/users/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function deactivateUser(id: string) {
  return apiClient<{ message: string }>(`/users/${id}/deactivate`, {
    method: "PATCH",
  });
}

export function reactivateUser(id: string) {
  return apiClient<{ message: string }>(`/users/${id}/reactivate`, {
    method: "PATCH",
  });
}
