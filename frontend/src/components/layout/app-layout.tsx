import { Outlet } from "react-router-dom";
import { Navbar } from "@/components/layout/navbar";
import { Toaster } from "@/components/ui/sonner";
import { useSyncTheme } from "@/lib/user-preferences/use-sync-theme";

export function AppLayout() {
  useSyncTheme();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <Outlet />
      </main>
      <Toaster />
    </div>
  );
}
