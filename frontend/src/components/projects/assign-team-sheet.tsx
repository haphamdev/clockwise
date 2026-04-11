import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { ComboboxOption } from "@/components/ui/combobox";
import { Combobox } from "@/components/ui/combobox";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useAuth } from "@/lib/auth/use-auth";
import type { ProjectTeam } from "@/lib/projects/types";
import { useAssignProjectTeam } from "@/lib/projects/use-assign-project-team";
import { useTeams } from "@/lib/teams/use-teams";

interface AssignTeamSheetProps {
  projectId: string;
  existingTeams: ProjectTeam[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AssignTeamSheet({
  projectId,
  existingTeams,
  open,
  onOpenChange,
}: AssignTeamSheetProps) {
  const { user } = useAuth();
  const [selectedTeamId, setSelectedTeamId] = useState("");
  const assignTeam = useAssignProjectTeam();
  const { data: teamsData } = useTeams({ limit: 100 });

  const existingTeamIds = new Set(existingTeams.map((t) => t.teamId));

  const teamOptions: ComboboxOption[] = (teamsData?.data ?? [])
    .filter((t) => {
      if (existingTeamIds.has(t.id)) return false;
      if (t.isArchived) return false;
      if (user?.isAdmin) return true;
      return user?.teams.some(
        (tm) => tm.teamId === t.id && tm.role === "manager",
      );
    })
    .map((t) => ({ value: t.id, label: t.name }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeamId) return;
    assignTeam.mutate(
      { projectId, payload: { teamId: selectedTeamId } },
      {
        onSuccess: () => {
          setSelectedTeamId("");
          onOpenChange(false);
        },
      },
    );
  };

  return (
    <Sheet
      open={open}
      onOpenChange={(v) => {
        if (!v) setSelectedTeamId("");
        onOpenChange(v);
      }}
    >
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Assign Team</SheetTitle>
          <SheetDescription>Add a team to this project.</SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="space-y-2">
            <span className="text-sm font-medium">Team</span>
            <Combobox
              options={teamOptions}
              value={selectedTeamId}
              onChange={setSelectedTeamId}
              placeholder="Select a team..."
              searchPlaceholder="Search teams..."
              emptyText="No available teams."
            />
          </div>
          <Button
            type="submit"
            disabled={!selectedTeamId || assignTeam.isPending}
            className="w-full"
          >
            {assignTeam.isPending ? "Assigning..." : "Assign Team"}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
