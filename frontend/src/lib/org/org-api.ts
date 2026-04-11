import { apiClient } from "@/lib/api-client";
import type { OrgSettings, UpdateOrgSettingsPayload } from "./types";

export function fetchOrgSettings() {
  return apiClient<OrgSettings>("/org/settings");
}

export function updateOrgSettings(payload: UpdateOrgSettingsPayload) {
  return apiClient<OrgSettings>("/org/settings", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}
