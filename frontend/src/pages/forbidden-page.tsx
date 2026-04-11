import { ShieldX } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function ForbiddenPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <ShieldX className="h-12 w-12 text-muted-foreground" />
      <h1 className="mt-4 text-2xl font-semibold">Access Denied</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        You don't have permission to view this page.
      </p>
      <Button asChild variant="outline" className="mt-6">
        <Link to="/dashboard">Go to Dashboard</Link>
      </Button>
    </div>
  );
}
