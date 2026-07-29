import { Link } from "react-router-dom";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface ProjectLinkProps {
  id: string;
  name: string;
  description?: string | null;
  status?: string;
}

export function ProjectLink({
  id,
  name,
  description,
  status,
}: ProjectLinkProps) {
  const isArchived = status === "archived";
  const hasTooltip = !!description || isArchived;

  const link = (
    <Link
      to={`/projects/${id}`}
      className={cn(
        "text-sm font-medium hover:underline",
        isArchived && "line-through text-muted-foreground",
      )}
    >
      {name}
    </Link>
  );

  if (!hasTooltip) return link;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent>
        <div className="flex flex-col items-start gap-1">
          {description && <span>{description}</span>}
          {isArchived && <StatusBadge status="archived" />}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
