import { apiClient } from "@/lib/api-client";
import type { DemoRole } from "./types";

export async function fetchDemoConfig(): Promise<{ enabled: boolean }> {
  return apiClient("/auth/demo-config");
}

export async function loginAsDemo(role: DemoRole): Promise<string> {
  const { accessToken } = await apiClient<{ accessToken: string }>(
    "/auth/demo-login",
    { method: "POST", body: JSON.stringify({ role }) },
  );
  return accessToken;
}
