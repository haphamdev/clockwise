import { apiClient } from "@/lib/api-client";
import type { UpdateUserPreferencesPayload, UserPreferences } from "./types";

export function fetchUserPreferences() {
  return apiClient<UserPreferences>("/users/me/preferences");
}

export function updateUserPreferences(payload: UpdateUserPreferencesPayload) {
  return apiClient<UserPreferences>("/users/me/preferences", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}
