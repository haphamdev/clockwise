import { apiClient, getAccessToken } from "@/lib/api-client";
import type {
  ImportExecutePayload,
  ImportExecuteResponse,
  ImportJobListResponse,
  ImportJobResponse,
  ImportPreviewPayload,
  ImportPreviewResponse,
} from "./types";

export function previewImport(payload: ImportPreviewPayload) {
  return apiClient<ImportPreviewResponse>("/import/preview", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function executeImport(payload: ImportExecutePayload) {
  return apiClient<ImportExecuteResponse>("/import/execute", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function fetchImportJob(jobId: string) {
  return apiClient<ImportJobResponse>(`/import/jobs/${jobId}`);
}

export function fetchImportJobs(params: {
  page?: number;
  limit?: number;
  type?: string;
}) {
  const search = new URLSearchParams();
  if (params.page) search.set("page", String(params.page));
  if (params.limit) search.set("limit", String(params.limit));
  if (params.type) search.set("type", params.type);
  return apiClient<ImportJobListResponse>(`/import/jobs?${search.toString()}`);
}

export async function downloadTemplate(type: string) {
  const token = getAccessToken();
  const headers: HeadersInit = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`/api/v1/import/template/${type}`, {
    headers,
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to download template");

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${type}-import-template.csv`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 100);
}
