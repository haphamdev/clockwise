import { cva, type VariantProps } from "class-variance-authority";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const taskDisplayVariants = cva("border text-foreground", {
  variants: {
    variant: {
      badge: "inline-flex items-center rounded-md px-2 py-0.5 text-xs",
      inline:
        "inline-flex items-baseline gap-1.5 rounded-md px-2.5 py-1 text-sm",
      block: "rounded-md px-2.5 py-1.5 text-sm",
    },
  },
  defaultVariants: {
    variant: "badge",
  },
});

interface TaskDisplayProps extends VariantProps<typeof taskDisplayVariants> {
  task: { id: string; label: string; description: string | null };
  showDescription?: boolean;
  className?: string;
}

export function TaskDisplay({
  task,
  variant = "badge",
  showDescription,
  className,
}: TaskDisplayProps) {
  const resolvedShowDescription = showDescription ?? variant !== "badge";
  const hasTooltip = !resolvedShowDescription && task.description != null;

  const content = (
    <span className={cn(taskDisplayVariants({ variant }), className)}>
      <span className={variant !== "badge" ? "font-medium" : undefined}>
        {task.label}
      </span>
      {resolvedShowDescription && task.description && (
        <span
          className={cn(
            "text-muted-foreground text-xs",
            variant === "block" ? "mt-0.5 block" : "truncate",
          )}
        >
          {task.description}
        </span>
      )}
    </span>
  );

  if (!hasTooltip) return content;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent>{task.description}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
