import { ChevronDown, Loader2 } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { showErrorToast } from "@/lib/api-error-toast";
import type { DemoRole } from "@/lib/auth/types";
import { useDemoLogin } from "@/lib/auth/use-demo-login";
import { cn } from "@/lib/utils";

const DEMO_OPTIONS: Array<{
  role: DemoRole;
  label: string;
  hint: string;
}> = [
  {
    role: "member",
    label: "Log in as Team Member",
    hint: "Log time, view your dashboard",
  },
  {
    role: "manager",
    label: "Log in as Manager",
    hint: "Team reports & member management",
  },
  {
    role: "admin",
    label: "Log in as Admin",
    hint: "Org settings, users, invitations, imports",
  },
];

export function DemoLoginCard({
  defaultOpen = false,
}: {
  defaultOpen?: boolean;
} = {}) {
  const [open, setOpen] = useState(defaultOpen);
  const navigate = useNavigate();
  const demo = useDemoLogin();

  const handleDemo = (role: DemoRole) => {
    demo.mutate(role, {
      onSuccess: (user) => {
        if (user) {
          navigate("/dashboard", { replace: true });
        } else {
          showErrorToast(null, "Demo login failed");
        }
      },
      onError: (err) => showErrorToast(err, "Demo login failed"),
    });
  };

  return (
    <Card>
      <CardContent className="p-2">
        <Button
          type="button"
          variant="ghost"
          className="w-full justify-between"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          Just exploring? Try a live demo
          <ChevronDown
            className={cn("transition-transform", open && "rotate-180")}
          />
        </Button>

        {open && (
          <div className="mt-2 space-y-2">
            {DEMO_OPTIONS.map((opt) => {
              const isLoading = demo.isPending && demo.variables === opt.role;
              return (
                <Button
                  key={opt.role}
                  type="button"
                  variant="outline"
                  className="h-auto w-full flex-col items-start gap-0.5 py-2 text-left"
                  disabled={demo.isPending}
                  onClick={() => handleDemo(opt.role)}
                >
                  <span className="flex items-center gap-2 font-medium">
                    {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                    {opt.label}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {opt.hint}
                  </span>
                </Button>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
