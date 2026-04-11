import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { queryClient } from "@/lib/query-client";
import type { TeamRole } from "@/lib/teams/types";
import { useAddTeamMember } from "@/lib/teams/use-add-team-member";
import { useTeams } from "@/lib/teams/use-teams";
import { usersKeys } from "@/lib/users/users-keys";

interface AddToTeamSheetProps {
  userId: string;
  existingTeamIds: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddToTeamSheet({
  userId,
  existingTeamIds,
  open,
  onOpenChange,
}: AddToTeamSheetProps) {
  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [role, setRole] = useState<TeamRole>("member");

  const { data: teamsData } = useTeams({ limit: 100 });
  const addMember = useAddTeamMember();

  const existingIds = new Set(existingTeamIds);
  const teamOptions =
    teamsData?.data
      .filter((t) => !existingIds.has(t.id) && !t.isArchived)
      .map((t) => ({ value: t.id, label: t.name })) ?? [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeamId) return;
    addMember.mutate(
      { teamId: selectedTeamId, payload: { userId, role } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: usersKeys.all });
          setSelectedTeamId("");
          setRole("member");
          onOpenChange(false);
        },
      },
    );
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Add to Team</SheetTitle>
          <SheetDescription>Select a team and assign a role.</SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label>Team</Label>
            <Combobox
              options={teamOptions}
              value={selectedTeamId}
              onChange={setSelectedTeamId}
              placeholder="Choose a team"
              searchPlaceholder="Search teams..."
              emptyText="No teams found."
            />
          </div>
          <div className="space-y-2">
            <Label>Role</Label>
            <Select value={role} onValueChange={(v) => setRole(v as TeamRole)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="member">Member</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            type="submit"
            disabled={!selectedTeamId || addMember.isPending}
            className="w-full"
          >
            {addMember.isPending ? "Adding..." : "Add to Team"}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
