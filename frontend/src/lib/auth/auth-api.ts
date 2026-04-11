import {
  ApiError,
  apiClient,
  getAccessToken,
  refreshAccessToken,
  setAccessToken,
} from "@/lib/api-client";
import type { UserProfile } from "./types";

export async function fetchCurrentUser(): Promise<UserProfile | null> {
  if (!getAccessToken()) {
    const refreshed = await refreshAccessToken();
    if (!refreshed) return null;
  }
  try {
    return await apiClient<UserProfile>("/auth/me");
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) {
      setAccessToken(null);
      return null;
    }
    throw err;
  }
}

export async function logoutUser(): Promise<void> {
  try {
    await apiClient("/auth/logout", { method: "POST" });
  } catch {
    // Server logout failed, still clear locally
  }
  setAccessToken(null);
}
