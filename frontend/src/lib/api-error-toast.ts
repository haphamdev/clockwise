import { toast } from "sonner";
import { ApiError } from "@/lib/api-client";

export function showErrorToast(err: unknown, fallback: string): void {
  if (err instanceof ApiError) {
    const description = Array.isArray(err.serverMessage)
      ? err.serverMessage.join("\n")
      : err.serverMessage;
    toast.error(fallback, { description });
  } else {
    toast.error(fallback);
  }
}
