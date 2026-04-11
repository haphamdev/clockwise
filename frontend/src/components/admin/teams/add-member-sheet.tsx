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
import type { TeamMember, TeamRole } from "@/lib/teams/types";
import { useAddTeamMember } from "@/lib/teams/use-add-team-member";
import { useUsers } from "@/lib/users/use-users";

interface AddMemberSheetProps {
  teamId: string;
  existingMembers: TeamMember[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddMemberSheet({
  teamId,
  existingMembers,
  open,
  onOpenChange,
}: AddMemberSheetProps) {
  const [selectedUserId, setSelectedUserId] = useState("");
  const [role, setRole] = useState<TeamRole>("member");

  const { data: usersData } = useUsers({ limit: 100 });
  const addMember = useAddTeamMember();

  const existingIds = new Set(existingMembers.map((m) => m.userId));
  const userOptions =
    usersData?.data
      .filter((u) => u.status === "active" && !existingIds.has(u.id))
      .map((u) => ({ value: u.id, label: `${u.name} (${u.email})` })) ?? [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) return;
    addMember.mutate(
      { teamId, payload: { userId: selectedUserId, role } },
      {
        onSuccess: () => {
          setSelectedUserId("");
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
          <SheetTitle>Add Member</SheetTitle>
          <SheetDescription>
            Search for a user and assign a role.
          </SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label>User</Label>
            <Combobox
              options={userOptions}
              value={selectedUserId}
              onChange={setSelectedUserId}
              placeholder="Choose a user"
              searchPlaceholder="Search by name or email..."
              emptyText="No users found."
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
            disabled={!selectedUserId || addMember.isPending}
            className="w-full"
          >
            {addMember.isPending ? "Adding..." : "Add Member"}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
