import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useTeamBreakdown } from "@/lib/dashboard/use-team-breakdown";
import { TeamBreakdownCard } from "./team-breakdown-card";

interface TeamBreakdownSectionProps {
  enabled: boolean;
  isAdmin: boolean;
}

export function TeamBreakdownSection({
  enabled,
  isAdmin,
}: TeamBreakdownSectionProps) {
  const { data, isLoading, isError } = useTeamBreakdown(enabled);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);

  if (!enabled) return null;

  if (isLoading) {
    return (
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Team Breakdown</h2>
        <Skeleton className="h-10 w-60" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Team Breakdown</h2>
        <p className="text-sm text-destructive">
          Failed to load team breakdown.
        </p>
      </div>
    );
  }

  if (!data || data.teams.length === 0) return null;

  const activeTeamId = selectedTeamId ?? data.teams[0].teamId;
  const selectedTeam = data.teams.find((t) => t.teamId === activeTeamId);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-semibold">Team Breakdown</h2>
        <Select value={activeTeamId} onValueChange={setSelectedTeamId}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {data.teams.map((team) => (
              <SelectItem key={team.teamId} value={team.teamId}>
                {team.teamName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {selectedTeam && (
        <TeamBreakdownCard team={selectedTeam} isAdmin={isAdmin} />
      )}
    </div>
  );
}
